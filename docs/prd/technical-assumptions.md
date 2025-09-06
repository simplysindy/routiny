# Technical Assumptions

## Repository Structure: Monorepo

Single repository containing frontend, API routes, and configuration. Clear separation of concerns with organized folder structure for components, utilities, and business logic while maintaining simplicity for solo development.

## Service Architecture

Next.js monolith with API routes handling OpenAI integration and Supabase connectivity. Serverless deployment model via Vercel with edge functions for optimal performance. Offline-first data strategy using service workers and local storage with background sync.

## Testing Requirements

Unit testing for critical business logic (AI response processing, offline sync). Integration testing for API endpoints and external service connections. Manual testing protocols for PWA installation and cross-device functionality. No complex E2E automation given solo development constraints.

## Additional Technical Assumptions and Requests

- OpenAI API costs will remain predictable with implementation of response caching
- Supabase real-time subscriptions for cross-device synchronization
- Vercel edge functions will provide sub-200ms response times globally
- Service worker implementation will handle offline scenarios gracefully
- Redis caching layer (Upstash) for API response optimization
- Environment variable management for secure API key handling
- Rate limiting implementation to prevent API cost overruns
