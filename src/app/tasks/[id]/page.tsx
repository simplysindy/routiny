import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { config as appConfig } from '@/lib/config';
import type { Database } from '@/types/database';
import TaskDetailWrapper from './TaskDetailWrapper';

interface TaskDetailPageProps {
  params: {
    id: string;
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  // Create Supabase client for server component
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    appConfig.supabase.url,
    appConfig.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to auth if not authenticated
  if (!session?.user) {
    redirect(`/auth?redirectTo=/tasks/${params.id}`);
  }

  // Fetch task data with ownership validation
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();

  // Handle errors
  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Task Not Found</h1>
          <p className="text-gray-600 mb-4">
            The task you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Link
            href="/tasks/create"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Tasks
          </Link>
        </div>
      </div>
    );
  }

  // Render client wrapper with task data
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <TaskDetailWrapper task={task} />
      </div>
    </div>
  );
}
