import { ButtonComponent } from "obsidian";
import type { DataManager } from "../data/DataManager";
import type { TrackerConfig } from "../data/TrackerConfig";

export interface TrackerCardOptions {
	tracker: TrackerConfig;
	dataManager: DataManager;
	onIncrement: () => void;
	onOpenDetail: (tracker: TrackerConfig) => void;
}

export function renderTrackerCard(container: HTMLElement, opts: TrackerCardOptions): void {
	const { tracker, dataManager, onIncrement, onOpenDetail } = opts;
	const card = container.createDiv("ratchet-card");
	card.style.setProperty("--ratchet-card-color", tracker.color || "var(--interactive-accent)");

	const header = card.createDiv("ratchet-card-header");
	header.createSpan({ text: tracker.icon, cls: "ratchet-card-icon" });
	header.createSpan({ text: tracker.name, cls: "ratchet-card-name" });

	const disclosure = header.createSpan("ratchet-card-disclosure");
	disclosure.setText("▸");
	disclosure.setAttribute("aria-label", "View details");
	disclosure.addEventListener("click", (e) => {
		e.stopPropagation();
		onOpenDetail(tracker);
	});

	const countEl = card.createDiv("ratchet-card-count");
	const buttonsWrap = card.createDiv("ratchet-card-buttons");
	const progressWrap = card.createDiv("ratchet-progress-wrap");

	async function refreshCount(): Promise<void> {
		const count = await dataManager.getCurrentCount(tracker.id);
		countEl.empty();
		const valueSpan = countEl.createSpan("ratchet-card-value");
		valueSpan.setText(String(count));
		if (tracker.unit) {
			countEl.createSpan("ratchet-card-unit").setText(` ${tracker.unit}`);
		}
		if (tracker.goal > 0) {
			progressWrap.empty();
			const bar = progressWrap.createDiv("ratchet-progress-bar");
			const fill = bar.createDiv("ratchet-progress-fill");
			const pct = Math.min(100, (count / tracker.goal) * 100);
			fill.style.width = `${pct}%`;
			const label = progressWrap.createSpan("ratchet-progress-label");
			label.setText(`Goal: ${count}/${tracker.goal}${tracker.goal <= count ? " ✓" : ""}`);
		} else {
			progressWrap.empty();
		}
	}

	buttonsWrap.empty();
	for (const v of tracker.incrementButtons) {
		const btn = new ButtonComponent(buttonsWrap)
			.setButtonText(`+${v}`)
			.setClass("ratchet-increment-btn")
			.onClick(async () => {
				await dataManager.increment(tracker.id, v);
				await refreshCount();
				onIncrement();
			});
	}

	refreshCount();
}
