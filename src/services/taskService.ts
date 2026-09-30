import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';

const TASKS_COLLECTION = 'tasks';

// In-memory fallback sample data for demonstration / offline use
let fallbackTasks: Task[] = [
  {
    id: 'sample-task-1',
    title: 'Set up Firebase Project & Firestore',
    description: 'Create Firebase project in console, enable Firestore in test mode and download config.',
    status: 'done',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    teamId: null,
    assigneeId: null,
  },
  {
    id: 'sample-task-2',
    title: 'Implement Task CRUD Screen',
    description: 'Build responsive React Native UI with Expo and React Navigation bottom tabs.',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    teamId: null,
    assigneeId: null,
  },
  {
    id: 'sample-task-3',
    title: 'Generate Screenshot Report',
    description: 'Capture required screenshots and prepare StudentID_Exam1.docx report for submission.',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    teamId: null,
    assigneeId: null,
  },
];

type TasksCallback = (tasks: Task[]) => void;
type ErrorCallback = (error: Error) => void;

/**
 * Subscribe to real-time tasks updates using Firestore onSnapshot
 */
export const subscribeToTasks = (
  onNext: TasksCallback,
  onError?: ErrorCallback
): (() => void) => {
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(tasksRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasks: Task[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          let createdAtStr = new Date().toISOString();
          if (data.createdAt instanceof Timestamp) {
            createdAtStr = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAtStr = data.createdAt;
          }

          return {
            id: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            status: data.status || 'todo',
            priority: data.priority || 'medium',
            dueDate: data.dueDate || '',
            createdAt: createdAtStr,
            teamId: data.teamId || null,
            assigneeId: data.assigneeId || null,
          } as Task;
        });

        onNext(tasks);
      },
      (err) => {
        console.warn('Firestore subscription warning/fallback:', err.message);
        // Fallback to local sample tasks if Firestore connection has issue
        onNext([...fallbackTasks]);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn('Could not initialize Firestore listener, using local fallback:', error);
    onNext([...fallbackTasks]);
    return () => {};
  }
};

/**
 * Fetch all tasks once (manual fetch)
 */
export const getTasks = async (): Promise<Task[]> => {
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      let createdAtStr = new Date().toISOString();
      if (data.createdAt instanceof Timestamp) {
        createdAtStr = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdAtStr = data.createdAt;
      }

      return {
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        dueDate: data.dueDate || '',
        createdAt: createdAtStr,
        teamId: data.teamId || null,
        assigneeId: data.assigneeId || null,
      } as Task;
    });
  } catch (error) {
    console.warn('getTasks falling back to local memory:', error);
    return [...fallbackTasks];
  }
};

/**
 * Create a new task document in Firestore
 */
export const createTask = async (taskInput: CreateTaskInput): Promise<string> => {
  const newTaskData = {
    title: taskInput.title.trim(),
    description: taskInput.description?.trim() || '',
    status: taskInput.status || 'todo',
    priority: taskInput.priority || 'medium',
    dueDate: taskInput.dueDate || new Date().toISOString().split('T')[0],
    createdAt: serverTimestamp(),
    teamId: taskInput.teamId || null,
    assigneeId: taskInput.assigneeId || null,
  };

  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const docRef = await addDoc(tasksRef, newTaskData);
    return docRef.id;
  } catch (error) {
    console.warn('createTask fallback to memory:', error);
    const mockId = `task-${Date.now()}`;
    const fallbackNewTask: Task = {
      id: mockId,
      title: newTaskData.title,
      description: newTaskData.description,
      status: newTaskData.status,
      priority: newTaskData.priority,
      dueDate: newTaskData.dueDate,
      createdAt: new Date().toISOString(),
      teamId: newTaskData.teamId,
      assigneeId: newTaskData.assigneeId,
    };
    fallbackTasks = [fallbackNewTask, ...fallbackTasks];
    return mockId;
  }
};

/**
 * Update an existing task document in Firestore
 */
export const updateTask = async (id: string, updates: UpdateTaskInput): Promise<void> => {
  try {
    const taskDocRef = doc(db, TASKS_COLLECTION, id);
    const cleanUpdates: Record<string, any> = {};

    if (updates.title !== undefined) cleanUpdates.title = updates.title.trim();
    if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.priority !== undefined) cleanUpdates.priority = updates.priority;
    if (updates.dueDate !== undefined) cleanUpdates.dueDate = updates.dueDate;
    if (updates.teamId !== undefined) cleanUpdates.teamId = updates.teamId;
    if (updates.assigneeId !== undefined) cleanUpdates.assigneeId = updates.assigneeId;

    await updateDoc(taskDocRef, cleanUpdates);
  } catch (error) {
    console.warn('updateTask fallback to memory:', error);
    fallbackTasks = fallbackTasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
  }
};

/**
 * Delete a task document from Firestore
 */
export const deleteTask = async (id: string): Promise<void> => {
  try {
    const taskDocRef = doc(db, TASKS_COLLECTION, id);
    await deleteDoc(taskDocRef);
  } catch (error) {
    console.warn('deleteTask fallback to memory:', error);
    fallbackTasks = fallbackTasks.filter((t) => t.id !== id);
  }
};
