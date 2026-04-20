import type { Message } from "@prisma/client";

export function messagingListResource(messages: Message[]) {
  return {
    messages: messages.map((message) => ({
      id: message.id,
      threadId: message.threadId,
      content: message.content,
      sender: message.sender as "patient" | "dentist",
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

export function messagingCreatedResource(input: {
  threadId: string;
  message?: Message | null;
}) {
  return {
    ok: true,
    threadId: input.threadId,
    message: input.message
      ? {
          id: input.message.id,
          content: input.message.content,
          sender: input.message.sender as "patient" | "dentist",
          createdAt: input.message.createdAt.toISOString(),
        }
      : null,
  };
}
