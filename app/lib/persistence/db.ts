import { getAuth } from 'firebase/auth';
import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import type { UserModel } from './userModel';
import type { ProjectModel } from './models/project.model';

const logger = createScopedLogger('ChatHistory');

// configuration Firebase (à remplacer avec votre config)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('config', firebaseConfig);

// initialisation de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function checkAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        unsubscribe();

        if (user) {
          resolve();
        } else {
          reject(new Error('User not authenticated'));
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
  });
}

export async function getCurrentUser(): Promise<UserModel | null> {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    const response = await fetch('http://localhost:3000/api/profile', {
      credentials: 'include',
    });

    if (!response.ok) {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        subscription: 'free',
        createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : new Date(),
        lastLogin: firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime) : new Date(),
      };
    }

    const user = (await response.json()) as UserModel;
    return {
      ...user,
      uid: firebaseUser.uid,
      photoURL: firebaseUser.photoURL || user.photoURL || '',
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

const currentUser = await getCurrentUser();

// référence à la collection 'chats'
const chatsCollection = collection(db, `users/${currentUser?.uid}/chats`);

export async function openDatabase(): Promise<typeof db> {
  return Promise.resolve(db);
}

export async function getAll(): Promise<ChatHistoryItem[]> {
  try {
    checkAuth();

    const querySnapshot = await getDocs(chatsCollection);

    return querySnapshot.docs.map((doc) => doc.data() as ChatHistoryItem);
  } catch (error) {
    logger.error('Error getting all chats:', error);
    throw error;
  }
}

export async function setMessages(
  id: string,
  messages: Message[],
  urlId?: string,
): Promise<void> {
  try {
    console.log('Saving messages to database:', {
      id,
      messages,
      urlId,
    });
    const chatDoc = doc(chatsCollection, id);
    await setDoc(chatDoc, {
      id,
      messages,
      urlId: urlId || id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error setting messages:', error);
    logger.error('Error setting messages:', error);
    throw error;
  }
}

export async function getMessages(id: string): Promise<ChatHistoryItem | undefined> {
  const byId = await getMessagesById(id);

  if (byId) {
    return byId;
  }

  return getMessagesByUrlId(id);
}

export async function getMessagesByUrlId(urlId: string): Promise<ChatHistoryItem | undefined> {
  try {
    const q = query(chatsCollection, where('urlId', '==', urlId), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return undefined;
    }

    return querySnapshot.docs[0].data() as ChatHistoryItem;
  } catch (error) {
    logger.error('Error getting messages by urlId:', error);
    throw error;
  }
}

export async function getMessagesById(id: string): Promise<ChatHistoryItem | undefined> {
  try {
    checkAuth();

    const chatDoc = doc(chatsCollection, id);
    const docSnapshot = await getDoc(chatDoc);

    if (!docSnapshot.exists()) {
      return undefined;
    }

    return docSnapshot.data() as ChatHistoryItem;
  } catch (error) {
    logger.error('Error getting messages by id:', error);
    throw error;
  }
}

export async function deleteById(id: string): Promise<void> {
  try {
    checkAuth();

    const chatDoc = doc(chatsCollection, id);
    await deleteDoc(chatDoc);
  } catch (error) {
    logger.error('Error deleting chat:', error);
    throw error;
  }
}

export async function getNextId(): Promise<string> {
  try {
    // pour Firestore, on peut utiliser un timestamp comme ID ou générer un ID aléatoire mais si vous voulez conserver la logique d'incrémentation :
    checkAuth();

    const q = query(chatsCollection, orderBy('id', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return '1';
    }

    const lastId = querySnapshot.docs[0].data().id;

    return String(Number(lastId) + 1);
  } catch (error) {
    logger.error('Error getting next id:', error);
    throw error;
  }
}

export async function getUrlId(id: string): Promise<string> {
  checkAuth();

  const idList = await getUrlIds();

  if (!idList.includes(id)) {
    return id;
  } else {
    let i = 2;

    while (idList.includes(`${id}-${i}`)) {
      i++;
    }

    return `${id}-${i}`;
  }
}

async function getUrlIds(): Promise<string[]> {
  try {
    checkAuth();

    const querySnapshot = await getDocs(chatsCollection);

    return querySnapshot.docs.map((doc) => doc.data().urlId).filter(Boolean);
  } catch (error) {
    logger.error('Error getting urlIds:', error);
    throw error;
  }
}

export const getProjectById = async (projectId: string): Promise<ProjectModel | null> => {
  if (!projectId) {
    throw new Error('No project ID provided');
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  const projectRef = doc(db, `users/${currentUser.uid}/projects/${projectId}`);
  const projectDoc = await getDoc(projectRef);

  if (!projectDoc.exists()) {
    throw new Error('Project not found');
  }

  return { ...projectDoc.data(), id: projectDoc.id } as ProjectModel;
};
