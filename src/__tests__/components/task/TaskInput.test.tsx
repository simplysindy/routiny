import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskInput } from '@/components/task/TaskInput';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';

// Mock the stores
vi.mock('@/stores/taskStore');
vi.mock('@/stores/authStore');

describe('TaskInput', () => {
  const mockCreateTask = vi.fn();
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    streak_count: 0,
    total_tasks_completed: 0,
    preferences: {
      coach_personality: 'encouraging' as const,
      notification_enabled: true,
      theme: 'light' as const,
    },
    created_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useTaskStore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useTaskStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      const store = {
        createTask: mockCreateTask,
        tasks: [],
        loading: false,
        error: null,
      };
      return selector(store);
    });

    // Mock useAuthStore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      const store = {
        user: mockUser,
        session: null,
        isLoading: false,
        isInitialized: true,
      };
      return selector(store);
    });
  });

  it('should render the task input form', () => {
    render(<TaskInput />);

    expect(screen.getByLabelText(/what needs to get done/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe your task/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
  });

  it('should have disabled button for empty input', () => {
    render(<TaskInput />);

    const button = screen.getByRole('button', { name: /create task/i });
    expect(button).toBeDisabled();
  });

  it('should validate input too short', async () => {
    render(<TaskInput />);

    const input = screen.getByPlaceholderText(/describe your task/i);
    fireEvent.change(input, { target: { value: 'ab' } });

    const button = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/task must be at least 3 characters/i)).toBeInTheDocument();
    });
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('should disable button for input too long', () => {
    render(<TaskInput />);

    const longText = 'a'.repeat(501);
    const input = screen.getByPlaceholderText(/describe your task/i);
    fireEvent.change(input, { target: { value: longText } });

    const button = screen.getByRole('button', { name: /create task/i });
    expect(button).toBeDisabled();
  });

  it('should have disabled button for whitespace-only input', () => {
    render(<TaskInput />);

    const input = screen.getByPlaceholderText(/describe your task/i);
    fireEvent.change(input, { target: { value: '   ' } });

    const button = screen.getByRole('button', { name: /create task/i });
    expect(button).toBeDisabled();
  });

  it('should show character counter', () => {
    render(<TaskInput />);

    const input = screen.getByPlaceholderText(/describe your task/i);
    fireEvent.change(input, { target: { value: 'Test task' } });

    expect(screen.getByText(/9 \/ 500 characters/i)).toBeInTheDocument();
  });

  it('should show over limit styling when exceeded', () => {
    render(<TaskInput />);

    const longText = 'a'.repeat(501);
    const input = screen.getByPlaceholderText(/describe your task/i);
    fireEvent.change(input, { target: { value: longText } });

    expect(screen.getByText(/501 \/ 500 characters/i)).toBeInTheDocument();
  });

  it('should show under limit message', () => {
    render(<TaskInput />);

    const input = screen.getByPlaceholderText(/describe your task/i);
    fireEvent.change(input, { target: { value: 'ab' } });

    expect(screen.getByText(/1 more character needed/i)).toBeInTheDocument();
  });

  it('should create task on valid submission', async () => {
    const mockTask = {
      id: 'task-id',
      user_id: 'test-user-id',
      title: 'Clean my room',
      ai_breakdown: [],
      status: 'pending' as const,
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    mockCreateTask.mockResolvedValue(mockTask);

    render(<TaskInput />);

    const input = screen.getByPlaceholderText(/describe your task/i);
    const button = screen.getByRole('button', { name: /create task/i });

    fireEvent.change(input, { target: { value: 'Clean my room' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith('Clean my room', 'test-user-id');
    });

    await waitFor(() => {
      expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const mockTask = {
      id: 'task-id',
      user_id: 'test-user-id',
      title: 'Clean my room',
      ai_breakdown: [],
      status: 'pending' as const,
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    mockCreateTask.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockTask), 100)));

    render(<TaskInput />);

    const input = screen.getByPlaceholderText(/describe your task/i);
    const button = screen.getByRole('button', { name: /create task/i });

    fireEvent.change(input, { target: { value: 'Clean my room' } });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByText(/creating.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
    });
  });

  it('should show error message on failed submission', async () => {
    mockCreateTask.mockResolvedValue(null);

    render(<TaskInput />);

    const input = screen.getByPlaceholderText(/describe your task/i);
    const button = screen.getByRole('button', { name: /create task/i });

    fireEvent.change(input, { target: { value: 'Clean my room' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed to create task/i)).toBeInTheDocument();
    });
  });

  it('should show retry button on error', async () => {
    mockCreateTask.mockResolvedValue(null);

    render(<TaskInput />);

    const input = screen.getByPlaceholderText(/describe your task/i);
    const button = screen.getByRole('button', { name: /create task/i });

    fireEvent.change(input, { target: { value: 'Clean my room' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('should clear error when user starts typing', async () => {
    mockCreateTask.mockResolvedValue(null);

    render(<TaskInput />);

    const input = screen.getByPlaceholderText(/describe your task/i);
    const button = screen.getByRole('button', { name: /create task/i });

    fireEvent.change(input, { target: { value: 'Clean my room' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed to create task/i)).toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: 'Clean my room now' } });

    expect(screen.queryByText(/failed to create task/i)).not.toBeInTheDocument();
  });

  it('should clear form on successful submission', async () => {
    const mockTask = {
      id: 'task-id',
      user_id: 'test-user-id',
      title: 'Clean my room',
      ai_breakdown: [],
      status: 'pending' as const,
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    mockCreateTask.mockResolvedValue(mockTask);

    render(<TaskInput />);

    const input = screen.getByPlaceholderText(/describe your task/i) as HTMLTextAreaElement;
    const button = screen.getByRole('button', { name: /create task/i });

    fireEvent.change(input, { target: { value: 'Clean my room' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});
