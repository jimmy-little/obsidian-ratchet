import { Plugin } from "obsidian";
import { DataManager } from "./src/data/DataManager";
import { DEFAULT_SETTINGS, type RatchetSettings } from "./src/settings/Settings";
import { RatchetSettingTab } from "./src/settings/SettingsTab";
import { RatchetMainView, VIEW_TYPE_RATCHET_MAIN } from "./src/ui/RatchetMainView";
import {
	registerRatchetCounter,
	renderRatchetCounter,
	registerRatchetHeatmap,
	renderRatchetHeatmap,
	registerRatchetSummary,
	renderRatchetSummary,
} from "./src/processors/CodeBlockProcessor";
import { RATCHET_STYLES } from "./src/styles";

export default class RatchetPlugin extends Plugin {
	settings: RatchetSettings;
	private dataManager: DataManager | null = null;

	/** Which tracker is selected for editing in the main view: null, "new", or tracker id. */
	ratchetViewState: { selectedId: string | null } = { selectedId: null };

	async onload(): Promise<void> {
		const styleEl = document.createElement("style");
		styleEl.textContent = RATCHET_STYLES;
		styleEl.setAttribute("data-ratchet-styles", "true");
		document.head.appendChild(styleEl);
		this.register(() => styleEl.remove());

		await this.loadSettings();
		this.refreshDataManager();

		this.registerView(
			VIEW_TYPE_RATCHET_MAIN,
			(leaf) => new RatchetMainView(leaf, this)
		);

		this.addRibbonIcon("tally-5", "Ratchet", () => {
			this.activateRatchetView();
		});

		this.addCommand({
			id: "open-dashboard",
			name: "Open Ratchet",
			callback: () => this.activateRatchetView(),
		});

		this.addCommand({
			id: "create-tracker",
			name: "Create new tracker",
			callback: () => {
				this.ratchetViewState.selectedId = "new";
				this.activateRatchetView();
			},
		});

		this.addSettingTab(new RatchetSettingTab(this.app, this));

		registerRatchetCounter(this, (source, el) => {
			renderRatchetCounter(source, el, this).catch(() => {});
		});
		registerRatchetHeatmap(this, (source, el) => {
			renderRatchetHeatmap(source, el, this).catch(() => {});
		});
		registerRatchetSummary(this, (source, el) => {
			renderRatchetSummary(source, el, this).catch(() => {});
		});
	}

	onunload(): void {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_RATCHET_MAIN);
	}

	activateRatchetView(): void {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_RATCHET_MAIN)[0];
		if (!leaf) {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				leaf.setViewState({ type: VIEW_TYPE_RATCHET_MAIN, active: true });
			}
		}
		if (leaf) workspace.revealLeaf(leaf);
	}

	getDataManager(): DataManager {
		if (!this.dataManager) {
			this.refreshDataManager();
		}
		return this.dataManager!;
	}

	refreshDataManager(): void {
		this.dataManager = new DataManager(
			this.app.vault,
			this.settings.dataFolder,
			this.settings.firstDayOfWeek
		);
	}

	async loadSettings(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
