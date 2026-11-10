export type UnreadCountResponse = {
  count: number;
};

export type BroadcastRequest = {
  title: string;
  message: string;
};

export type NotificationResponse = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
};
