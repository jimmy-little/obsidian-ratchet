# Ratchet

Track habits and count activities in Obsidian. Create trackers, increment from the dashboard or from embedded code blocks, and keep data in your vault as append-only event logs.

## Quick start

1. **Install**  
   Copy `main.js`, `styles.css`, `manifest.json`, and `versions.json` into your vault’s `.obsidian/plugins/ratchet/` folder, or use the project’s install script (see [Development](#development)).

2. **Enable**  
   In Obsidian: **Settings → Community plugins → Enable “Ratchet”**.

3. **Open the dashboard**  
   Click the **gear icon** in the left ribbon, or run the command **“Ratchet: Open Dashboard”** from the command palette (`Ctrl/Cmd + P`).

4. **Create a tracker**  
   In the dashboard, click **+ New**. Set name, icon (emoji), reset period, optional unit and goal, then **Create**.

5. **Increment**  
   Use the **+1**, **+5**, etc. buttons on each card. Use the **▸** on a card to open details (recent events, delete).

## Embedded counter

In any note, use a `ratchet-counter` code block to show the current count and increment buttons:

````markdown
```ratchet-counter
tracker: coffee
buttons: [1, 5]
show-goal: true
```
````

- **tracker** (required): tracker id (e.g. `coffee`, from the name you gave when creating).
- **buttons** (optional): list of increment values, e.g. `[1, 5]` or `[5, 10, 15]`. Default uses the plugin’s default increment buttons.
- **show-goal** (optional): set to `false` to hide “current / goal”. Default is to show if the tracker has a goal.

## Settings

Open **Settings → Community plugins**, then click the **gear icon next to “Ratchet”**.

| Setting | Description |
|--------|-------------|
| **Data folder** | Vault-relative path for config and event logs. Default: `.ratchet` (hidden folder at vault root). Change and save to move where data is stored; existing data is not moved. |
| **First day of week** | **Sunday** or **Monday**. Used only for trackers with a “Weekly” reset period. |
| **Default increment buttons** | Comma-separated numbers (e.g. `1, 5` or `1, 5, 10`) used as the default +1, +5, … buttons for new trackers. |

## Data storage

- **Config**: `.ratchet/config.json` — tracker definitions (name, icon, reset period, goal, etc.).
- **Events**: `.ratchet/events/YYYY-MM.jsonl` — one JSONL file per month, append-only. Each line is one event (timestamp, tracker id, value, note).

Safe for sync (e.g. Obsidian Sync, iCloud): append-only events and monthly files reduce conflict risk.

## Development

```bash
npm install
npm run dev          # watch build
npm run build        # production build
npm run install:vault   # copy built files to a vault (path in install.mjs)
npm run build:install   # build then copy to vault
```

Edit `install.mjs` to set your vault path if you use `install:vault` / `build:install`.

## License

MIT
