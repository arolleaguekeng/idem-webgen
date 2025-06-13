import { useChat } from 'ai/react';
import { toast, ToastContainer } from 'react-toastify';
import { useAnimate } from 'framer-motion';
import { memo, useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';

import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { useShortcuts, useMessageParser } from '~/lib/hooks';
import { WebGenService } from '~/utils/webgwenService';
import { BaseChat } from './BaseChat';
import { getProjectById } from '~/lib/persistence/db';
import { createScopedLogger } from '~/utils/logger';
import { fileModificationsToHTML } from '~/utils/diff';
import { updateWebContainerMetadata, getRegisteredWebContainerId } from '~/lib/webcontainer';
import { useChatWithWebcontainer } from '~/lib/hooks/useChatWithWebcontainer';

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
  const [animationScope] = useAnimate();

  const { chatHistory, saveMessages } = useChatWithWebcontainer(projectId);

  const { messages, append, isLoading, stop } = useChat({
    api: '/api/chat',
    initialMessages: chatHistory?.messages || [],
    onError: (error) => {
      logger.error('Request failed\n\n', error);
      toast.error('There was an error processing your request');
    },
    onFinish: () => {
      logger.debug('Finished streaming');
      chatStore.setKey('started', true);
    },
  });

  const { parseMessages } = useMessageParser();

  const sendMessage = async (_message: string) => {
    if (isLoading) {
      return;
    }

    await saveMessages(messages.map((message) => ({ ...message })));
  };

  const executeGeneration = async (prompt: string) => {
    if (isLoading) {
      return;
    }

    await workbenchStore.saveAllFiles();

    const fileModifications = workbenchStore.getFileModifcations();
    chatStore.setKey('aborted', false);

    await append({
      role: 'user',
      content: prompt,
    });

    if (fileModifications !== undefined) {
      const diff = fileModificationsToHTML(fileModifications);
      await sendMessage(`${diff}\n\n${prompt}`);
      workbenchStore.resetAllFileModifications();

      // mettre à jour les métadonnées du webcontainer avec les fichiers créés
      try {
        const webcontainerId = getRegisteredWebContainerId();

        if (webcontainerId) {
          const modifiedFiles = Object.keys(fileModifications);
          await updateWebContainerMetadata({
            files: modifiedFiles,
          });
          logger.debug('Updated webcontainer metadata with files:', modifiedFiles);
        }
      } catch (error) {
        logger.warn('Failed to update webcontainer metadata:', error);
      }
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

        setIsLoadingProject(false);

        const prompt = webGenService.generateWebsitePrompt(project);

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
      <div className="flex h-screen items-center justify-center bg-gradient-to-r from-[#111827] to-[#1f2937]">
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
              return <div className="i-ph:check-bold text-idem-elements-icon-success text-2xl" />;
            }
            case 'error': {
              return <div className="i-ph:warning-circle-bold text-idem-elements-icon-error text-2xl" />;
            }
          }
          return undefined;
        }}
      />
    </>
  );
});
