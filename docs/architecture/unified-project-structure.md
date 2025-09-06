# Unified Project Structure

```plaintext
routiny/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       └── ci.yml             # Vercel deployment
├── .next/                     # Next.js build output
├── public/                    # Static assets
│   ├── icons/                 # PWA icons
│   ├── coach/                 # Coach character sprites
│   └── manifest.json          # PWA manifest
├── src/                       # Source code
│   ├── app/                   # Next.js 14 App Router
│   │   ├── auth/
│   │   │   └── page.tsx       # Magic link auth page
│   │   ├── tasks/
│   │   │   ├── page.tsx       # Task list
│   │   │   ├── create/
│   │   │   │   └── page.tsx   # Task creation
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Task detail
│   │   ├── streaks/
│   │   │   └── page.tsx       # Streak dashboard
│   │   ├── globals.css        # Global Tailwind styles
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── loading.tsx        # Loading UI
│   │   └── page.tsx           # Home dashboard
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── task/              # Task components
│   │   │   ├── TaskInput.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── StepList.tsx
│   │   ├── coach/             # Coach character
│   │   │   ├── CoachAvatar.tsx
│   │   │   └── CoachMessage.tsx
│   │   └── layout/            # Layout components
│   │       ├── Header.tsx
│   │       └── Navigation.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useTasks.ts
│   │   └── useOffline.ts
│   ├── lib/                   # Utilities and config
│   │   ├── clients.ts         # Supabase/API clients
│   │   ├── utils.ts           # Helper functions
│   │   └── validations.ts     # Zod schemas
│   ├── services/              # API service layer
│   │   ├── taskService.ts
│   │   ├── userService.ts
│   │   └── openrouterService.ts
│   ├── stores/                # Zustand stores
│   │   ├── authStore.ts
│   │   ├── taskStore.ts
│   │   └── uiStore.ts
│   └── types/                 # TypeScript definitions
│       ├── database.ts        # Supabase generated types
│       ├── api.ts             # API request/response types
│       └── index.ts           # Exported types
├── pages/api/                 # API routes (still in pages for API)
│   ├── tasks/
│   │   ├── index.ts           # CRUD operations
│   │   └── [id]/
│   │       └── steps/
│   │           └── [stepId]/
│   │               └── complete.ts
│   ├── user/
│   │   └── stats.ts           # User statistics
│   └── health.ts              # Health check
├── docs/                      # Documentation
│   ├── prd.md
│   ├── front-end-spec.md
│   └── architecture.md        # This document
├── .env.local.example         # Environment template
├── .env.local                 # Local environment (gitignored)
├── .gitignore                 # Git ignore rules
├── middleware.ts              # Next.js middleware for auth
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies and scripts
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Project setup instructions
```
