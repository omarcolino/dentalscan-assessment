type NotificationApiResourceInput = {
  scanId: string;
  notificationId: string;
};

export function notificationCreatedResource(
  input: NotificationApiResourceInput
) {
  return {
    ok: true,
    message: "Notification triggered",
    data: {
      scanId: input.scanId,
      notificationId: input.notificationId,
      status: "unread",
    },
  };
}
