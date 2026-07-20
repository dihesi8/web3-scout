import axios from "axios";
import { Lead } from "../types";
import { config } from "../config";

interface TokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  description?: string;
  links?: { type?: string; label?: string; url: string }[];
}

interface PairData {
  chainId: string;
  baseToken: { name: string; symbol: string; address: string };
  liquidity?: { usd: number };
  volume?: { h24: number };
  url: string;
  info?: {
    websites?: { url: string }[];
    socials?: { type: string; url: string }[];
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Step 1: get tokens founders/teams recently bothered to fill out a profile
 * for on DexScreener — this is a decent free proxy for "someone is actively
 * building this," since spam tokens usually skip it.
 */
async function fetchLatestProfiles(): Promise<TokenProfile[]> {
  const { data } = await axios.get("https://api.dexscreener.com/token-profiles/latest/v1");
  if (!Array.isArray(data)) return [];
  return data.filter((p: TokenProfile) => config.filters.chains.includes(p.chainId?.toLowerCase()));
}

/**
 * Step 2: enrich each profiled token with live liquidity/volume so we can
 * apply the heuristic filter before this ever touches the AI.
 */
async function fetchPairData(chainId: string, tokenAddress: string): Promise<PairData | null> {
  try {
    const { data } = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
    );
    const pairs: PairData[] = data?.pairs || [];
    if (!pairs.length) return null;
    // pick the pair with the highest liquidity if there are several
    return pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
  } catch {
    return null;
  }
}

export async function fetchDexScreenerLeads(): Promise<Lead[]> {
  const profiles = await fetchLatestProfiles();
  const leads: Lead[] = [];

  for (const profile of profiles) {
    const pair = await fetchPairData(profile.chainId, profile.tokenAddress);
    await sleep(300); // be polite to the free API, no key = no generous rate limit guarantee

    if (!pair) continue;
    if ((pair.liquidity?.usd || 0) < config.filters.minLiquidityUsd) continue;

    const website = profile.links?.find((l) => l.type === "website" || l.label === "Website")?.url
      || pair.info?.websites?.[0]?.url;

    const socials = [
      ...(profile.links?.map((l) => l.url) || []),
      ...(pair.info?.socials?.map((s) => s.url) || []),
    ].filter(Boolean);

    leads.push({
      id: `dex-${profile.tokenAddress}`,
      source: "dexscreener",
      name: pair.baseToken?.name || pair.baseToken?.symbol || "Unknown project",
      chain: profile.chainId,
      website,
      socialLinks: [...new Set(socials)],
      liquidityUsd: pair.liquidity?.usd,
      volume24hUsd: pair.volume?.h24,
      rawText: profile.description || "",
    });
  }

  return leads;
}
