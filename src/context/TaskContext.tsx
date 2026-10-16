'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: 'Ben Joona' | 'Noah' | 'Unassigned';
  status: 'open' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  bucket: string;
  notes: string;
  createdAt: string;
}

export interface Bucket {
  id: string;
  name: string;
  color: string;
  tasks?: Task[];
}

interface TaskContextType {
  tasks: Task[];
  buckets: Bucket[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  addBucket: (bucket: Omit<Bucket, 'id'>) => Promise<void>;
  updateBucket: (id: string, bucket: Partial<Omit<Bucket, 'id'>>) => Promise<void>;
  deleteBucket: (id: string) => Promise<void>;
  loading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload when the logged-in user changes, so data is fetched with the user's session.
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setBuckets([]);
      setLoading(false);
      return;
    }
    loadData();
    return subscribeToChanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, bucketsData] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('buckets').select('*'),
      ]);

      if (tasksData.data) {
        setTasks(
          tasksData.data.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            assignedTo: t.assigned_to,
            status: t.status,
            priority: t.priority,
            dueDate: t.due_date,
            bucket: t.bucket,
            notes: t.notes,
            createdAt: t.created_at,
          }))
        );
      }

      if (bucketsData.data) {
        setBuckets(
          bucketsData.data.map(b => ({
            id: b.id,
            name: b.name,
            color: b.color,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const taskSub = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => loadData()
      )
      .subscribe();

    const bucketSub = supabase
      .channel('buckets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'buckets' },
        () => loadData()
      )
      .subscribe();

    return () => {
      taskSub.unsubscribe();
      bucketSub.unsubscribe();
    };
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User must be logged in');
    const { error } = await supabase.from('tasks').insert([
      {
        title: task.title,
        description: task.description,
        assigned_to: task.assignedTo,
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate || null,
        bucket: task.bucket,
        notes: task.notes,
        created_by: user.id,
      },
    ]);
    if (error) throw error;
    await loadData();
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
    if (updates.bucket !== undefined) dbUpdates.bucket = updates.bucket;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
    if (error) throw error;
    await loadData();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    await loadData();
  };

  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    let newStatus: 'open' | 'in-progress' | 'completed';
    if (task.status === 'open') newStatus = 'in-progress';
    else if (task.status === 'in-progress') newStatus = 'completed';
    else newStatus = 'open';

    await updateTask(id, { status: newStatus });
  };

  const addBucket = async (bucket: Omit<Bucket, 'id'>) => {
    if (!user) throw new Error('User must be logged in');
    const { error } = await supabase.from('buckets').insert([
      {
        name: bucket.name,
        color: bucket.color,
        created_by: user.id,
      },
    ]);
    if (error) throw error;
    await loadData();
  };

  const updateBucket = async (id: string, updates: Partial<Omit<Bucket, 'id'>>) => {
    const { error } = await supabase.from('buckets').update(updates).eq('id', id);
    if (error) throw error;
    await loadData();
  };

  const deleteBucket = async (id: string) => {
    const { error } = await supabase.from('buckets').delete().eq('id', id);
    if (error) throw error;
    await loadData();
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        buckets,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        addBucket,
        updateBucket,
        deleteBucket,
        loading,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within TaskProvider');
  }
  return context;
}
