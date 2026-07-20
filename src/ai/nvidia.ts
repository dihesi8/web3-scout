import axios from "axios";
import { config } from "../config";
import { Lead } from "../types";

export interface ProjectReview {
  name: string;
  links: string[];
  summary: string;
  coreTechHypothesis: string;
  technicalPainPoints: string;
  riskScore: number; // 1-10
  pitch: string;
}

const SYSTEM_PROMPT = `You are a Web3 Technical Recruiter and Venture Analyst helping a
full-stack developer (skilled in Web2, Web3, Solana, EVM, and AI automation) find
early-stage projects worth reaching out to for dev work.

Given raw scraped data about a project, respond with ONLY a JSON object (no markdown
fences, no commentary, no text before or after) matching exactly this shape:

{
  "summary": "2-3 sentence plain-English description of what the project actually is",
  "coreTechHypothesis": "what they're likely building technically (EVM dApp, Solana program, AI agent wrapper, etc.)",
  "technicalPainPoints": "what they're probably struggling with right now, based on their stage",
  "riskScore": <integer 1-10, 10 = highest risk of being a rugpull/dead project>,
  "pitch": "a short, specific, proof-driven cold outreach message (3-5 sentences max) the developer can send directly. No generic flattery. Reference something concrete from the project data. End with a low-friction call to action."
}`;

/**
 * NVIDIA's build.nvidia.com (NIM) API is OpenAI-compatible, so this is a
 * plain chat completions call — no special SDK needed.
 */
export async function reviewLead(lead: Lead): Promise<ProjectReview | null> {
  const userPrompt = `Project name: ${lead.name}
Chain: ${lead.chain || "unknown"}
Website: ${lead.website || "none"}
Liquidity USD: ${lead.liquidityUsd ?? "n/a"}
24h Volume USD: ${lead.volume24hUsd ?? "n/a"}
Social/context links: ${lead.socialLinks.join(", ") || "none"}

Raw text/bio/description:
"""
${lead.rawText}
"""`;

  try {
    const { data } = await axios.post(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        model: config.nvidia.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 600,
      },
      {
        headers: {
          Authorization: `Bearer ${config.nvidia.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text: string = data?.choices?.[0]?.message?.content?.trim() || "";
    const cleaned = text.replace(/^```json\s*|```$/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      name: lead.name,
      links: [lead.website, ...lead.socialLinks].filter(Boolean) as string[],
      summary: parsed.summary,
      coreTechHypothesis: parsed.coreTechHypothesis,
      technicalPainPoints: parsed.technicalPainPoints,
      riskScore: parsed.riskScore,
      pitch: parsed.pitch,
    };
  } catch (err: any) {
    const detail = err?.response?.data || err.message;
    console.error(`NVIDIA API review failed for lead ${lead.id}:`, detail);
    return null;
  }
}
