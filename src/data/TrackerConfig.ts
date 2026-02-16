export type ResetPeriod = "never" | "daily" | "weekly" | "monthly" | "yearly";

export interface TrackerConfig {
	id: string;
	name: string;
	icon: string;
	resetPeriod: ResetPeriod;
	color: string;
	unit: string;
	goal: number; // 0 = no goal
	created: string; // ISO
	incrementButtons: number[]; // e.g. [1, 5, 10]
}

export interface RatchetConfigFile {
	version: string;
	trackers: Record<string, TrackerConfig>;
}

export const DEFAULT_TRACKER_COLOR = "#7c3aed";

export function makeTrackerId(name: string): string {
	return name
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "");
}

export function createTracker(overrides: Partial<TrackerConfig> & { name: string }): TrackerConfig {
	const id = overrides.id ?? makeTrackerId(overrides.name);
	const now = new Date().toISOString();
	return {
		id,
		name: overrides.name,
		icon: overrides.icon ?? "📌",
		resetPeriod: overrides.resetPeriod ?? "daily",
		color: overrides.color ?? DEFAULT_TRACKER_COLOR,
		unit: overrides.unit ?? "",
		goal: overrides.goal ?? 0,
		created: overrides.created ?? now,
		incrementButtons: overrides.incrementButtons?.length ? overrides.incrementButtons : [1, 5],
	};
}
