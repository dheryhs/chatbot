import { prisma } from "./prisma";
import { waha } from "./waha";
import { processMessage } from "./messageHelper";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min: number, max: number) {
  return (Math.floor(Math.random() * (max - min + 1)) + min) * 1000;
}

// Background broadcast loop — sends messages one by one with delay
export async function runBroadcastLoop(broadcastId: string) {
  while (true) {
    // Re-fetch broadcast to check current status (PAUSED / RUNNING)
    const broadcast = await prisma.broadcast.findUnique({
      where: { id: broadcastId },
      include: { session: true },
    });

    if (!broadcast) return;

    // If paused, stop the loop — resume will restart it
    if (broadcast.status === "PAUSED") return;

    // If completed or failed, stop
    if (broadcast.status === "COMPLETED" || broadcast.status === "FAILED") return;

    // Get next pending recipient
    const recipient = await prisma.broadcastRecipient.findFirst({
      where: { broadcastId, status: "PENDING" },
      include: { contact: true },
    });

    // No more pending recipients → mark as completed
    if (!recipient) {
      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      return;
    }

    // Send the messages (multiple contents)
    try {
      const chatId = recipient.phoneNumber.includes("@")
        ? recipient.phoneNumber
        : `${recipient.phoneNumber}@c.us`;

      const contents = (broadcast.contents as any[]) || [];
      
      // If contents is empty, fallback to legacy messageBody
      if (contents.length === 0 && broadcast.messageBody) {
        const finalMsg = processMessage(broadcast.messageBody, recipient.contact);
        await waha.sendTextToChat(broadcast.session.wahaSessionId, chatId, finalMsg);
      } else {
        // Send each item in contents
        for (const item of contents) {
          if (item.type === "text") {
            const finalMsg = processMessage(item.text, recipient.contact);
            await waha.sendTextToChat(broadcast.session.wahaSessionId, chatId, finalMsg);
          } else if (item.type === "image") {
            const finalCaption = item.caption ? processMessage(item.caption, recipient.contact) : "";
            await waha.sendImageToChat(broadcast.session.wahaSessionId, chatId, item.url, finalCaption);
          }
          // Small hardcoded delay between contents for the same contact to preserve order
          await sleep(1000);
        }
      }

      // Update recipient as SENT
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      // Increment sentCount
      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: { sentCount: { increment: 1 } },
      });
    } catch (err) {
      console.error(`Broadcast send failed for ${recipient.phoneNumber}:`, err);

      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: "FAILED" },
      });

      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: { failedCount: { increment: 1 } },
      });
    }

    // Sleep with random delay
    await sleep(randomDelay(broadcast.delayMin, broadcast.delayMax));
  }
}