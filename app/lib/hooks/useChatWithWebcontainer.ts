import { useState, useEffect } from 'react';
import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import { getChatByWebcontainerId, setMessages } from '~/lib/persistence/db';
import { getRegisteredWebContainerId } from '~/lib/webcontainer';
import type { ChatHistoryItem } from '~/lib/persistence/useChatHistory';

const logger = createScopedLogger('ChatWithWebcontainer');

/**
 * Hook pour gérer l'historique du chat associé à un webcontainer.
 */
export function useChatWithWebcontainer(projectId: string) {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const webcontainerId = getRegisteredWebContainerId();

        if (!webcontainerId) {
          logger.debug('No webcontainer ID available yet');
          setIsLoading(false);

          return;
        }

        const existingChat = await getChatByWebcontainerId(webcontainerId);

        if (existingChat) {
          setChatHistory(existingChat);
          logger.debug('Loaded existing chat for webcontainer:', webcontainerId);
        } else {
          logger.debug('No existing chat found for webcontainer:', webcontainerId);
        }
      } catch (err) {
        logger.error('Error loading chat history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(loadChatHistory, 1000);

    return () => clearTimeout(timer);
  }, [projectId]);

  const saveMessages = async (messages: Message[]) => {
    try {
      const webcontainerId = getRegisteredWebContainerId();

      if (!webcontainerId) {
        logger.warn('No webcontainer ID available for saving messages');

        return;
      }

      await setMessages(projectId, messages, undefined, webcontainerId);

      setChatHistory({
        id: projectId,
        messages,
        timestamp: new Date().toISOString(),
        projectId,
        webcontainerId,
      });

      logger.debug('Messages saved with webcontainer ID:', webcontainerId);
    } catch (err) {
      logger.error('Error saving messages:', err);
      throw err;
    }
  };

  return {
    chatHistory,
    isLoading,
    error,
    saveMessages,
    webcontainerId: getRegisteredWebContainerId(),
  };
}
