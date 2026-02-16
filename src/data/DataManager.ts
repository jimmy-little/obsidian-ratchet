import type { Vault } from "obsidian";
import { getMonthKey, isInPeriod, type ResetPeriod } from "../utils/DateUtils";
import { parseEventLine, eventToLine, type RatchetEvent } from "./EventLog";
import type { TrackerConfig, RatchetConfigFile } from "./TrackerConfig";

const CONFIG_FILE = "config.json";
const EVENTS_DIR = "events";
const CONFIG_VERSION = "1.0.0";

export type { RatchetEvent, TrackerConfig };

export class DataManager {
	constructor(
		private vault: Vault,
		private dataFolder: string,
		private firstDayOfWeek: number
	) {}

	private configPath(): string {
		return `${this.dataFolder}/${CONFIG_FILE}`;
	}

	private eventsDir(): string {
		return `${this.dataFolder}/${EVENTS_DIR}`;
	}

	private eventFilePath(monthKey: string): string {
		return `${this.eventsDir()}/${monthKey}.jsonl`;
	}

	async ensureDataFolder(): Promise<void> {
		const dir = this.eventsDir();
		if (!(await this.vault.adapter.exists(dir))) {
			await this.vault.adapter.mkdir(dir);
		}
	}

	private async readConfig(): Promise<RatchetConfigFile> {
		const path = this.configPath();
		try {
			const raw = await this.vault.adapter.read(path);
			const data = JSON.parse(raw) as RatchetConfigFile;
			if (data && data.trackers && typeof data.trackers === "object") {
				return data;
			}
		} catch {
			// no file or invalid
		}
		return { version: CONFIG_VERSION, trackers: {} };
	}

	private async writeConfig(config: RatchetConfigFile): Promise<void> {
		await this.ensureDataFolder();
		await this.vault.adapter.write(this.configPath(), JSON.stringify(config, null, "\t"));
	}

	async getAllTrackers(): Promise<TrackerConfig[]> {
		const config = await this.readConfig();
		return Object.values(config.trackers);
	}

	async getTracker(id: string): Promise<TrackerConfig | null> {
		const config = await this.readConfig();
		return config.trackers[id] ?? null;
	}

	async createTracker(config: TrackerConfig): Promise<void> {
		const data = await this.readConfig();
		data.trackers[config.id] = config;
		await this.writeConfig(data);
	}

	async updateTracker(id: string, updates: Partial<TrackerConfig>): Promise<void> {
		const data = await this.readConfig();
		const existing = data.trackers[id];
		if (!existing) return;
		data.trackers[id] = { ...existing, ...updates };
		await this.writeConfig(data);
	}

	async deleteTracker(id: string): Promise<void> {
		const data = await this.readConfig();
		delete data.trackers[id];
		await this.writeConfig(data);
	}

	/** Month keys to read for current period (e.g. this month + last for weekly). */
	private monthKeysToRead(period: ResetPeriod, now: Date): string[] {
		const keys: string[] = [];
		const current = getMonthKey(now);
		keys.push(current);
		if (period === "weekly" || period === "daily") {
			const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			keys.push(getMonthKey(prev));
		}
		if (period === "yearly") {
			const y = now.getFullYear();
			for (let m = 0; m < 12; m++) keys.push(`${y}-${String(m + 1).padStart(2, "0")}`);
		}
		return [...new Set(keys)];
	}

	private async readEventsForTracker(
		trackerId: string,
		monthKeys: string[]
	): Promise<RatchetEvent[]> {
		const events: RatchetEvent[] = [];
		for (const key of monthKeys) {
			const path = this.eventFilePath(key);
			try {
				const content = await this.vault.adapter.read(path);
				for (const line of content.split("\n")) {
					const e = parseEventLine(line);
					if (e && e.tracker === trackerId) events.push(e);
				}
			} catch {
				// file missing or unreadable
			}
		}
		events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
		return events;
	}

	async getCurrentCount(trackerId: string, trackerPeriod?: ResetPeriod): Promise<number> {
		const tracker = await this.getTracker(trackerId);
		const period = trackerPeriod ?? tracker?.resetPeriod ?? "daily";
		const now = new Date();
		const keys = this.monthKeysToRead(period, now);
		const events = await this.readEventsForTracker(trackerId, keys);
		let sum = 0;
		for (const e of events) {
			if (isInPeriod(e.timestamp, period, now, this.firstDayOfWeek)) {
				sum += e.value;
			}
		}
		return sum;
	}

	async getHistory(
		trackerId: string,
		startDate: Date,
		endDate: Date
	): Promise<RatchetEvent[]> {
		const startKey = getMonthKey(startDate);
		const endKey = getMonthKey(endDate);
		const keys: string[] = [];
		const [sy, sm] = startKey.split("-").map(Number);
		const [ey, em] = endKey.split("-").map(Number);
		for (let y = sy; y <= ey; y++) {
			const mStart = y === sy ? sm : 1;
			const mEnd = y === ey ? em : 12;
			for (let m = mStart; m <= mEnd; m++) {
				keys.push(`${y}-${String(m).padStart(2, "0")}`);
			}
		}
		const events = await this.readEventsForTracker(trackerId, keys);
		const startMs = startDate.getTime();
		const endMs = endDate.getTime();
		return events.filter((e) => {
			const t = new Date(e.timestamp).getTime();
			return t >= startMs && t <= endMs;
		});
	}

	async increment(trackerId: string, value: number, note = ""): Promise<void> {
		await this.ensureDataFolder();
		const now = new Date();
		const monthKey = getMonthKey(now);
		const path = this.eventFilePath(monthKey);
		const event: RatchetEvent = {
			id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `e-${Date.now()}-${Math.random().toString(36).slice(2)}`,
			timestamp: now.toISOString(),
			tracker: trackerId,
			value,
			note,
		};
		const line = eventToLine(event);
		try {
			const existing = await this.vault.adapter.read(path).catch(() => "");
			await this.vault.adapter.write(path, existing + line);
		} catch {
			await this.vault.adapter.write(path, line);
		}
	}
}
