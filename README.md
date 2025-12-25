# BeyondChats – Full Stack Assignment - Phase 2

This repository contains the complete solution for the BeyondChats assignment, implemented as a **single monolithic project** covering **Phase 1, Phase 2, and Phase 3**.
The project demonstrates an end-to-end flow where blog articles are **scraped**, **stored**, **processed**, and **displayed** using Laravel, Node.js, and React.


## Node.js Automation Script

This phase contains a **Node.js–based automation script** that processes articles stored in the Laravel backend.  
The script fetches articles from APIs, finds related content on Google, scrapes reference articles, and attempts to enhance the original article using LLMs with **safe fallback handling**.

---

## 🎯 Purpose of Phase 2

- Fetch articles from Laravel APIs
- Search Google for related articles
- Scrape content from external reference blogs
- Attempt AI-based article enhancement
- Update the article back using Laravel CRUD APIs
- Handle partial failures without breaking the flow

---

## ⚙️ Environment Setup

Create a `.env` file in the project root:

```env
LARAVEL_API_BASE_URL=http://127.0.0.1:8000/api
GEMINI_API_KEY=*************************
LLM_PROVIDER=gemini
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

### Error Handling

- If Google search fails → script exits safely
- If scraping fails → URL is skipped
- If AI API fails → original content is preserved
- Script never crashes due to external API failures


### NOTE
- Designed to work with free or limited APIs
- Modular structure for easy extension
- Safe fallback logic ensures data consistency


### How to run Phase 2 locally

```bash
cd beyondchats-phase2
npm install
npm start
```

### Phase-2 hosted at  "Netlify"

### Node will execute 
- Locally     : Run - node index.js
- Hosted Url  : https://beyondchatsscript.netlify.app/.netlify/functions/optimize

## Author

**Md Adil Alam**
