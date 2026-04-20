import { prisma } from "@/lib/prisma";

export type MessageSender = "patient" | "dentist";

export type CreateMessagePayload = {
  threadId?: string;
  patientId?: string;
  content?: string;
  sender?: MessageSender;
  createThreadOnly?: boolean;
};

export async function getMessagesByThread(threadId: string) {
  return prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createThread(patientId: string) {
  return prisma.thread.create({
    data: {
      patientId,
    },
  });
}

export async function ensureThread(payload: CreateMessagePayload) {
  if (payload.threadId) {
    const thread = await prisma.thread.findUnique({
      where: { id: payload.threadId },
    });
    if (thread) {
      return thread;
    }
  }

  const patientId = payload.patientId?.trim() || "patient-demo";
  return createThread(patientId);
}

export async function createMessage(payload: CreateMessagePayload) {
  const thread = await ensureThread(payload);

  if (payload.createThreadOnly) {
    return { thread, message: null };
  }

  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      content: payload.content ?? "",
      sender: payload.sender ?? "patient",
    },
  });

  return { thread, message };
}
