import { useParams } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { GenerateChat } from '~/components/chat/GenerateChat.client';

export default function GenerateRoute() {
  const { id } = useParams();

  if (!id) {
    return null;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <ClientOnly fallback={<BaseChat />}>
        {() => <GenerateChat projectId={id} />}
      </ClientOnly>
    </div>
  );
}
