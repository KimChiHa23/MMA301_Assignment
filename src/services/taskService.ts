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

// Initial sample tasks to seed when collection is empty
const INITIAL_SAMPLE_TASKS = [
  {
    title: 'Set up Firebase Project & Firestore Database',
    description: 'Created Firebase project in console, enabled Firestore in test mode and configured credentials.',
    status: 'done' as const,
    priority: 'high' as const,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    teamId: null,
    assigneeId: null,
  },
  {
    title: 'Implement Task CRUD Screen with Realtime Updates',
    description: 'Built responsive UI with Expo, React Navigation bottom tabs and Firestore onSnapshot listener.',
    status: 'in_progress' as const,
    priority: 'high' as const,
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    teamId: null,
    assigneeId: null,
  },
  {
    title: 'Prepare Exam 1 Submission Report with Screenshots',
    description: 'Capture required screenshots of Firebase Console and CRUD screens for StudentID_Exam1.docx.',
    status: 'todo' as const,
    priority: 'medium' as const,
    dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
    teamId: null,
    assigneeId: null,
  },
];

type TasksCallback = (tasks: Task[]) => void;
type ErrorCallback = (error: Error) => void;

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
    return false;
  }
};

/**
 * Subscribe to real-time tasks updates using Cloud Firestore onSnapshot
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
 * Fetch all tasks once from Cloud Firestore
 */
export const getTasks = async (): Promise<Task[]> => {
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
    assigneeId: taskInput.assigneeId || null,
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
  if (updates.assigneeId !== undefined) cleanUpdates.assigneeId = updates.assigneeId;

  await updateDoc(taskDocRef, cleanUpdates);
};

/**
 * Delete a task document from Cloud Firestore
 */
export const deleteTask = async (id: string): Promise<void> => {
  const taskDocRef = doc(db, TASKS_COLLECTION, id);
  await deleteDoc(taskDocRef);
};
