import { useEffect, useRef } from 'react';
import { useParams } from '@remix-run/react';
import { WebGenService } from '~/utils/webgwenService';
import type { ProjectModel } from '~/lib/persistence/models/project.model';
import { Messages } from '~/components/chat/Messages.client';
import { SendButton } from '~/components/chat/SendButton.client';
import { useChat } from 'ai/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '~/lib/persistence';

export default function GenerateRoute() {
  const { id } = useParams();
  const webGenService = new WebGenService();
  const { messages, setMessages, append, isLoading } = useChat();
  const hasInitialized = useRef(false);

  const getProjectById = async (projectId: string): Promise<ProjectModel | null> => {
    try {
      const projectRef = doc(db!, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      if (projectDoc.exists()) {
        return { ...projectDoc.data(), id: projectDoc.id } as ProjectModel;
      }
      return null;
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeChat = async () => {
      if (!id || hasInitialized.current) return;
      hasInitialized.current = true;

      try {
        const project = await getProjectById(id);
        
        if (!project) {
          throw new Error('Project not found');
        }

        const prompt = webGenService.generateWebsitePrompt(project);

        await append({
          role: 'user',
          content: prompt,
        });

      } catch (error) {
        console.error('Error initializing generation:', error);
      }
    };

    initializeChat();
  }, [id, append]);

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
