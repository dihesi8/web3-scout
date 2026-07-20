import axios from "axios";
import { Lead } from "../types";
import { config } from "../config";

// Raw Farcaster hubs have no keyword search — you'd have to stream and
// filter every cast on the network yourself, which isn't practical for
// free. Neynar's free tier gives you a real search endpoint instead.
const HIRING_KEYWORDS = [
  "hiring dev",
  "looking for a dev",
  "looking for frontend",
  "looking for smart contract",
  "need a developer",
  "building a team",
];

interface NeynarCast {
  hash: string;
  text: string;
  author: {
    username: string;
    display_name: string;
    profile?: { bio?: { text?: string } };
  };
  embeds?: { url?: string }[];
}

export async function fetchFarcasterLeads(): Promise<Lead[]> {
  if (!config.neynar.apiKey) {
    console.log("NEYNAR_API_KEY not set — skipping Farcaster source.");
    return [];
  }

  const leads: Lead[] = [];

  for (const keyword of HIRING_KEYWORDS) {
    try {
      const { data } = await axios.get("https://api.neynar.com/v2/farcaster/cast/search", {
        params: { q: keyword, limit: 10 },
        headers: { api_key: config.neynar.apiKey },
      });

      const casts: NeynarCast[] = data?.result?.casts || [];
      for (const cast of casts) {
        const links = (cast.embeds || []).map((e) => e.url).filter(Boolean) as string[];
        leads.push({
          id: `fc-${cast.hash}`,
          source: "farcaster",
          name: cast.author.display_name || cast.author.username,
          website: links[0],
          socialLinks: [`https://warpcast.com/${cast.author.username}`, ...links],
          rawText: `${cast.text}\n\nAuthor bio: ${cast.author.profile?.bio?.text || ""}`,
        });
      }
    } catch (err) {
      console.error(`Farcaster search failed for "${keyword}":`, (err as Error).message);
    }
  }

  return leads;
}
