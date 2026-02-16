import type { App } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
import type RatchetPlugin from "../../main";
import type { RatchetSettings } from "./Settings";

export class RatchetSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: RatchetPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Ratchet" });
		containerEl.createEl("p", {
			text: "Open the dashboard from the ribbon (gear icon) or command palette: \"Ratchet: Open Dashboard\". Create trackers there, then use the settings below to change where data is stored and default behavior.",
			cls: "ratchet-settings-desc",
		});

		new Setting(containerEl)
			.setName("Data folder")
			.setDesc("Folder in your vault for tracker config and event logs. Default: .ratchet (hidden folder at vault root)")
			.addText((text) =>
				text
					.setPlaceholder(".ratchet")
					.setValue(this.plugin.settings.dataFolder)
					.onChange(async (value) => {
						this.plugin.settings.dataFolder = value.trim() || ".ratchet";
						await this.plugin.saveSettings();
						this.plugin.refreshDataManager();
					})
			);

		new Setting(containerEl)
			.setName("First day of week")
			.setDesc("Used for trackers with \"Weekly\" reset (e.g. week starts Monday)")
			.addDropdown((d) =>
				d
					.addOption("0", "Sunday")
					.addOption("1", "Monday")
					.setValue(String(this.plugin.settings.firstDayOfWeek))
					.onChange(async (value) => {
						this.plugin.settings.firstDayOfWeek = value === "1" ? 1 : 0;
						await this.plugin.saveSettings();
						this.plugin.refreshDataManager();
					})
			);

		new Setting(containerEl)
			.setName("Default increment buttons")
			.setDesc("Comma-separated values for new trackers (e.g. 1, 5, 10). Default is 1. Each tracker can override in Edit.")
			.addText((text) =>
				text
					.setPlaceholder("1")
					.setValue(this.plugin.settings.defaultIncrementButtons.join(", "))
					.onChange(async (value) => {
						const parsed = value
							.split(",")
							.map((s) => parseInt(s.trim(), 10))
							.filter((n) => !isNaN(n) && n > 0);
						this.plugin.settings.defaultIncrementButtons =
							parsed.length > 0 ? parsed : [1];
						await this.plugin.saveSettings();
					})
			);
	}
}
