import { Lead } from "./types";

/**
 * Cheap, non-AI filtering. The goal is to turn hundreds of raw leads into a
 * handful worth spending Gemini tokens on. Nothing here costs money.
 */
export function heuristicFilter(leads: Lead[]): Lead[] {
  return leads.filter((lead) => {
    // Drop anything with no way to reach out or learn more.
    if (!lead.website && lead.socialLinks.length === 0) return false;

    // Drop anything with basically no descriptive text — usually a sign
    // the project is a low-effort clone or pure meme with nothing to pitch.
    if (!lead.rawText || lead.rawText.trim().length < 15) return false;

    return true;
  });
}
