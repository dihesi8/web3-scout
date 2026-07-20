import { fetchDexScreenerLeads } from "./sources/dexscreener";
import { fetchFarcasterLeads } from "./sources/farcaster";
import { heuristicFilter } from "./filter";
import { reviewLead } from "./ai/nvidia";
import { sendReviewToTelegram } from "./telegram";
import { SeenStore } from "./store";

async function run() {
  console.log(`[${new Date().toISOString()}] Starting scan...`);

  const store = new SeenStore();

  // 1. Pull raw leads from every source (no AI cost yet).
  const [dexLeads, farcasterLeads] = await Promise.all([
    fetchDexScreenerLeads(),
    fetchFarcasterLeads(),
  ]);
  const allLeads = [...dexLeads, ...farcasterLeads];
  console.log(`Fetched ${allLeads.length} raw leads.`);

  // 2. Drop anything already alerted on in a previous run.
  const freshLeads = allLeads.filter((lead) => !store.has(lead.id));
  console.log(`${freshLeads.length} are new.`);

  // 3. Cheap heuristic filter — this is what keeps your Gemini usage
  //    inside the free tier by cutting noise before AI ever sees it.
  const candidates = heuristicFilter(freshLeads);
  console.log(`${candidates.length} passed the heuristic filter and will be reviewed by AI.`);

  // 4. Only the survivors get an AI review + generated pitch.
  for (const lead of candidates) {
    const review = await reviewLead(lead);
    store.add(lead.id); // mark as seen regardless of outcome, so we don't retry bad ones forever

    if (!review) continue;

    // Skip anything Gemini itself flags as very high risk.
    if (review.riskScore >= 8) {
      console.log(`Skipping "${review.name}" — risk score ${review.riskScore}/10 too high.`);
      continue;
    }

    await sendReviewToTelegram(review);
    console.log(`Sent lead: ${review.name}`);
  }

  // 5. Persist what we've seen so the next run doesn't duplicate alerts.
  store.persist();
  console.log("Scan complete.");
}

run().catch((err) => {
  console.error("Fatal error during scan:", err);
  process.exit(1);
});
