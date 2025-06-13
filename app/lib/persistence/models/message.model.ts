export interface Message {
  id: string;

  createdAt?: Date;

  content: string;
  role: 'system' | 'user' | 'assistant';

  attachments?: {
    type: string;
    url: string;
    name?: string;
  }[];

  metadata?: {
    [key: string]: unknown;
  };
}
