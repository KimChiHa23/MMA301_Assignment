import { useState, useEffect, useCallback } from 'react';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';
import {
  subscribeToTasks,
  getTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  seedInitialTasksToFirestore,
} from '../services/taskService';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates from Cloud Firestore
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTasks(
      (newTasks) => {
        setTasks(newTasks);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Manual refresh for pull-to-refresh
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh tasks');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const createTask = useCallback(async (input: CreateTaskInput) => {
    try {
      const newId = await apiCreateTask(input);
      return newId;
    } catch (err: any) {
      setError(err?.message || 'Failed to create task');
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: UpdateTaskInput) => {
    try {
      await apiUpdateTask(id, updates);
    } catch (err: any) {
      setError(err?.message || 'Failed to update task');
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await apiDeleteTask(id);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete task');
      throw err;
    }
  }, []);

  const seedInitialTasks = useCallback(async () => {
    setLoading(true);
    try {
      await seedInitialTasksToFirestore();
    } catch (err: any) {
      setError(err?.message || 'Failed to seed sample tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tasks,
    loading,
    refreshing,
    error,
    refresh,
    createTask,
    updateTask,
    deleteTask,
    seedInitialTasks,
  };
};
