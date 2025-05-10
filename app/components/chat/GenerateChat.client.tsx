import { useStore } from '@nanostores/react';
import { setMessages } from '~/lib/persistence/db';
import { chatId } from '~/lib/persistence/useChatHistory';
import type { Message } from 'ai';
import { useChat } from 'ai/react';
import { useAnimate } from 'framer-motion';
import { memo, useEffect, useRef, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useMessageParser, usePromptEnhancer, useShortcuts } from '~/lib/hooks';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { BaseChat } from './BaseChat';
import { WebGenService } from '~/utils/webgwenService';
import { getProjectById } from '~/lib/persistence/db';
import { createScopedLogger } from '~/utils/logger';
import { fileModificationsToHTML } from '~/utils/diff';

const logger = createScopedLogger('GenerateChat');

interface GenerateChatProps {
  projectId: string;
}

export const GenerateChat = memo(({ projectId }: GenerateChatProps) => {
  useShortcuts();

  const webGenService = new WebGenService();
  const hasInitialized = useRef(false);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { showChat } = useStore(chatStore);
  const [animationScope, animate] = useAnimate();

  const { messages, append, isLoading, stop } = useChat({
    api: '/api/chat',
    onError: (error) => {
      logger.error('Request failed\n\n', error);
      toast.error('There was an error processing your request');
    },
    onFinish: () => {
      logger.debug('Finished streaming');
      chatStore.setKey('started', true);
    },
  });

  const { parsedMessages, parseMessages } = useMessageParser();

  const sendMessage = async (message: string) => {
    if (isLoading) return;

    await append({
      role: 'assistant',
      content: message,
    });

    // Store messages in database
    await setMessages(
      projectId,
      messages.map((message) => ({ ...message })),
    );
  };

  const executeGeneration = async (prompt: string) => {
    if (isLoading) return;

    await workbenchStore.saveAllFiles();
    const fileModifications = workbenchStore.getFileModifcations();
    chatStore.setKey('aborted', false);

    // First display the prompt
    await append({
      role: 'user',
      content: prompt,
    });

    // Then execute it
    if (fileModifications !== undefined) {
      const diff = fileModificationsToHTML(fileModifications);
      await sendMessage(`${diff}\n\n${prompt}`);
      workbenchStore.resetAllFileModifications();
    } else {
      await sendMessage(prompt);
    }
  };

  useEffect(() => {
    const initializeChat = async () => {
      if (!projectId || hasInitialized.current) {
        return;
      }

      hasInitialized.current = true;
      setIsLoadingProject(true);
      setError(null);
      chatStore.setKey('aborted', false);

      try {
        await workbenchStore.saveAllFiles();
        const project = await getProjectById(projectId);

        if (!project) {
          throw new Error('Project not found');
        }

        const prompt = webGenService.generateWebsitePrompt(project);

        // Show the prompt in chat
        await append({
          role: 'user',
          content: prompt,
        });

        // Execute generation directly
        await executeGeneration(prompt);

        chatStore.setKey('started', true);
        setIsLoadingProject(false);
      } catch (error) {
        logger.error('Error initializing generation:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        toast.error('Failed to initialize generation');
      } finally {
        setIsLoadingProject(false);
      }
    };

    initializeChat();
  }, [projectId, append]);

  useEffect(() => {
    parseMessages(messages, isLoading);
  }, [messages, isLoading, parseMessages]);

  if (isLoadingProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-r from-gray-900 to-gray-700">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
          <p className="text-sm text-gray-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="i-ph:warning-circle-bold text-4xl text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <BaseChat
        ref={animationScope}
        messages={messages.filter((m) => m.role === 'user' && !m.id?.includes('hidden-generation'))}
        chatStarted={true}
        isStreaming={isLoading}
        handleStop={stop}
        showChat={showChat}
      />
      <ToastContainer
        position="bottom-right"
        pauseOnFocusLoss
        icon={({ type }) => {
          switch (type) {
            case 'success': {
              return <div className="i-ph:check-bold text-lexi-elements-icon-success text-2xl" />;
            }
            case 'error': {
              return <div className="i-ph:warning-circle-bold text-lexi-elements-icon-error text-2xl" />;
            }
          }
          return undefined;
        }}
      />
    </>
  );
});
