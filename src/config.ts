import dotenv from "dotenv";
dotenv.config();

function required(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing required env var: ${name}. Check your .env file (see .env.example).`);
  }
  return val;
}

export const config = {
  nvidia: {
    apiKey: required("NVIDIA_API_KEY"),
    // Any chat model available on build.nvidia.com works here — override
    // via env if you want to try a different one.
    model: process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct",
  },
  telegram: {
    botToken: required("TELEGRAM_BOT_TOKEN"),
    chatId: required("TELEGRAM_CHAT_ID"),
  },
  neynar: {
    apiKey: process.env.NEYNAR_API_KEY || "", // optional — Farcaster source is skipped if absent
  },
  filters: {
    minLiquidityUsd: Number(process.env.MIN_LIQUIDITY_USD || 10000),
    chains: (process.env.CHAINS || "solana,base").split(",").map((c) => c.trim().toLowerCase()),
  },
};
