import { useEffect, useRef, useState } from 'react';
import { useParams } from '@remix-run/react';
import { WebGenService } from '~/utils/webgwenService';
import type { ProjectModel } from '~/lib/persistence/models/project.model';
import { Messages } from '~/components/chat/Messages.client';
import { SendButton } from '~/components/chat/SendButton.client';
import { doc, getDoc } from 'firebase/firestore';
import { useChat } from 'ai/react';
import { getCurrentUser } from '~/lib/persistence/db';
import { db } from '~/lib/persistence';


export default function GenerateRoute() {
  const { id } = useParams();
  const webGenService = new WebGenService();
  const { messages, setMessages, append, isLoading } = useChat();
  const hasInitialized = useRef(false);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getProjectById = async (projectId: string): Promise<ProjectModel | null> => {
    if (!projectId) {
      throw new Error('No project ID provided');
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const projectRef = doc(db!, `users/${currentUser.uid}/projects/${projectId}`);
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    return { ...projectDoc.data(), id: projectDoc.id } as ProjectModel;
  };

  useEffect(() => {
    const initializeChat = async () => {
      if (!id || hasInitialized.current) return;
      hasInitialized.current = true;
      setIsLoadingProject(true);
      setError(null);

      try {
        // Récupérer le projet depuis Firebase
        const project = await getProjectById(id);
        
        if (!project) {
          throw new Error('Project not found');
        }

        // Générer le prompt avec WebGenService
        const prompt = webGenService.generateWebsitePrompt(project);

        // Envoyer automatiquement le prompt au chat
        await append({
          role: 'user',
          content: prompt,
        });

      } catch (error) {
        console.error('Error initializing generation:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoadingProject(false);
      }
    };

    initializeChat();
  }, [id, append]);

  if (isLoadingProject) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="i-ph:circle-notch-bold text-4xl animate-spin text-accent-500" />
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
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <div className="relative h-full">
          <Messages messages={messages} />
          <SendButton show={true} isStreaming={isLoading} />
        </div>
      </div>
    </div>
  );
}
