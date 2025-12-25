require('dotenv').config();

module.exports = {
  // Laravel API Configuration
  laravelApi: {
    baseUrl: process.env.LARAVEL_API_BASE_URL || 'http://127.0.0.1:8000/api',
    endpoints: {
      articles: '/articles',
      articleById: (id) => `/articles/${id}`,
    }
  },

  // LLM Configuration (Google Gemini - FREE)
  llm: {
    provider: process.env.LLM_PROVIDER || 'gemini',
    
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-pro',
      maxTokens: 8000,
      temperature: 0.7
    }
  },

  // Google Search Configuration
  google: {
    searchUrl: 'https://www.google.com/search',
    userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    resultsToFetch: 2
  },

  // Puppeteer Configuration
  puppeteer: {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  }
};