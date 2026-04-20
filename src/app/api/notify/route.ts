import { NextResponse } from "next/server";
import {
  handleScanCompletedNotification,
  type NotifyPayload,
} from "@/services/notificationService";
import { notificationCreatedResource } from "@/resources/notificationResource";

/**
 * CHALLENGE: NOTIFICATION SYSTEM
 * 
 * Your goal is to implement a robust notification logic.
 * 1. When a scan is "completed", create a record in the Notification table.
 * 2. Return a success status to the client.
 * 3. Bonus: Handle potential errors (e.g., database connection issues).
 */

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<NotifyPayload>;
    const scanId = body.scanId?.trim();
    const status = body.status?.trim();
    const userId = body.userId?.trim();

    if (!scanId || !status || !userId) {
      return NextResponse.json(
        { error: "scanId, status e userId são obrigatórios" },
        { status: 400 }
      );
    }

    if (status === "completed") {
      const result = await handleScanCompletedNotification({
        scanId,
        status,
        userId,
      });

      return NextResponse.json(
        notificationCreatedResource({
          scanId: result.scan.id,
          notificationId: result.notification.id,
        })
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
