#!/usr/bin/env node
/**
 * Prepares a release: bumps version in package.json + manifest + versions.json,
 * builds, commits, tags, pushes, and creates a GitHub release.
 *
 * Usage: node release.mjs [version]
 *   e.g. node release.mjs 0.1.2
 *
 * Requires: gh (GitHub CLI), clean git working tree for safety.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

const newVersion = process.argv[2]?.trim();
if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
	console.error("Usage: node release.mjs <version>");
	console.error("Example: node release.mjs 0.1.2");
	process.exit(1);
}

function run(cmd, opts = {}) {
	console.log(`$ ${cmd}`);
	return execSync(cmd, { stdio: "inherit", ...opts });
}

// Check clean tree
const status = execSync("git status --porcelain", { encoding: "utf8" });
if (status.trim()) {
	console.error("Working tree is not clean. Commit or stash changes first.");
	process.exit(1);
}

// 1) Bump version in package.json
const pkgPath = "package.json";
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const oldVersion = pkg.version;
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Bumped package.json: ${oldVersion} -> ${newVersion}`);

// 2) Update manifest.json and versions.json (same logic as version-bump.mjs)
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = newVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[newVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
console.log("Updated manifest.json and versions.json");

// 3) Build
run("npm run build");

// 4) Commit and tag (main.js is in .gitignore, so force-add for release)
const tag = `v${newVersion}`;
run("git add package.json manifest.json versions.json");
run("git add -f main.js");
run(`git commit -m "Release ${tag}"`);
run(`git tag ${tag}`);

// 5) Push branch and tag
run("git push");
run("git push origin --tags");

// 6) GitHub release
try {
	run(`gh release create ${tag} main.js manifest.json styles.css --title "${tag}" --notes "Release ${tag}"`);
	console.log(`\nRelease ${tag} is live.`);
} catch (e) {
	console.error("Creating GitHub release failed. You can run manually:");
	console.error(`  gh release create ${tag} main.js manifest.json styles.css --title "${tag}" --notes "Release ${tag}"`);
	process.exit(1);
}
