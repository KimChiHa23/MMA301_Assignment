import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput } from '../types/task';

const TASKS_COLLECTION = 'tasks';

// Initial sample tasks to seed when collection is empty
const INITIAL_SAMPLE_TASKS = [
  {
    title: 'Set up Firebase Project & Firestore Database',
    description:
      'Created Firebase project in console, enabled Firestore in test mode and configured credentials.',
    status: 'done' as TaskStatus,
    priority: 'high' as TaskPriority,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    teamId: null,
    teamName: null,
    assigneeId: null,
    assigneeName: null,
  },
  {
    title: 'Implement Task CRUD Screen with Realtime Updates',
    description:
      'Built responsive UI with Expo, React Navigation bottom tabs and Firestore onSnapshot listener.',
    status: 'in_progress' as TaskStatus,
    priority: 'high' as TaskPriority,
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    teamId: null,
    teamName: null,
    assigneeId: null,
    assigneeName: null,
  },
  {
    title: 'Prepare Exam 2 Submission with Teams & Real-time Chat',
    description:
      'Implemented Firebase Auth, Teams, Assignee linking, Real-time Chat, and Security Rules.',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
    teamId: null,
    teamName: null,
    assigneeId: null,
    assigneeName: null,
  },
];

type TasksCallback = (tasks: Task[]) => void;
type ErrorCallback = (error: Error) => void;

/**
 * Normalize status from manual inputs
 */
const normalizeStatus = (statusRaw?: string): TaskStatus => {
  if (!statusRaw) return 'todo';
  const s = statusRaw
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .trim();
  if (s === 'in_progress' || s === 'inprogress' || s === 'progress') return 'in_progress';
  if (s === 'done' || s === 'completed' || s === 'finish') return 'done';
  return 'todo';
};

/**
 * Normalize priority from manual inputs
 */
const normalizePriority = (priorityRaw?: string): TaskPriority => {
  if (!priorityRaw) return 'medium';
  const p = priorityRaw.toLowerCase().trim();
  if (p === 'high') return 'high';
  if (p === 'low') return 'low';
  return 'medium';
};

/**
 * Parse document data into a standardized Task object
 */
export const parseTaskDoc = (id: string, data: any): Task => {
  let createdAtStr = new Date().toISOString();
  if (data.createdAt instanceof Timestamp) {
    createdAtStr = data.createdAt.toDate().toISOString();
  } else if (typeof data.createdAt === 'string') {
    createdAtStr = data.createdAt;
  }

  let dueDateStr = '';
  if (data.dueDate instanceof Timestamp) {
    dueDateStr = data.dueDate.toDate().toISOString().split('T')[0];
  } else if (typeof data.dueDate === 'string') {
    dueDateStr = data.dueDate;
  }

  return {
    id,
    title: data.title || '',
    description: data.description || '',
    status: normalizeStatus(data.status),
    priority: normalizePriority(data.priority),
    dueDate: dueDateStr,
    createdAt: createdAtStr,
    teamId: data.teamId || null,
    teamName: data.teamName || null,
    assigneeId: data.assigneeId || null,
    assigneeName: data.assigneeName || null,
    creatorId: data.creatorId || null,
  };
};

/**
 * Seed initial sample tasks to Cloud Firestore if the collection is empty
 */
export const seedInitialTasksToFirestore = async (): Promise<boolean> => {
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const snapshot = await getDocs(tasksRef);
    if (snapshot.empty) {
      console.log('Seeding initial sample tasks to Cloud Firestore...');
      for (const t of INITIAL_SAMPLE_TASKS) {
        await addDoc(tasksRef, {
          ...t,
          createdAt: serverTimestamp(),
        });
      }
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Could not seed tasks to Firestore:', error);
    throw error;
  }
};

/**
 * Subscribe to all real-time tasks updates using Cloud Firestore onSnapshot
 */
export const subscribeToTasks = (onNext: TasksCallback, onError?: ErrorCallback): (() => void) => {
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);

    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const tasks: Task[] = snapshot.docs.map((docSnap) =>
          parseTaskDoc(docSnap.id, docSnap.data())
        );

        // Sort client-side by createdAt descending (newest first)
        tasks.sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime() || 0;
          const timeB = new Date(b.createdAt).getTime() || 0;
          return timeB - timeA;
        });

        onNext(tasks);
      },
      (err) => {
        console.error('Firestore onSnapshot error:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error('Failed to initialize Firestore listener:', error);
    if (onError) onError(error);
    return () => {};
  }
};

/**
 * Subscribe to real-time tasks for a specific team
 */
export const subscribeToTeamTasks = (
  teamId: string,
  onNext: TasksCallback,
  onError?: ErrorCallback
): (() => void) => {
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(tasksRef, where('teamId', '==', teamId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasks: Task[] = snapshot.docs.map((docSnap) =>
          parseTaskDoc(docSnap.id, docSnap.data())
        );

        tasks.sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime() || 0;
          const timeB = new Date(b.createdAt).getTime() || 0;
          return timeB - timeA;
        });

        onNext(tasks);
      },
      (err) => {
        console.error('Firestore onSnapshot team tasks error:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error('Failed to subscribe to team tasks:', error);
    if (onError) onError(error);
    return () => {};
  }
};

/**
 * Fetch all tasks once from Cloud Firestore
 */
export const getTasks = async (): Promise<Task[]> => {
  const tasksRef = collection(db, TASKS_COLLECTION);
  const snapshot = await getDocs(tasksRef);

  const tasks: Task[] = snapshot.docs.map((docSnap) => parseTaskDoc(docSnap.id, docSnap.data()));

  tasks.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return timeB - timeA;
  });

  return tasks;
};

/**
 * Create a new task document in Cloud Firestore
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
    teamName: taskInput.teamName || null,
    assigneeId: taskInput.assigneeId || null,
    assigneeName: taskInput.assigneeName || null,
    creatorId: taskInput.creatorId || null,
  };

  const tasksRef = collection(db, TASKS_COLLECTION);
  const docRef = await addDoc(tasksRef, newTaskData);
  return docRef.id;
};

/**
 * Update an existing task document in Cloud Firestore
 */
export const updateTask = async (id: string, updates: UpdateTaskInput): Promise<void> => {
  const taskDocRef = doc(db, TASKS_COLLECTION, id);
  const cleanUpdates: Record<string, any> = {};

  if (updates.title !== undefined) cleanUpdates.title = updates.title.trim();
  if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
  if (updates.status !== undefined) cleanUpdates.status = updates.status;
  if (updates.priority !== undefined) cleanUpdates.priority = updates.priority;
  if (updates.dueDate !== undefined) cleanUpdates.dueDate = updates.dueDate;
  if (updates.teamId !== undefined) cleanUpdates.teamId = updates.teamId;
  if (updates.teamName !== undefined) cleanUpdates.teamName = updates.teamName;
  if (updates.assigneeId !== undefined) cleanUpdates.assigneeId = updates.assigneeId;
  if (updates.assigneeName !== undefined) cleanUpdates.assigneeName = updates.assigneeName;

  await updateDoc(taskDocRef, cleanUpdates);
};

/**
 * Delete a task document from Cloud Firestore
 */
export const deleteTask = async (id: string): Promise<void> => {
  const taskDocRef = doc(db, TASKS_COLLECTION, id);
  await deleteDoc(taskDocRef);
};
