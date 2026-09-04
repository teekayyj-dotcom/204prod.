import { useDrag, useDrop } from 'react-dnd';
import { KanbanTask } from '../../services/kanbanService';
import { Clock, GripVertical, User } from 'lucide-react';
import { useRef } from 'react';

interface KanbanTaskCardProps {
  task: KanbanTask;
  index: number;
  moveTask: (dragIndex: number, hoverIndex: number, newStatus: string) => void;
  onDropTask: (taskId: string, newStatus: string) => void;
}

export function KanbanTaskCard({ task, index, moveTask, onDropTask }: KanbanTaskCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'TASK',
    item: { id: task.id, index, status: task.status, task },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ status: string }>();
      if (item && dropResult) {
        onDropTask(item.task.id, dropResult.status);
      }
    },
  });

  const [, drop] = useDrop({
    accept: 'TASK',
    hover(item: any, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex && item.status === task.status) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset?.y || 0) - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveTask(dragIndex, hoverIndex, task.status);
      item.index = hoverIndex;
      item.status = task.status;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`group relative flex flex-col bg-neutral-800 border border-neutral-700/50 rounded-xl p-4 hover:border-neutral-600 shadow-sm transition-colors overflow-hidden ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-neutral-900 text-neutral-300 border border-neutral-700 max-w-[120px] truncate" title={task.project_title || task.project_slug}>
            {task.project_title || task.project_slug}
          </span>
          {task.tag && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-700/50 text-neutral-400">
              {task.tag}
            </span>
          )}
        </div>
        <div ref={preview} className="text-neutral-500 hover:text-neutral-300 transition-colors opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </div>
      </div>
      
      <p className="text-sm text-neutral-200 font-medium leading-relaxed mb-4">
        {task.title}
      </p>
      
      <div className="flex items-center justify-between text-xs text-neutral-500 mt-auto pt-2 border-t border-neutral-700/50">
        <div className="flex items-center">
          {task.deadline ? (
            <>
              <Clock size={12} className="mr-1.5" />
              {task.deadline}
            </>
          ) : (
            <span className="text-neutral-600 italic">No deadline</span>
          )}
        </div>
        <div className="flex items-center bg-neutral-900 px-2 py-1 rounded-md" title={task.assignee_name || 'Unassigned'}>
          <User size={12} className="mr-1.5" />
          <span className="truncate max-w-[80px]">
            {task.assignee_initials || task.assignee_name || 'Unassigned'}
          </span>
        </div>
      </div>
    </div>
  );
}
