type ReviewTriggeredPayload = {
  userEmail?: string | null;
  eventName?: string | null;
  projectCount: number;
};

export async function sendReviewTriggeredWebhook({
  userEmail,
  eventName,
  projectCount,
}: ReviewTriggeredPayload) {
  const webhookUrl =
    process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn(
      "NEXT_PUBLIC_DISCORD_WEBHOOK_URL is not set; skipping Discord notification",
    );
    return;
  }

  const safeCount =
    Number.isFinite(projectCount) && projectCount > 0
      ? Math.floor(projectCount)
      : 1;

  const email = userEmail || "unknown user";
  const event = eventName || "Unknown event";

  const message = [
    "🚀 Bench review triggered",
    `- User: ${email}`,
    `- Event: ${event}`,
    `- Projects: ${safeCount}`,
  ].join("\n");

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  } catch (error) {
    console.error("Failed to send Discord webhook", error);
  }
}
