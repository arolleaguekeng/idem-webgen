import { useState, useEffect } from 'react';
import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ChatHistory');

export interface ChatHistoryItem {
  id: string;
  messages: Message[];
  timestamp: string;
  projectId: string;
}

/**
 * Hook pour gérer l'historique du chat en utilisant localStorage.
 * Découplé du webcontainer pour une sauvegarde indépendante.
 */
export function useChatHistory(projectId: string) {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStorageKey = (projectId: string) => `chat_history_${projectId}`;

  useEffect(() => {
    const loadChatHistory = () => {
      try {
        setIsLoading(true);
        setError(null);

        const storageKey = getStorageKey(projectId);
        const storedData = localStorage.getItem(storageKey);

        if (storedData) {
          const parsedData: ChatHistoryItem = JSON.parse(storedData);
          setChatHistory(parsedData);
          logger.debug('Loaded chat history from localStorage for project:', projectId);
        } else {
          logger.debug('No existing chat history found for project:', projectId);
        }
      } catch (err) {
        logger.error('Error loading chat history from localStorage:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [projectId]);

  const saveMessages = async (messages: Message[]) => {
    try {
      const chatItem: ChatHistoryItem = {
        id: projectId,
        messages,
        timestamp: new Date().toISOString(),
        projectId,
      };

      const storageKey = getStorageKey(projectId);
      localStorage.setItem(storageKey, JSON.stringify(chatItem));
      setChatHistory(chatItem);

      logger.debug('Messages saved to localStorage for project:', projectId);
    } catch (err) {
      logger.error('Error saving messages to localStorage:', err);
      throw err;
    }
  };

  const clearHistory = () => {
    try {
      const storageKey = getStorageKey(projectId);
      localStorage.removeItem(storageKey);
      setChatHistory(null);
      logger.debug('Chat history cleared for project:', projectId);
    } catch (err) {
      logger.error('Error clearing chat history:', err);
    }
  };

  const getAllChatProjects = (): string[] => {
    try {
      const allKeys = Object.keys(localStorage);
      return allKeys.filter((key) => key.startsWith('chat_history_')).map((key) => key.replace('chat_history_', ''));
    } catch (err) {
      logger.error('Error getting all chat projects:', err);
      return [];
    }
  };

  return {
    chatHistory,
    isLoading,
    error,
    saveMessages,
    clearHistory,
    getAllChatProjects,
  };
}
