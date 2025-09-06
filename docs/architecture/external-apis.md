# External APIs

## OpenRouter API

- **Purpose:** AI-powered task breakdown into 5-7 micro-steps using multiple AI models
- **Documentation:** https://openrouter.ai/docs
- **Base URL(s):** https://openrouter.ai/api/v1
- **Authentication:** Bearer token (API key)
- **Rate Limits:** Varies by model, generally more flexible than direct provider access

**Key Endpoints Used:**

- `POST /chat/completions` - Generate task breakdown with structured prompts

**Integration Notes:** Access to multiple models (GPT-4, Claude, Llama, etc.), implement response caching to reduce costs, fallback to different models if one fails, streaming disabled for simplicity
