# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define shared types in `src/types/` and import consistently across frontend/backend
- **API Calls:** Never make direct HTTP calls - use the service layer functions for consistency
- **Environment Variables:** Access only through config objects in `src/lib/config.ts`, never process.env directly
- **Error Handling:** All API routes must use the standard error handler middleware for consistent responses
- **State Updates:** Never mutate state directly - use Zustand actions and immutable updates
- **Database Access:** Use repository pattern - no direct Supabase calls in components or API routes
- **Authentication:** Always use middleware for protected routes, never manual session checking

## Naming Conventions

| Element           | Frontend             | Backend    | Example                |
| ----------------- | -------------------- | ---------- | ---------------------- |
| Components        | PascalCase           | -          | `TaskInput.tsx`        |
| Hooks             | camelCase with 'use' | -          | `useAuth.ts`           |
| API Routes        | -                    | kebab-case | `/api/task-completion` |
| Database Tables   | -                    | snake_case | `task_steps`           |
| Store Actions     | camelCase            | -          | `createTask`           |
| Service Functions | camelCase            | camelCase  | `fetchUserTasks`       |
