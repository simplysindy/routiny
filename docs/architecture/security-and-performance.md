# Security and Performance

## Security Requirements

**Frontend Security:**

- CSP Headers: Strict CSP with nonce-based inline scripts, no unsafe-eval
- XSS Prevention: All user input sanitized, React's built-in XSS protection
- Secure Storage: Sensitive data in HTTP-only cookies, no localStorage for tokens

**Backend Security:**

- Input Validation: Zod schemas for all API inputs with strict typing
- Rate Limiting: 100 requests/minute per IP, 500 requests/hour per user
- CORS Policy: Restricted to production domain only

**Authentication Security:**

- Token Storage: HTTP-only cookies with secure/samesite flags
- Session Management: Supabase handles JWT refresh automatically
- Password Policy: Magic links only - no password complexity needed

## Performance Optimization

**Frontend Performance:**

- Bundle Size Target: <100KB initial load (excluding images)
- Loading Strategy: Route-based code splitting, lazy loading for coach animations
- Caching Strategy: Service worker for offline, SWR for data fetching

**Backend Performance:**

- Response Time Target: <200ms for API routes, <3s for AI breakdown
- Database Optimization: Proper indexing, connection pooling via Supabase
- Caching Strategy: Redis for OpenRouter responses, Vercel edge caching for static content
