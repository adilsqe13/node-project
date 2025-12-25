const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const config = require('../config');

class ScraperService {
  /**
   * Scrape article content from a URL using Cheerio (fast method)
   * @param {string} url - URL to scrape
   * @returns {Promise<Object>} Scraped content object
   */
  async scrapeWithCheerio(url) {
    try {
      console.log(`Scraping with Cheerio: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': config.google.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, iframe, noscript').remove();
      $('.advertisement, .ads, .social-share, .comments').remove();
      
      // Try to find the main content area
      let content = '';
      let title = '';
      
      // Extract title
      title = $('h1').first().text().trim() || 
              $('title').first().text().trim() ||
              $('meta[property="og:title"]').attr('content') || '';
      
      // Try multiple selectors for article content
      const contentSelectors = [
        'article',
        '[role="main"]',
        '.post-content',
        '.article-content',
        '.entry-content',
        '.content',
        'main',
        '.post',
        '.blog-post'
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          if (content.length > 200) { // Ensure we got substantial content
            break;
          }
        }
      }
      
      // Fallback: get all paragraphs if no content found
      if (!content || content.length < 200) {
        const paragraphs = [];
        $('p').each((i, elem) => {
          const text = $(elem).text().trim();
          if (text.length > 30) { // Skip very short paragraphs
            paragraphs.push(text);
          }
        });
        content = paragraphs.join('\n\n');
      }
      
      // Clean up the content
      content = content
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
        .trim();
      
      console.log(`Scraped ${content.length} characters`);
      
      return {
        url: url,
        title: title,
        content: content,
        method: 'cheerio'
      };
      
    } catch (error) {
      console.error(`Cheerio scraping failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Scrape article content from a URL using Puppeteer (for dynamic content)
   * @param {string} url - URL to scrape
   * @returns {Promise<Object>} Scraped content object
   */
  async scrapeWithPuppeteer(url) {
    let browser = null;
    
    try {
      console.log(`Scraping with Puppeteer: ${url}`);
      
      browser = await puppeteer.launch(config.puppeteer);
      const page = await browser.newPage();
      
      await page.setUserAgent(config.google.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });
      
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait a bit for dynamic content to load
      await page.waitForTimeout(2000);
      
      // Extract content from the page
      const scrapedData = await page.evaluate(() => {
        // Remove unwanted elements
        const unwantedSelectors = [
          'script', 'style', 'nav', 'header', 'footer', 
          'aside', 'iframe', 'noscript', '.advertisement', 
          '.ads', '.social-share', '.comments'
        ];
        
        unwantedSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        // Get title
        let title = '';
        const h1 = document.querySelector('h1');
        if (h1) {
          title = h1.innerText.trim();
        } else {
          const titleTag = document.querySelector('title');
          if (titleTag) title = titleTag.innerText.trim();
        }
        
        // Get content
        let content = '';
        const contentSelectors = [
          'article',
          '[role="main"]',
          '.post-content',
          '.article-content',
          '.entry-content',
          '.content',
          'main',
          '.post',
          '.blog-post'
        ];
        
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            content = element.innerText.trim();
            if (content.length > 200) break;
          }
        }
        
        // Fallback: get all paragraphs
        if (!content || content.length < 200) {
          const paragraphs = Array.from(document.querySelectorAll('p'))
            .map(p => p.innerText.trim())
            .filter(text => text.length > 30);
          content = paragraphs.join('\n\n');
        }
        
        return { title, content };
      });
      
      await browser.close();
      
      // Clean up the content
      const cleanContent = scrapedData.content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
      
      console.log(`Scraped ${cleanContent.length} characters`);
      
      return {
        url: url,
        title: scrapedData.title,
        content: cleanContent,
        method: 'puppeteer'
      };
      
    } catch (error) {
      console.error(`Puppeteer scraping failed for ${url}:`, error.message);
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  }

  /**
   * Scrape article content with fallback mechanism
   * @param {string} url - URL to scrape
   * @returns {Promise<Object>} Scraped content object
   */
  async scrapeArticle(url) {
    try {
      // Try Cheerio first (faster)
      try {
        const result = await this.scrapeWithCheerio(url);
        if (result.content && result.content.length > 200) {
          return result;
        }
      } catch (cheerioError) {
        console.log(`Cheerio failed, trying Puppeteer...`);
      }
      
      // Fallback to Puppeteer
      return await this.scrapeWithPuppeteer(url);
      
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error.message);
      return {
        url: url,
        title: 'Scraping Failed',
        content: `Failed to scrape content from ${url}`,
        method: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Scrape multiple URLs
   * @param {Array} urls - Array of URLs to scrape
   * @returns {Promise<Array>} Array of scraped content objects
   */
  async scrapeMultiple(urls) {
    console.log(`Scraping ${urls.length} articles...`);
    
    const results = [];
    
    for (let i = 0; i < urls.length; i++) {
      console.log(`\n[${i + 1}/${urls.length}] Scraping article...`);
      try {
        const result = await this.scrapeArticle(urls[i]);
        results.push(result);
        
        // Add a small delay between requests to be polite
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to scrape URL ${urls[i]}:`, error.message);
        results.push({
          url: urls[i],
          title: 'Error',
          content: 'Failed to scrape content',
          error: error.message
        });
      }
    }
    
    console.log(`\nCompleted scraping ${results.length} articles`);
    return results;
  }
}

module.exports = new ScraperService();