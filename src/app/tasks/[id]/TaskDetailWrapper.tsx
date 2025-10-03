"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@/types";
import SingleDayTaskDisplay from "@/components/task/SingleDayTaskDisplay";
import MultiDayTaskDisplay from "@/components/task/MultiDayTaskDisplay";

interface TaskDetailWrapperProps {
  task: Task;
}

const TaskDetailWrapper: FC<TaskDetailWrapperProps> = ({
  task: initialTask,
}) => {
  const router = useRouter();
  const [task, setTask] = useState<Task>(initialTask);

  const handleStepComplete = async (stepIndex: number, day?: number) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stepIndex, day }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete step");
      }

      const { data: updatedTask } = await response.json();
      setTask(updatedTask);

      // Refresh the page data to ensure consistency
      router.refresh();
    } catch (error) {
      console.error("Error completing step:", error);
      throw error; // Re-throw to let the component handle the error
    }
  };

  const handleSingleDayStepComplete = async (stepIndex: number) => {
    return handleStepComplete(stepIndex);
  };

  const handleMultiDayStepComplete = async (stepIndex: number, day: number) => {
    return handleStepComplete(stepIndex, day);
  };

  return (
    <div>
      {task.task_type === "single-day" ? (
        <SingleDayTaskDisplay
          task={task}
          onStepComplete={handleSingleDayStepComplete}
        />
      ) : (
        <MultiDayTaskDisplay
          task={task}
          onStepComplete={handleMultiDayStepComplete}
        />
      )}
    </div>
  );
};

export default TaskDetailWrapper;
