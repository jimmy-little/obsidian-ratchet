# Ratchet

Track habits and goals in Obsidian with event-based counters and embedded widgets.

## Features

- **Dashboard** – Create and manage trackers (e.g. meditation, reading, no-alcohol). Each tracker has a goal type (at least / at most / none), reset period (daily, weekly, monthly, yearly), and optional goal value.
- **Embedded widgets** – Use code blocks in notes to show a live counter or a GitHub-style heatmap.

## Installation

1. Build: `npm run build`
2. Copy `main.js` and `manifest.json` into your vault’s `.obsidian/plugins/ratchet/` folder, or use `npm run install:vault` if you have `install.mjs` configured.
3. Enable **Ratchet** in Settings → Community plugins.

## Usage

### Dashboard

- Open via the **Ratchet** ribbon icon or command **“Open Ratchet”**.
- Create trackers, set goals and reset periods, and use the cards to increment counts.
- Settings → Ratchet: set data folder (default `.ratchet`), first day of week (Sunday/Monday), and default increment buttons.

### Code block: `ratchet-counter`

Renders the current count and increment buttons for one tracker.

````markdown
```ratchet-counter
tracker: coffee
buttons: [1, 5]
show-goal: true
```
````

| Option      | Description |
|------------|-------------|
| `tracker`  | Tracker id (required). |
| `buttons`  | Increment values, e.g. `[1, 5, 10]`. Defaults to the tracker’s buttons. |
| `show-goal` | Show goal status (default: true). |

### Code block: `ratchet-summary`

Full-width card: on the left, the tracker card (count, +/− buttons, progress bar, goal); on the right, the heatmap. All card actions (increment, etc.) work and refresh the heatmap.

````markdown
```ratchet-summary
tracker: coffee
days: 90
```
````

Uses the same options as the heatmap (`tracker`, `days`, `period`).

### Code block: `ratchet-heatmap`

GitHub-style heatmap from today going back a set number of days. Uses the tracker’s color for “goal met” days.

````markdown
```ratchet-heatmap
tracker: no-alcohol
days: 365
```
````

| Option   | Description |
|----------|-------------|
| `tracker` | Tracker id (required). |
| `days`  | Number of days to show (e.g. `45`, `90`, `365`). Default: 90. |
| `period` | Shortcut: `45`, `90`, `365`, `year`, `1y` to set the range. |

- **Hover** – Tooltip shows the date (e.g. “Mon, Feb 15, 2026”).
- **Click** – For normal trackers, adds +1 for that day. For “at most 0” trackers (e.g. no alcohol), marks the day as done (count stays 0). The heatmap re-renders after a click.

The grid uses your **first day of week** from settings and 7 rows (one per weekday).

## Data

- Config: `.ratchet/config.json` (tracker definitions).
- Events: `.ratchet/events/YYYY-MM.jsonl` (append-only, one JSON object per line).

## Development

- `npm run dev` – Watch build
- `npm run build` – Production build
- `npm run release -- <version>` – Release: bumps version in package.json, manifest, and versions.json; builds; commits and tags; pushes; creates a GitHub release with `main.js` and `manifest.json`. Example: `npm run release -- 0.1.2`. Requires [GitHub CLI](https://cli.github.com/) (`gh`) and a clean git tree.

## License

MIT
