import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { ChatMessage } from '../types/team';
import { UserProfile } from '../types/auth';

/**
 * Format timestamp into display string or ISO string
 */
const parseChatTimestamp = (val: any): string => {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
};

/**
 * Send a message to team's subcollection `teams/{teamId}/messages`
 */
export const sendTeamMessage = async (
  teamId: string,
  sender: UserProfile,
  text: string
): Promise<string> => {
  const cleanText = text.trim();
  if (!cleanText) return '';

  const messagesRef = collection(db, 'teams', teamId, 'messages');
  const docRef = await addDoc(messagesRef, {
    senderId: sender.id,
    senderName: sender.name,
    text: cleanText,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

/**
 * Subscribe to real-time messages in `teams/{teamId}/messages` ordered by createdAt asc
 */
export const subscribeToTeamMessages = (
  teamId: string,
  onNext: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const messagesRef = collection(db, 'teams', teamId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages: ChatMessage[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            senderId: data.senderId || '',
            senderName: data.senderName || 'Member',
            text: data.text || '',
            createdAt: parseChatTimestamp(data.createdAt),
          };
        });

        onNext(messages);
      },
      (err) => {
        console.error('Error in subscribeToTeamMessages:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error('Failed to initialize chat listener:', error);
    if (onError) onError(error);
    return () => {};
  }
};
