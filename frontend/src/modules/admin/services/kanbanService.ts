import { fetchApi } from '../utils/apiClient';

export type TaskStatus = 'todo' | 'inprogress' | 'intreview' | 'clientreview' | 'done';

export interface KanbanTask {
  id: string;
  project_slug: string;
  title: string;
  assignee_name?: string;
  assignee_initials?: string;
  tag?: string;
  created_by: string;
  deadline?: string;
  status: TaskStatus;
  priority: string;
  project_title?: string;
}

export const kanbanService = {
  getTasks: async (): Promise<KanbanTask[]> => {
    return await fetchApi<KanbanTask[]>('/projects/tasks/all');
  },
  
  updateTaskStatus: async (taskId: string, newStatus: TaskStatus): Promise<void> => {
    return await fetchApi<void>(`/projects/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: newStatus
      })
    });
  }
};
