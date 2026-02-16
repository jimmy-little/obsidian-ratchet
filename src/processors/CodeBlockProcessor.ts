import type { MarkdownPostProcessorContext } from "obsidian";
import type RatchetPlugin from "../../main";

const DEFAULT_BUTTONS = [1, 5];

function parseYamlLike(source: string): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const line of source.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const colon = trimmed.indexOf(":");
		if (colon === -1) continue;
		const key = trimmed.slice(0, colon).trim();
		let value: unknown = trimmed.slice(colon + 1).trim();
		if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
			try {
				value = JSON.parse(value.replace(/'/g, '"')) as number[];
			} catch {
				// leave as string
			}
		}
		out[key] = value;
	}
	return out;
}

export function registerRatchetCounter(
	plugin: RatchetPlugin,
	processor: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => void
): void {
	plugin.registerMarkdownCodeBlockProcessor("ratchet-counter", processor);
}

export async function renderRatchetCounter(
	source: string,
	el: HTMLElement,
	plugin: RatchetPlugin
): Promise<void> {
	const config = parseYamlLike(source);
	const trackerId = (config.tracker as string) || "";
	if (!trackerId) {
		el.createSpan({ text: "Ratchet: set tracker: <id> in the code block." });
		return;
	}
	const buttons: number[] = Array.isArray(config.buttons)
		? config.buttons
		: DEFAULT_BUTTONS;
	const showGoal = config["show-goal"] !== false && config["show-goal"] !== "false";

	const dm = plugin.getDataManager();
	const tracker = await dm.getTracker(trackerId);
	const count = await dm.getCurrentCount(trackerId);

	const wrap = el.createDiv("ratchet-counter-widget");
	const left = wrap.createDiv("ratchet-counter-left");
	left.createSpan({ text: tracker?.icon ?? "•", cls: "ratchet-counter-icon" });
	const countSpan = left.createSpan("ratchet-counter-value");
	countSpan.setText(String(count));
	if (tracker?.unit) {
		left.createSpan({ text: ` ${tracker.unit}`, cls: "ratchet-counter-unit" });
	}
	if (showGoal && tracker?.goal && tracker.goal > 0) {
		left.createSpan({
			text: ` / ${tracker.goal}`,
			cls: "ratchet-counter-goal",
		});
	}

	const right = wrap.createDiv("ratchet-counter-buttons");
	for (const v of buttons) {
		const btn = right.createEl("button", { text: `+${v}` });
		btn.addClass("ratchet-increment-btn");
		btn.addEventListener("click", async () => {
			await dm.increment(trackerId, v);
			const newCount = await dm.getCurrentCount(trackerId);
			countSpan.setText(String(newCount));
		});
	}
}
