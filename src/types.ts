export interface Lead {
  id: string;              // unique id used for dedupe (e.g. token address, cast hash)
  source: "dexscreener" | "farcaster";
  name: string;
  chain?: string;
  website?: string;
  socialLinks: string[];
  liquidityUsd?: number;
  volume24hUsd?: number;
  rawText: string;         // whatever text context we have (bio, description, cast text)
}
