# Development Workflow

## Local Development Setup

### Prerequisites

```bash
# Install Node.js 18+ and npm
node --version  # Should be 18+
npm --version   # Should be 9+

# Install dependencies
npm install

# Install T3 stack (if starting fresh)
npx create-t3-app@latest routiny --nextjs --typescript --tailwind --supabase
```

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd routiny

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your keys
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
# OPENROUTER_API_KEY=your-openrouter-key
# UPSTASH_REDIS_REST_URL=your-redis-url
# UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Run database migrations (Supabase)
npx supabase db push
```

### Development Commands

```bash
# Start all services
npm run dev

# Start frontend only
npm run dev

# Start backend only
npm run dev  # Next.js handles both

# Run tests
npm run test          # Unit tests
npm run test:e2e      # Playwright E2E tests
npm run type-check    # TypeScript checking
npm run lint          # ESLint checking
```

## Environment Configuration

### Required Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend (.env.local)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API_KEY=sk-or-your-openrouter-key
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Langfuse Configuration
LANGFUSE_SECRET_KEY=sk-lf-your-secret-key
LANGFUSE_PUBLIC_KEY=pk-lf-your-public-key
LANGFUSE_HOST=https://cloud.langfuse.com  # or your self-hosted instance

# Shared
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```
