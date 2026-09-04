import { useDrag, useDrop } from 'react-dnd';
import { KanbanTask } from '../../services/kanbanService';
import { Clock, GripVertical, User, AlertTriangle } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const KANBAN_COLORS = {
  todo: "#888888",
  inprogress: "#E8A838",
  intreview: "#6B8FD6",
  clientreview: "#C084FC",
  done: "#4CAF50"
};

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

  const [isHovered, setIsHovered] = useState(false);
  const colColor = KANBAN_COLORS[task.status] || KANBAN_COLORS.todo;
  const isDone = task.status === 'done';
  const isOverdue = false; // TODO: Calculate if needed

  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col rounded-xl p-3 shadow-sm transition-all overflow-hidden"
      style={{
        background: isDragging ? "rgba(216,64,64,0.1)" : "rgba(29,22,22,0.85)",
        border: `1px solid ${isOverdue ? "rgba(216,64,64,0.4)" : isDragging ? "#D84040" : isHovered ? colColor + "55" : "rgba(46,32,32,0.7)"}`,
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.2)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <Link to={`/admin/projects/${task.project_slug}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-neutral-900 text-neutral-300 border border-neutral-700 max-w-[120px] truncate hover:bg-neutral-800 hover:text-white transition-colors" title={task.project_title || task.project_slug} onClick={(e) => e.stopPropagation()}>
            {task.project_title || task.project_slug}
          </Link>
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
      
      <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500, lineHeight: 1.4, marginBottom: "8px" }}>
        {task.title}
      </p>
      
      <div className="flex items-center justify-between text-xs text-neutral-500 mt-auto pt-2 border-t border-[#2e2020]/70">
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
        <div className="flex items-center bg-[#1D1616] px-2 py-1 rounded-md border border-[#2e2020]" title={task.assignee_name || 'Unassigned'}>
          <User size={12} className="mr-1.5" />
          <span className="truncate max-w-[80px]">
            {task.assignee_initials || task.assignee_name || 'Unassigned'}
          </span>
        </div>
      </div>
    </div>
  );
}
