import { copyFile, mkdir } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname);

const VAULT_PATH = "/Users/jimmy/Library/Mobile Documents/iCloud~md~obsidian/Documents/JimmyOS";
const PLUGIN_DIR = join(VAULT_PATH, ".obsidian", "plugins", "ratchet");

const FILES = ["main.js", "manifest.json", "styles.css", "versions.json"];

async function install() {
	try {
		await mkdir(PLUGIN_DIR, { recursive: true });
		for (const file of FILES) {
			const src = join(ROOT, file);
			const dest = join(PLUGIN_DIR, file);
			await copyFile(src, dest);
			console.log(`✓ ${file}`);
		}
		console.log(`\nInstalled to: ${PLUGIN_DIR}`);
	} catch (err) {
		console.error("Install failed:", err);
		process.exit(1);
	}
}

install();
