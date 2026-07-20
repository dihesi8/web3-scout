import TelegramBot from "node-telegram-bot-api";
import { config } from "./config";
import { ProjectReview } from "./ai/nvidia";

const bot = new TelegramBot(config.telegram.botToken, { polling: false });

export async function sendReviewToTelegram(review: ProjectReview) {
  const message = `🚀 *${escapeMd(review.name)}*
_Risk score: ${review.riskScore}/10_

*What it is:*
${escapeMd(review.summary)}

*Likely tech:* ${escapeMd(review.coreTechHypothesis)}
*Probable pain points:* ${escapeMd(review.technicalPainPoints)}

*Links:*
${review.links.map((l) => escapeMd(l)).join("\n") || "none found"}

*Suggested pitch:*
${escapeMd(review.pitch)}`;

  await bot.sendMessage(config.telegram.chatId, message, { parse_mode: "MarkdownV2" });
}

// Telegram's MarkdownV2 requires escaping a specific set of characters or
// the whole message send fails outright.
function escapeMd(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}
