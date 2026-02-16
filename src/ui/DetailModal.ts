import { Modal, App, ButtonComponent } from "obsidian";
import type { DataManager } from "../data/DataManager";
import type { TrackerConfig } from "../data/TrackerConfig";
import type { RatchetEvent } from "../data/DataManager";

export class DetailModal extends Modal {
	constructor(
		app: App,
		private dataManager: DataManager,
		private tracker: TrackerConfig,
		private onEdit: () => void,
		private onDelete: () => void
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("ratchet-detail-modal");
		contentEl.empty();

		contentEl.createEl("h2", { text: `${this.tracker.icon} ${this.tracker.name}` });

		const actions = contentEl.createDiv("ratchet-detail-actions");
		new ButtonComponent(actions).setButtonText("Edit").onClick(() => {
			this.close();
			this.onEdit();
		});
		new ButtonComponent(actions).setButtonText("Delete").onClick(() => {
			this.close();
			this.onDelete();
		});

		contentEl.createEl("h3", { text: "Recent events" });
		const list = contentEl.createDiv("ratchet-detail-events");
		this.renderEvents(list);
	}

	private async renderEvents(container: HTMLElement): Promise<void> {
		const end = new Date();
		const start = new Date(end);
		start.setDate(start.getDate() - 30);
		const events = await this.dataManager.getHistory(
			this.tracker.id,
			start,
			end
		);
		events.reverse();
		if (events.length === 0) {
			container.createSpan({ text: "No events in the last 30 days." });
			return;
		}
		for (const e of events.slice(0, 50)) {
			const row = container.createDiv("ratchet-detail-event-row");
			const d = new Date(e.timestamp);
			row.createSpan({
				text: d.toLocaleString(undefined, {
					dateStyle: "short",
					timeStyle: "short",
				}),
			});
			row.createSpan({ text: ` +${e.value}${this.tracker.unit ? ` ${this.tracker.unit}` : ""}` });
			if (e.note) row.createSpan({ text: ` — ${e.note}`, cls: "ratchet-detail-note" });
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
