import { fetchApi } from '../utils/apiClient';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface KanbanTask {
  id: string;
  specId: string;
  status: TaskStatus;
  description: string;
  createdAt: string;
  originalLine: number;
}

export const kanbanService = {
  getTasks: async (): Promise<KanbanTask[]> => {
    return await fetchApi<KanbanTask[]>('/kanban/tasks');
  },
  
  updateTaskStatus: async (specId: string, taskId: string, originalLine: number, newStatus: TaskStatus): Promise<void> => {
    return await fetchApi<void>(`/kanban/tasks/${specId}/update`, {
      method: 'PUT',
      body: JSON.stringify({
        taskId,
        originalLine,
        newStatus
      })
    });
  }
};
