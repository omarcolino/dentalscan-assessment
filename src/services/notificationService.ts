import { prisma } from "@/lib/prisma";

export type NotifyPayload = {
  scanId: string;
  status: string;
  userId: string;
};

export async function handleScanCompletedNotification(payload: NotifyPayload) {
  const scan = await prisma.scan.upsert({
    where: { id: payload.scanId },
    update: {
      status: payload.status,
      updatedAt: new Date(),
    },
    create: {
      id: payload.scanId,
      status: payload.status,
      images: "",
    },
  });

  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId,
      title: "Scan concluído",
      message: `O scan ${payload.scanId} foi finalizado e está pronto para revisão.`,
      read: false,
    },
  });

  return { scan, notification };
}
