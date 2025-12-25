const axios = require('axios');
const config = require('../config');

class LLMService {
  constructor() {
    this.provider = config.llm.provider;
  }

  /**
   * Call Google Gemini API (FREE)
   * @param {string} prompt - The prompt to send
   * @returns {Promise<string>} Generated text
   */
  async callGemini(prompt) {
    try {
      console.log('🤖 Calling Google Gemini API (FREE)...');
      
      if (!config.llm.gemini.apiKey || config.llm.gemini.apiKey.includes('your_') || config.llm.gemini.apiKey.includes('_here')) {
        throw new Error('Gemini API key not configured properly');
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.llm.gemini.model}:generateContent?key=${config.llm.gemini.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: config.llm.gemini.temperature,
            maxOutputTokens: config.llm.gemini.maxTokens,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 90000
        }
      );

      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const candidate = response.data.candidates[0];
        
        if (candidate.finishReason === 'SAFETY') {
          throw new Error('Content blocked by safety filters');
        }
        
        const generatedText = candidate.content.parts[0].text;
        console.log(`Gemini generated ${generatedText.length} characters`);
        return generatedText;
      }

      throw new Error('Invalid response from Gemini API');
      
    } catch (error) {
      console.error('Gemini API Error:', error.message);
      throw error;
    }
  }

  /**
   * Generate optimized article based on reference articles
   * @param {Object} originalArticle - Original article object
   * @param {Array} referenceArticles - Array of reference articles
   * @returns {Promise<Object>} Optimized article data
   */
  async generateOptimizedArticle(originalArticle, referenceArticles) {
    try {
      console.log('Generating optimized article...');
      console.log(`Original: "${originalArticle.title}"`);
      console.log(`References: ${referenceArticles.length} articles`);

      let generatedContent = null;
      let usingAI = false;

      // Try to use AI
      try {
        const prompt = this.buildPrompt(originalArticle, referenceArticles);
        generatedContent = await this.callGemini(prompt);
        generatedContent = this.cleanGeneratedContent(generatedContent);
        usingAI = true;
        console.log('AI optimization successful');
      } catch (aiError) {
        console.warn('AI optimization failed:', aiError.message);
        console.log('Falling back to manual content enhancement...');
        
        // Fallback: Create enhanced content manually
        generatedContent = this.createFallbackContent(originalArticle, referenceArticles);
        usingAI = false;
        console.log('Manual content enhancement complete');
      }

      // Add references section
      const fullContent = `${generatedContent}`;

      console.log('Article optimization complete');
      console.log(`Method: ${usingAI ? 'AI-Generated' : 'Manual Enhancement'}`);
      console.log(`Final content length: ${fullContent.length} characters`);

      return {
        title: originalArticle.title,
        content: fullContent,
        author: usingAI ? 'AI Optimizer' : 'Manual Optimizer',
        url: originalArticle.url,
        reference_article: [
          {
            reference_title: originalArticle.title,
            content: originalArticle.content,
            author: originalArticle.author,
            url: originalArticle.url
          }
        ]
      };

      
    } catch (error) {
      console.error('Error in article optimization:', error.message);
      
      // Last resort fallback - return original with references
      console.log('Using original content with references...');
      const fallbackContent = this.createBasicFallbackContent(originalArticle);
      
      return {
        title: originalArticle.title,
        content: `${fallbackContent}`,
        author: 'Original Content',
        url: originalArticle.url
      };
    }
  }

  /**
   * Create fallback content when AI fails
   * @param {Object} originalArticle - Original article
   * @param {Array} referenceArticles - Reference articles
   * @returns {string} Enhanced content
   */
  createFallbackContent(originalArticle, referenceArticles) {
    let content = `This content was generated automatically. The content upgrade could not be completed because the available Google Gemini API credits have been exhausted. To continue upgrading content, please upgrade your Gemini API plan.`;
    
    return content;
  }

  /**
   * Create basic fallback content (last resort)
   * @param {Object} originalArticle - Original article
   * @returns {string} Basic content
   */
  createBasicFallbackContent(originalArticle) {
    let content = `<h2>${originalArticle.title}</h2>\n\n`;
    
    content += `<p>This article covers important information about <strong>${originalArticle.title}</strong>. `;
    content += `For the most comprehensive and up-to-date information on this topic, please visit the `;
    content += `original source at:</p>\n\n`;
    
    content += `<p><a href="${originalArticle.url}" target="_blank" rel="noopener noreferrer">${originalArticle.url}</a></p>\n\n`;
    
    content += `<p>This content has been preserved for reference purposes and includes citations to `;
    content += `related industry resources below.</p>\n`;
    
    return content;
  }

  /**
   * Build prompt for LLM
   * @param {Object} originalArticle - Original article
   * @param {Array} referenceArticles - Reference articles
   * @returns {string} Formatted prompt
   */
  buildPrompt(originalArticle, referenceArticles) {
    let referencesText = '';
    referenceArticles.forEach((article, index) => {
      const contentPreview = article.content.substring(0, 1500);
      referencesText += `\n--- REFERENCE ARTICLE ${index + 1} ---\n`;
      referencesText += `Title: ${article.title}\n`;
      referencesText += `URL: ${article.url}\n`;
      referencesText += `Content Preview: ${contentPreview}...\n`;
    });

    const prompt = `You are an expert content writer and SEO specialist. Your task is to rewrite and optimize an article to match the style, formatting, and quality of top-ranking articles.

ORIGINAL ARTICLE:
Title: ${originalArticle.title}
URL: ${originalArticle.url}

TOP-RANKING REFERENCE ARTICLES:
${referencesText}

YOUR TASK:
1. Analyze the formatting, structure, and writing style of the reference articles
2. Rewrite the article about "${originalArticle.title}" to match the style and quality of the top-ranking articles
3. Maintain the core topic and message
4. Use similar headings structure, paragraph length, and content organization as the references
5. Make the content engaging, informative, and SEO-friendly
6. Ensure the content is unique and not a direct copy
7. Use HTML formatting for better readability (h2, h3, p, ul, ol, strong, em tags)
8. Aim for a comprehensive article (at least 1200-1500 words)

FORMATTING REQUIREMENTS:
- Use proper HTML tags for structure (<h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em>)
- Include clear headings and subheadings
- Break content into readable paragraphs
- Use bullet points or numbered lists where appropriate
- Add emphasis with bold and italic text where needed
- Ensure the content flows naturally and is easy to read

OUTPUT REQUIREMENTS:
- Return ONLY the article content in HTML format
- Do NOT include the title in the output (it will be added separately)
- Do NOT include references section (it will be added automatically)
- Start directly with the article content
- Make sure all HTML tags are properly closed
- Write in a professional, engaging tone

Write the optimized article now:`;

    return prompt;
  }

  /**
   * Clean generated content
   * @param {string} content - Generated content
   * @returns {string} Cleaned content
   */
  cleanGeneratedContent(content) {
    content = content.replace(/```html\n?/g, '').replace(/```\n?/g, '');
    content = content.replace(/<title>.*?<\/title>/gi, '');
    content = content.replace(/<h1>.*?<\/h1>/gi, '');
    content = content.trim();
    return content;
  }



  /**
   * Test LLM connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      console.log('Testing LLM connection...');
      const testPrompt = 'Say "Hello, I am working!" if you receive this message. Keep your response short.';
      const response = await this.callGemini(testPrompt);
      console.log(`Response: ${response.substring(0, 100)}...`);
      console.log('LLM connection successful');
      return true;
    } catch (error) {
      console.warn('LLM connection failed:', error.message);
      console.log('The tool will work with fallback content generation');
      return false;
    }
  }
}

module.exports = new LLMService();