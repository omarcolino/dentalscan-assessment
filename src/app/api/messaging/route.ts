import { NextResponse } from "next/server";
import {
  createMessage,
  getMessagesByThread,
  type CreateMessagePayload,
  type MessageSender,
} from "@/services/messagingService";
import {
  messagingCreatedResource,
  messagingListResource,
} from "@/resources/messagingResource";

/**
 * CHALLENGE: MESSAGING SYSTEM
 * 
 * Your goal is to build a basic communication channel between the Patient and Dentist.
 * 1. Implement the POST handler to save a new message into a Thread.
 * 2. Implement the GET handler to retrieve message history for a given thread.
 * 3. Focus on data integrity and proper relations.
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");

  if (!threadId) {
    return NextResponse.json({ error: "Missing threadId" }, { status: 400 });
  }

  try {
    const messages = await getMessagesByThread(threadId);
    return NextResponse.json(messagingListResource(messages));
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateMessagePayload;
    const sender = (body.sender ?? "patient") as MessageSender;

    if (!["patient", "dentist"].includes(sender)) {
      return NextResponse.json({ error: "Invalid sender" }, { status: 400 });
    }

    if (!body.createThreadOnly && !body.content?.trim()) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const result = await createMessage({
      threadId: body.threadId?.trim(),
      patientId: body.patientId?.trim(),
      sender,
      content: body.content?.trim(),
      createThreadOnly: Boolean(body.createThreadOnly),
    });

    return NextResponse.json(
      messagingCreatedResource({
        threadId: result.thread.id,
        message: result.message,
      })
    );
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
