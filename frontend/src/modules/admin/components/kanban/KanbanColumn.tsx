import { useDrop } from 'react-dnd';
import { KanbanTask } from '../../services/kanbanService';
import { KanbanTaskCard } from './KanbanTaskCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: KanbanTask[];
  icon?: React.ReactNode;
  moveTask: (dragIndex: number, hoverIndex: number, newStatus: string) => void;
  onDropTask: (taskId: string, newStatus: string) => void;
}

export function KanbanColumn({ id, title, tasks, icon, moveTask, onDropTask }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: () => ({ status: id }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div className="flex flex-col flex-1 h-full min-w-[300px] max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="font-semibold text-neutral-200">{title}</h3>
        </div>
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-xs font-medium text-neutral-400">
          {tasks.length}
        </span>
      </div>
      
      <div
        ref={drop}
        className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${
          isOver ? 'bg-neutral-800/30' : ''
        }`}
      >
        {tasks.map((task, index) => (
          <KanbanTaskCard 
            key={task.id} 
            index={index} 
            task={task} 
            moveTask={moveTask} 
            onDropTask={onDropTask} 
          />
        ))}
      </div>
    </div>
  );
}
