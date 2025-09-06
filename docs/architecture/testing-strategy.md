# Testing Strategy

## Testing Pyramid

```
      E2E Tests (5%)
     /            \
   Integration Tests (15%)
  /                  \
Frontend Unit (40%)  Backend Unit (40%)
```

## Test Organization

### Frontend Tests

```
src/__tests__/
├── components/
│   ├── TaskInput.test.tsx
│   ├── StepList.test.tsx
│   └── CoachAvatar.test.tsx
├── hooks/
│   ├── useAuth.test.ts
│   └── useTasks.test.ts
├── services/
│   ├── taskService.test.ts
│   └── userService.test.ts
└── utils/
    └── validation.test.ts
```

### Backend Tests

```
pages/api/__tests__/
├── tasks/
│   ├── index.test.ts
│   └── complete.test.ts
├── user/
│   └── stats.test.ts
└── __helpers__/
    ├── testDb.ts
    └── mockAuth.ts
```

### E2E Tests

```
e2e/
├── auth.spec.ts           # Login/logout flow
├── task-creation.spec.ts  # Create and complete tasks
└── streak-tracking.spec.ts # Streak functionality
```

## Test Examples

### Frontend Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import TaskInput from '@/components/task/TaskInput';

describe('TaskInput', () => {
  it('should create task on form submission', async () => {
    const mockCreate = jest.fn();
    render(<TaskInput onCreateTask={mockCreate} />);

    const input = screen.getByPlaceholderText('What needs to get done?');
    const button = screen.getByText('Break it down');

    fireEvent.change(input, { target: { value: 'Clean my room' } });
    fireEvent.click(button);

    expect(mockCreate).toHaveBeenCalledWith('Clean my room');
  });
});
```

### Backend API Test

```typescript
import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/tasks/index";

describe("/api/tasks", () => {
  it("should create task with AI breakdown", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { title: "Clean my room" },
    });

    // Mock authenticated user
    req.user = { id: "test-user-id" };

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.title).toBe("Clean my room");
    expect(data.ai_breakdown).toHaveLength(5); // Expecting 5-7 steps
  });
});
```

### E2E Test

```typescript
import { test, expect } from "@playwright/test";

test("complete task creation flow", async ({ page }) => {
  await page.goto("/");

  // Login with magic link (mock in test environment)
  await page.fill('input[type="email"]', "test@example.com");
  await page.click("text=Send Magic Link");

  // Navigate to task creation
  await page.click("text=Create Task");
  await page.fill("textarea", "Clean my room");
  await page.click("text=Break it down");

  // Wait for AI breakdown
  await page.waitForSelector('[data-testid="step-list"]');

  // Complete first step
  await page.click('[data-testid="step-0"] input[type="checkbox"]');

  // Verify UI update
  await expect(page.locator('[data-testid="step-0"]')).toHaveClass(/completed/);
});
```
