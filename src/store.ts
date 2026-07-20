import fs from "fs";
import path from "path";

const STORE_PATH = path.join(__dirname, "..", "data", "seen.json");

function load(): Set<string> {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function save(ids: Set<string>) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify([...ids], null, 2));
}

/**
 * Tracks which project IDs we've already alerted on, so re-running the
 * scan (e.g. every hour via cron) doesn't spam duplicate Telegram messages.
 */
export class SeenStore {
  private ids: Set<string>;

  constructor() {
    this.ids = load();
  }

  has(id: string): boolean {
    return this.ids.has(id);
  }

  add(id: string) {
    this.ids.add(id);
  }

  persist() {
    save(this.ids);
  }
}
