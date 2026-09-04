import { useEffect, useState, useMemo } from 'react';
import { kanbanService, KanbanTask } from '../services/kanbanService';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { subMonths, isAfter } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

export function KanbanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const timeFilter = searchParams.get('time') || 'all';
  
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    kanbanService.getTasks()
      .then(data => setTasks(data))
      .catch(err => console.error("Failed to load tasks", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredTasks = useMemo(() => {
    if (timeFilter === 'all') return tasks;
    
    const now = new Date();
    let cutoffDate: Date | null = null;
    
    if (timeFilter === '1m') cutoffDate = subMonths(now, 1);
    else if (timeFilter === '3m') cutoffDate = subMonths(now, 3);
    else if (timeFilter === '1q') cutoffDate = subMonths(now, 3);

    if (cutoffDate) {
      return tasks.filter(task => isAfter(new Date(task.createdAt), cutoffDate!));
    }
    return tasks;
  }, [tasks, timeFilter]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({ time: e.target.value });
  };

  if (loading) {
    return <div className="p-8 text-white">Loading Kanban...</div>;
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Project Tasks Kanban</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Manage tasks across all 204prod. specs and features.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <label htmlFor="time-filter" className="text-sm text-neutral-400 font-medium">Filter:</label>
          <select 
            id="time-filter"
            value={timeFilter}
            onChange={handleFilterChange}
            className="bg-neutral-900 border border-neutral-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none cursor-pointer hover:bg-neutral-800 transition-colors"
          >
            <option value="all">Tất cả (All)</option>
            <option value="1m">1 Tháng (1 Month)</option>
            <option value="3m">3 Tháng (3 Months)</option>
            <option value="1q">1 Quý (1 Quarter)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard initialTasks={filteredTasks} />
      </div>
    </div>
  );
}
