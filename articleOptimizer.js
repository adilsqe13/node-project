const laravelService = require('./services/laravelService');
const googleService = require('./services/googleService');
const scraperService = require('./services/scraperService');
const llmService = require('./services/llmService');

class ArticleOptimizer {
  /**
   * Main optimization workflow
   * @param {number|null} articleId - Specific article ID or null for latest
   * @returns {Promise<Object>} Optimization result
   */
  async optimize(articleId = null) {
    try {
      console.log('\n' + '='.repeat(70));
      console.log('STARTING ARTICLE OPTIMIZATION WORKFLOW');
      console.log('='.repeat(70) + '\n');

      // Step 1: Fetch the article
      console.log('STEP 1: Fetching Article from Laravel API');
      console.log('-'.repeat(70));
      
      let article;
      if (articleId) {
        article = await laravelService.fetchArticleById(articleId);
      } else {
        article = await laravelService.fetchLatestArticle();
      }
      
      console.log(`Retrieved article: "${article.title}"`);
      console.log(`ID: ${article.id}`);
      console.log(`URL: ${article.url}`);

      // Step 2: Search Google
      console.log('\nSTEP 2: Searching Google for Similar Articles');
      console.log('-'.repeat(70));
      
      const searchResults = await googleService.searchByTitle(article.title);
      
      if (searchResults.length === 0) {
        throw new Error('No search results found. Cannot proceed with optimization.');
      }
      
      console.log(`Found ${searchResults.length} relevant articles on Google`);

      // Step 3: Scrape reference articles
      console.log('\nSTEP 3: Scraping Reference Articles');
      console.log('-'.repeat(70));
      
      const urlsToScrape = searchResults.map(result => result.url);
      const scrapedArticles = await scraperService.scrapeMultiple(urlsToScrape);
      
      // Filter out failed scrapes
      const validArticles = scrapedArticles.filter(
        article => article.content && article.content.length > 200 && !article.error
      );
      
      if (validArticles.length === 0) {
        throw new Error('Failed to scrape any valid content. Cannot proceed with optimization.');
      }
      
      console.log(`Successfully scraped ${validArticles.length} articles`);
      validArticles.forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.title.substring(0, 60)}...`);
        console.log(`      Content length: ${article.content.length} characters`);
      });

      // Step 4: Generate optimized article using LLM
      console.log('\nSTEP 4: Generating Optimized Article with LLM');
      console.log('-'.repeat(70));
      
      const optimizedArticle = await llmService.generateOptimizedArticle(
        article,
        validArticles
      );
      
      console.log('Generated optimized article');
      console.log(`   Title: ${optimizedArticle.title}`);
      console.log(`   Content length: ${optimizedArticle.content.length} characters`);

      // Step 5: Update article in Laravel
      console.log('\nSTEP 5: Publishing Optimized Article');
      console.log('-'.repeat(70));
      
      const updatedArticle = await laravelService.updateArticle(
        article.id,
        optimizedArticle
      );
      
      console.log('Article successfully updated in database');
      console.log(`   Article ID: ${updatedArticle.id}`);
      console.log(`   Updated at: ${updatedArticle.updated_at}`);

      // Summary
      console.log('\n' + '='.repeat(70));
      console.log('OPTIMIZATION COMPLETE!');
      console.log('='.repeat(70));
      console.log('\nSUMMARY:');
      console.log(`   Original Article: "${article.title}"`);
      console.log(`   Article ID: ${article.id}`);
      console.log(`   Reference Articles Used: ${validArticles.length}`);
      console.log(`   Generated Content Length: ${optimizedArticle.content.length} characters`);
      console.log(`   Status: Successfully Published`);
      console.log('\nThe optimized article has been saved to your Laravel database!');
      console.log('='.repeat(70) + '\n');

      return {
        success: true,
        articleId: article.id,
        title: article.title,
        originalUrl: article.url,
        referenceCount: validArticles.length,
        contentLength: optimizedArticle.content.length,
        references: validArticles.map(a => ({
          title: a.title,
          url: a.url
        }))
      };

    } catch (error) {
      console.error('\n' + '='.repeat(70));
      console.error('OPTIMIZATION FAILED');
      console.error('='.repeat(70));
      console.error(`Error: ${error.message}`);
      console.error('='.repeat(70) + '\n');
      
      throw error;
    }
  }

  /**
   * Optimize multiple articles
   * @param {Array} articleIds - Array of article IDs (empty for all)
   * @returns {Promise<Array>} Array of optimization results
   */
  async optimizeMultiple(articleIds = []) {
    try {
   

      let articlesToOptimize;
      
      if (articleIds.length > 0) {
        // Optimize specific articles
        console.log(`Optimizing ${articleIds.length} specific articles...`);
        articlesToOptimize = articleIds;
      } else {
        // Optimize all articles
        console.log('Fetching all articles for optimization...');
        const allArticles = await laravelService.fetchAllArticles();
        articlesToOptimize = allArticles.map(a => a.id);
        console.log(`Found ${articlesToOptimize.length} articles to optimize`);
      }

      const results = [];
      
      for (let i = 0; i < articlesToOptimize.length; i++) {
        const articleId = articlesToOptimize[i];
        
        console.log(`\n${'═'.repeat(70)}`);
        console.log(`PROCESSING ARTICLE ${i + 1}/${articlesToOptimize.length}`);
        console.log(`${'═'.repeat(70)}`);
        
        try {
          const result = await this.optimize(articleId);
          results.push(result);
          
          console.log(`Article ${i + 1} completed successfully`);
          
          // Add delay between articles to avoid rate limiting
          if (i < articlesToOptimize.length - 1) {
            console.log('\n Waiting 5 seconds before next article...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          
        } catch (error) {
          console.error(`Failed to optimize article ${articleId}:`, error.message);
          results.push({
            success: false,
            articleId: articleId,
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Batch optimization error:', error.message);
      throw error;
    }
  }

}

module.exports = new ArticleOptimizer();