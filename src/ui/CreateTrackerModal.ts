import { Modal, App, TextComponent, ButtonComponent } from "obsidian";
import type { TrackerConfig } from "../data/TrackerConfig";
import { createTracker, makeTrackerId } from "../data/TrackerConfig";
import type { RatchetSettings } from "../settings/Settings";

const RESET_OPTIONS: { value: TrackerConfig["resetPeriod"]; label: string }[] = [
	{ value: "never", label: "Never" },
	{ value: "daily", label: "Daily" },
	{ value: "weekly", label: "Weekly" },
	{ value: "monthly", label: "Monthly" },
	{ value: "yearly", label: "Yearly" },
];

export class CreateTrackerModal extends Modal {
	constructor(
		app: App,
		private defaults: RatchetSettings,
		private onSubmit: (config: TrackerConfig) => void
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "New tracker" });

		let name = "";
		let icon = "📌";
		let resetPeriod: TrackerConfig["resetPeriod"] = "daily";
		let unit = "";
		let goal = 0;
		const incrementButtons = [...this.defaults.defaultIncrementButtons];

		const nameSetting = contentEl.createDiv("setting-item");
		nameSetting.createEl("label", { text: "Name" }).setAttribute("for", "ratchet-name");
		const nameInput = new TextComponent(nameSetting)
			.setPlaceholder("e.g. Coffee")
			.onChange((v) => (name = v));
		nameInput.inputEl.id = "ratchet-name";

		const iconSetting = contentEl.createDiv("setting-item");
		iconSetting.createEl("label", { text: "Icon (emoji)" }).setAttribute("for", "ratchet-icon");
		new TextComponent(iconSetting)
			.setPlaceholder("📌")
			.setValue(icon)
			.onChange((v) => (icon = v || "📌"))
			.inputEl.setAttribute("id", "ratchet-icon");

		const periodSetting = contentEl.createDiv("setting-item");
		periodSetting.createEl("label", { text: "Reset period" });
		const periodSelect = periodSetting.createEl("select");
		for (const opt of RESET_OPTIONS) {
			const o = periodSelect.createEl("option", { value: opt.value, text: opt.label });
			if (opt.value === "daily") o.setAttribute("selected", "selected");
		}
		periodSelect.addEventListener("change", () => (resetPeriod = periodSelect.value as TrackerConfig["resetPeriod"]));

		const unitSetting = contentEl.createDiv("setting-item");
		unitSetting.createEl("label", { text: "Unit (optional)" }).setAttribute("for", "ratchet-unit");
		new TextComponent(unitSetting).setPlaceholder("e.g. cups, minutes").onChange((v) => (unit = v)).inputEl.id = "ratchet-unit";

		const goalSetting = contentEl.createDiv("setting-item");
		goalSetting.createEl("label", { text: "Goal (optional, 0 = none)" }).setAttribute("for", "ratchet-goal");
		new TextComponent(goalSetting)
			.setPlaceholder("0")
			.onChange((v) => (goal = Math.max(0, parseInt(v, 10) || 0)))
			.inputEl.id = "ratchet-goal";

		const buttons = contentEl.createDiv("ratchet-modal-buttons");
		new ButtonComponent(buttons).setButtonText("Cancel").onClick(() => this.close());
		new ButtonComponent(buttons)
			.setButtonText("Create")
			.onClick(() => {
				if (!name.trim()) return;
				const id = makeTrackerId(name.trim());
				const config = createTracker({
					id,
					name: name.trim(),
					icon: icon || "📌",
					resetPeriod,
					unit: unit.trim(),
					goal,
					incrementButtons,
				});
				this.close();
				this.onSubmit(config);
			});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
