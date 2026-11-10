export type ChatRequest = {
  message: string;
};

export type ChatResponse = {
  response: string;
};

export enum ChatRole {
  User = 'user',
  Recepcionist = 'recepcionist',
  Instructor = 'instructor',
  Client = 'client',
  System = 'system',
  Tool = 'tool',
  Assistant = 'assistant',
}

export type Message = {
  message_id: string;
  conversation_id: string;
  sender_role: ChatRole | string;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
};

export type Conversation = {
  conversation_id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  messages?: Message[];
};
