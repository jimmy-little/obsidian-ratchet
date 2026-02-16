import { Plugin } from "obsidian";
import { DataManager } from "./src/data/DataManager";
import { DEFAULT_SETTINGS, type RatchetSettings } from "./src/settings/Settings";
import { RatchetSettingTab } from "./src/settings/SettingsTab";
import { DashboardModal } from "./src/ui/DashboardModal";
import { CreateTrackerModal } from "./src/ui/CreateTrackerModal";
import {
	registerRatchetCounter,
	renderRatchetCounter,
} from "./src/processors/CodeBlockProcessor";

export default class RatchetPlugin extends Plugin {
	settings: RatchetSettings;
	private dataManager: DataManager | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.refreshDataManager();

		this.addRibbonIcon("gear", "Ratchet Dashboard", () => {
			new DashboardModal(this.app, this).open();
		});

		this.addCommand({
			id: "open-dashboard",
			name: "Open Dashboard",
			callback: () => new DashboardModal(this.app, this).open(),
		});

		this.addCommand({
			id: "create-tracker",
			name: "Create new tracker",
			callback: () => {
				new CreateTrackerModal(this.app, this.settings, async (config) => {
					await this.getDataManager().createTracker(config);
					new DashboardModal(this.app, this).open();
				}).open();
			},
		});

		this.addSettingTab(new RatchetSettingTab(this.app, this));

		registerRatchetCounter(this, (source, el) => {
			renderRatchetCounter(source, el, this).catch(() => {});
		});
	}

	onunload(): void {}

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
