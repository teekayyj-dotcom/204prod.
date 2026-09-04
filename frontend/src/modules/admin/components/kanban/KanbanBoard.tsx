import { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { KanbanTask, TaskStatus, kanbanService } from '../../services/kanbanService';
import { KanbanColumn } from './KanbanColumn';
import { Circle, CircleDot, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface KanbanBoardProps {
  initialTasks: KanbanTask[];
}

export function KanbanBoard({ initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const columns: { id: TaskStatus; title: string; icon: React.ReactNode }[] = [
    { id: 'todo', title: 'To Do', icon: <Circle size={16} className="text-neutral-500" /> },
    { id: 'inprogress', title: 'In Progress', icon: <CircleDot size={16} className="text-blue-500" /> },
    { id: 'intreview', title: 'Int Review', icon: <RefreshCw size={16} className="text-yellow-500" /> },
    { id: 'clientreview', title: 'Client Review', icon: <RefreshCw size={16} className="text-purple-500" /> },
    { id: 'done', title: 'Done', icon: <CheckCircle2 size={16} className="text-green-500" /> },
  ];

  const moveTask = useCallback((dragIndex: number, hoverIndex: number, newStatus: string) => {
    // For visual sorting if needed
  }, []);

  const handleDropTask = useCallback(async (taskId: string, newStatus: string) => {
    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;
      
      const oldStatus = prevTasks[taskIndex].status;
      if (oldStatus === newStatus) return prevTasks;

      const newTasks = [...prevTasks];
      newTasks[taskIndex].status = newStatus as TaskStatus;

      // API call to backend
      kanbanService.updateTaskStatus(taskId, newStatus as TaskStatus)
        .then(() => toast.success('Task updated'))
        .catch(err => {
          console.error(err);
          toast.error('Failed to update task');
          setTasks(current => {
            const revertTasks = [...current];
            const revertIndex = revertTasks.findIndex(t => t.id === taskId);
            if (revertIndex > -1) {
              revertTasks[revertIndex].status = oldStatus;
            }
            return revertTasks;
          });
        });

      return newTasks;
    });
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex gap-6 h-full w-full overflow-x-auto pb-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            icon={col.icon}
            tasks={tasks.filter((t) => t.status === col.id)}
            moveTask={moveTask}
            onDropTask={handleDropTask}
          />
        ))}
      </div>
    </DndProvider>
  );
}
