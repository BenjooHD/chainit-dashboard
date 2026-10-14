'use client';

import { useTask } from '@/context/TaskContext';

interface TaskFiltersProps {
  filterAssignee: string;
  setFilterAssignee: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterBucket: string;
  setFilterBucket: (value: string) => void;
}

export default function TaskFilters({
  filterAssignee,
  setFilterAssignee,
  filterStatus,
  setFilterStatus,
  filterBucket,
  setFilterBucket,
}: TaskFiltersProps) {
  const { buckets } = useTask();

  return (
    <div className="filter-bar">
      <label>
        Assignee
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
          <option value="all">All</option>
          <option value="Unassigned">Unassigned</option>
          <option value="Ben Joona">Ben Joona</option>
          <option value="Noah">Noah</option>
        </select>
      </label>
      <label>
        Status
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </label>
      <label>
        Bucket
        <select value={filterBucket} onChange={(e) => setFilterBucket(e.target.value)}>
          <option value="all">All</option>
          {buckets.map(bucket => (
            <option key={bucket.id} value={bucket.name}>
              {bucket.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
