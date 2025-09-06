# Monitoring and Observability

## Monitoring Stack

- **Frontend Monitoring:** Vercel Analytics + Sentry for error tracking
- **Backend Monitoring:** Vercel Functions logs + Supabase dashboard
- **AI/LLM Observability:** Langfuse for comprehensive AI call tracing, debugging, and analytics
- **Error Tracking:** Sentry for both frontend and backend errors
- **Performance Monitoring:** Vercel Speed Insights + Core Web Vitals

## Langfuse Integration Architecture

**Purpose:** Complete observability for AI/LLM interactions with detailed tracing, cost tracking, and performance analytics.

**Key Features:**

- **Trace Management:** Full request lifecycle from task input → AI breakdown → user completion
- **Cost Tracking:** Real-time OpenRouter API usage and spend monitoring
- **Performance Analytics:** Latency, token usage, and model performance metrics
- **Debug Capabilities:** Detailed prompt/response logging for troubleshooting
- **User Journey Tracking:** Link AI interactions to user behavior and outcomes

**Integration Points:**

```typescript
// API Route Integration
import { langfuse } from "@/lib/langfuse";

export async function POST(req: NextApiRequest) {
  const trace = langfuse.trace({
    name: "task-breakdown",
    userId: user.id,
    metadata: { taskTitle: title },
  });

  const generation = trace.generation({
    name: "openrouter-completion",
    model: "anthropic/claude-3-haiku",
    input: { prompt, context },
    metadata: { provider: "openrouter" },
  });

  try {
    const response = await openRouterCall();
    generation.end({ output: response });
    return response;
  } catch (error) {
    generation.end({
      output: null,
      level: "ERROR",
      statusMessage: error.message,
    });
    throw error;
  }
}
```

**Dashboard Insights:**

- Task breakdown success/failure rates by model
- Average time-to-completion correlation with AI quality
- User engagement patterns with different breakdown styles
- Cost optimization opportunities by model performance

## Key Metrics

**Frontend Metrics:**

- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors and error boundaries
- API response times from user perspective
- Task creation and completion success rates

**Backend Metrics:**

- Request rate and response times by endpoint
- Error rate by API route
- OpenRouter API usage and costs
- Database query performance via Supabase

**AI/LLM Metrics (via Langfuse):**

- Token usage and cost per task breakdown
- Model performance (latency, success rate) by provider
- Prompt effectiveness and user satisfaction correlation
- AI-generated step quality metrics
- User completion rates by breakdown complexity
