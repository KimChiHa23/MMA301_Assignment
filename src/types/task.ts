export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD format
  createdAt: string; // ISO date string or timestamp string
  teamId?: string | null;
  teamName?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  creatorId?: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  teamId?: string | null;
  teamName?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  creatorId?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  teamId?: string | null;
  teamName?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
}
