import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';
import type { ProjectModel } from './models/project.model';

const logger = createScopedLogger('ChatHistory');

/**
 * Define the base URL for your API.
 * It's recommended to use an environment variable for this.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export async function getCurrentUser(): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        logger.warn('User not authenticated');
        return null;
      }

      logger.error('Error fetching current user:', response.statusText);

      return null;
    }

    const user = await response.json();

    return user;
  } catch (error) {
    logger.error('Error fetching user:', error);
    return null;
  }
}

export const currentUser = await getCurrentUser();

async function checkAuth(): Promise<void> {
  if (!currentUser) {
    return Promise.reject(new Error('User not authenticated'));
  }

  return Promise.resolve();
}

export async function getAll(): Promise<ChatHistoryItem[]> {
  try {
    await checkAuth();

    const response = await fetch(`${API_BASE_URL}/chats`, {
      credentials: 'include',
    });

    if (!response.ok) {
      logger.error('Error getting all chats from API:', response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as ChatHistoryItem[];
  } catch (error) {
    logger.error('Error getting all chats:', error);
    throw error;
  }
}

export async function setMessages(id: string, messages: Message[], urlId?: string): Promise<void> {
  try {
    await checkAuth();
    logger.debug('Saving messages via API:', { id, messages, urlId });

    const payload = {
      id, // or let the server generate it
      messages,
      urlId: urlId || id,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(`${API_BASE_URL}/chats/${id}`, {
      method: 'PUT', // or 'POST' if creating new and server generates ID
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (!response.ok) {
      logger.error('Error setting messages via API:', response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    logger.error('Error setting messages:', error);
    throw error;
  }
}

export async function getMessages(id: string): Promise<ChatHistoryItem | undefined> {
  /**
   * This function attempts to get by ID first, then by URL ID.
   * Your API might handle this differently, e.g., a single endpoint with query params.
   */

  try {
    const byId = await getMessagesById(id);

    if (byId) {
      return byId;
    }
  } catch (error) {
    // log error from getMessagesById but continue to try getMessagesByUrlId
    logger.warn('Failed to get messages by ID, trying by URL ID:', error);
  }

  try {
    return await getMessagesByUrlId(id); // assuming 'id' can be a URL ID here
  } catch (error) {
    logger.error('Failed to get messages by URL ID as well:', error);

    return undefined; // or rethrow if preferred
  }
}

export async function getMessagesByUrlId(urlId: string): Promise<ChatHistoryItem | undefined> {
  try {
    await checkAuth();

    // TODO: Replace with your actual API endpoint for getting messages by URL ID
    const response = await fetch(`${API_BASE_URL}/chats?urlId=${encodeURIComponent(urlId)}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return undefined;
      }

      logger.error('Error getting messages by urlId from API:', response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // assuming API returns a single item or an array with one item if found
    return Array.isArray(data) ? (data[0] as ChatHistoryItem) : (data as ChatHistoryItem);
  } catch (error) {
    logger.error('Error getting messages by urlId:', error);
    throw error;
  }
}

export async function getMessagesById(id: string): Promise<ChatHistoryItem | undefined> {
  try {
    await checkAuth();

    const response = await fetch(`${API_BASE_URL}/chats/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return undefined;
      }

      logger.error('Error getting messages by id from API:', response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as ChatHistoryItem;
  } catch (error) {
    logger.error('Error getting messages by id:', error);
    throw error;
  }
}

export async function deleteById(id: string): Promise<void> {
  try {
    await checkAuth();

    const response = await fetch(`${API_BASE_URL}/chats/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      logger.error('Error deleting chat via API:', response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    logger.error('Error deleting chat:', error);
    throw error;
  }
}

export async function getNextId(): Promise<string> {
  try {
    await checkAuth();

    const response = await fetch(`${API_BASE_URL}/chats/next-id`, {
      credentials: 'include',
    });

    if (!response.ok) {
      logger.error('Error getting next ID from API:', response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return (data as any).nextId as string; // assuming API returns { nextId: 'someValue' }
  } catch (error) {
    logger.error('Error getting next id:', error);

    throw error;
  }
}

export async function getUrlId(id: string): Promise<string> {
  await checkAuth();

  const idList = await getUrlIds(); // this now calls an API endpoint

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
    await checkAuth();

    const response = await fetch(`${API_BASE_URL}/chats/url-ids`, {
      credentials: 'include',
    });

    if (!response.ok) {
      logger.error('Error getting URL IDs from API:', response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as string[]; // assuming API returns an array of strings
  } catch (error) {
    logger.error('Error getting urlIds:', error);
    throw error;
  }
}

export const getProjectById = async (projectId: string): Promise<ProjectModel | null> => {
  console.log('projectId', projectId);

  try {
    const response = await fetch(`${API_BASE_URL}/projects/get/${projectId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.warn(`Project with ID ${projectId} not found via API.`);
        return null; // or throw new Error('Project not found'); as per original logic
      }

      logger.error('Error getting project by ID from API:', response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as ProjectModel;
  } catch (error) {
    logger.error(`Error in getProjectById for projectId ${projectId}:`, error);

    throw error; // rethrowing to ensure the caller is aware of the failure
  }
};
