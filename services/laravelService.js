const axios = require('axios');
const config = require('../config');

class LaravelService {
  constructor() {
    this.baseUrl = config.laravelApi.baseUrl;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }


  // Fetch all articles from Laravel API
  async fetchAllArticles() {
    try {
      console.log('Fetching all articles from Laravel API...');
      const response = await this.axiosInstance.get(config.laravelApi.endpoints.articles);
      
      if (response.data && response.data.status && response.data.data) {
        const articles = response.data.data.data;
        console.log(`Successfully fetched ${articles.length} articles`);
        return articles;
      }
      
      throw new Error('Invalid response format from Laravel API');
    } catch (error) {
      console.error('Error fetching articles:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  
  //  Fetch the latest article (highest ID)
  async fetchLatestArticle() {
    try {
      const articles = await this.fetchAllArticles();
      
      if (!articles || articles.length === 0) {
        throw new Error('No articles found in the database');
      }

      // Sort by ID descending to get the latest
      const sortedArticles = articles.sort((a, b) => b.id - a.id);
      const latestArticle = sortedArticles[0];
      
      console.log(`Latest article: "${latestArticle.title}" (ID: ${latestArticle.id})`);
      return latestArticle;
    } catch (error) {
      console.error('Error fetching latest article:', error.message);
      throw error;
    }
  }

  
  //  Fetch a specific article by ID
  async fetchArticleById(articleId) {
    try {
      console.log(`Fetching article with ID: ${articleId}...`);
      const response = await this.axiosInstance.get(
        config.laravelApi.endpoints.articleById(articleId)
      );
      
      if (response.data && response.data.status && response.data.data) {
        console.log(`Successfully fetched article: "${response.data.data.title}"`);
        return response.data.data;
      }
      
      throw new Error('Invalid response format from Laravel API');
    } catch (error) {
      console.error(`Error fetching article ${articleId}:`, error.message);
      throw error;
    }
  }

  
  //  Update an article
  async updateArticle(articleId, updateData) {
    try {
      
      const response = await this.axiosInstance.put(
        config.laravelApi.endpoints.articleById(articleId),
        updateData
      );
      
      if (response.data && response.data.status) {
        console.log(`Successfully updated article ${articleId}`);
        return response.data.data;
      }
      
      throw new Error('Failed to update article');
    } catch (error) {
      console.error(`Error updating article ${articleId}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

}

module.exports = new LaravelService();