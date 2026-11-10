export class APIError extends Error {
  status: number;
  messages: string[];
  constructor(messages: string[], status: number) {
    super(messages.join(', '));
    this.status = status;
    this.messages = messages;
  }
}

export const isAPIError = (error: unknown): error is APIError => {
  return error instanceof APIError;
};
