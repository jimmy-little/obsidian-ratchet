import { Modal, App, ButtonComponent } from "obsidian";
import type RatchetPlugin from "../../main";
import type { TrackerConfig } from "../data/TrackerConfig";
import { renderTrackerCard } from "./TrackerCard";
import { CreateTrackerModal } from "./CreateTrackerModal";
import { DetailModal } from "./DetailModal";

export class DashboardModal extends Modal {
	constructor(app: App, private plugin: RatchetPlugin) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("ratchet-modal");
		contentEl.empty();

		const header = contentEl.createDiv("ratchet-modal-header");
		header.createEl("h2", { text: "Ratchet Dashboard" });

		const newBtn = new ButtonComponent(header).setButtonText("+ New").onClick(() => {
			new CreateTrackerModal(this.app, this.plugin.settings, async (config) => {
				await this.plugin.getDataManager().createTracker(config);
				this.refresh();
			}).open();
		});

		const cardsContainer = contentEl.createDiv("ratchet-modal-content");
		this.renderCards(cardsContainer);
	}

	private async renderCards(container: HTMLElement): Promise<void> {
		container.empty();
		const dm = this.plugin.getDataManager();
		const trackers = await dm.getAllTrackers();
		if (trackers.length === 0) {
			container.createEl("p", {
				text: "No trackers yet. Click \"+ New\" to create one.",
				cls: "ratchet-empty",
			});
			return;
		}
		const grid = container.createDiv("ratchet-cards-grid");
		for (const tracker of trackers) {
			const cardWrap = grid.createDiv("ratchet-card-wrap");
			renderTrackerCard(cardWrap, {
				tracker,
				dataManager: dm,
				onIncrement: () => this.refresh(),
				onOpenDetail: (t) => this.openDetail(t),
			});
		}
	}

	private openDetail(tracker: TrackerConfig): void {
		const dm = this.plugin.getDataManager();
		new DetailModal(this.app, dm, tracker, () => {
			// Edit: for MVP just close; can add EditTrackerModal later
			this.refresh();
		}, async () => {
			await dm.deleteTracker(tracker.id);
			this.refresh();
		}).open();
	}

	private refresh(): void {
		const content = this.contentEl.querySelector(".ratchet-modal-content");
		if (content instanceof HTMLElement) this.renderCards(content);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
