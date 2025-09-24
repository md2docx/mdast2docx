import { execSync } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { exit } from "node:process";

// === Semver Utils ===
function parseVersion(v) {
  return v
    .replace(/^[^\d]*/, "")
    .split(".")
    .map(Number);
}

function compareVersions(a, b) {
  const [ma, mi, pa] = parseVersion(a);
  const [mb, mi2, pa2] = parseVersion(b);
  if (ma !== mb) return ma - mb;
  if (mi !== mi2) return mi - mi2;
  return pa - pa2;
}

function getSemverDiff(from, to) {
  const [fMaj, fMin, fPatch] = parseVersion(from);
  const [tMaj, tMin, tPatch] = parseVersion(to);
  if (tMaj > fMaj) return "major";
  if (tMin > fMin) return "minor";
  if (tPatch > fPatch) return "patch";
  return null;
}

function getHighestBumpType(bumps) {
  if (bumps.includes("major")) return "major";
  if (bumps.includes("minor")) return "minor";
  return "patch";
}

// === Fetch Helpers ===
function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

// === Changelog Parsing & Formatting ===
async function fetchChangelog(pkgName, fromVer, toVer) {
  const shortName = pkgName.replace("@m2d/", "");
  const url = `https://raw.githubusercontent.com/md2docx/${shortName}/main/lib/CHANGELOG.md`;

  try {
    const content = await fetchText(url);
    const lines = content.split("\n");

    const grouped = {
      "Minor Changes": [],
      "Major Changes": [],
      "Patch Changes": [],
    };
    let currentType = "";
    let collecting = false;

    for (const line of lines) {
      const versionHeader = line.match(/^##\s*\[?v?(\d+\.\d+\.\d+)/i);
      const typeHeader = line.match(/^###\s+(Major|Minor|Patch) Changes/i);

      if (versionHeader) {
        const version = versionHeader[1];
        if (compareVersions(version, fromVer) <= 0) break;
        if (
          compareVersions(version, fromVer) < 0 ||
          compareVersions(version, toVer) > 0
        ) {
          collecting = false;
          continue;
        }
        collecting = true;
        currentType = "";
        continue;
      }

      if (collecting && typeHeader) {
        currentType = `${typeHeader[1]} Changes`;
        continue;
      }

      if (collecting && currentType && line.trim().startsWith("-")) {
        const cleaned = line.replace(/^-\s+[a-f0-9]{7,}:\s*/i, "- ").trim();
        grouped[currentType].push(cleaned);
      }
    }

    return grouped;
  } catch (err) {
    console.warn(`⚠️ Failed to fetch changelog for ${pkgName}: ${err.message}`);
    return null;
  }
}

// === Changeset Generator ===
function createChangeset(depChanges) {
  const bumps = depChanges.map(
    (change) => getSemverDiff(change.from, change.to) || "patch",
  );
  const bumpType = getHighestBumpType(bumps);

  const dir = ".changeset";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const filename = path.join(dir, `mdast2docx-update-${Date.now()}.md`);
  const lines = [
    "---",
    `"mdast2docx": ${bumpType}`,
    "---",
    "",
    "The following @m2d/* dependencies were upgraded:",
    "",
  ];

  for (const change of depChanges) {
    lines.push(`### ${change.name}: ${change.from} → ${change.to}`);

    if (change.changelog) {
      for (const [type, entries] of Object.entries(change.changelog)) {
        if (entries.length > 0) {
          lines.push(`\n**${type}**`);
          for (const entry of entries) {
            lines.push(entry);
          }
        }
      }
    } else {
      lines.push("_No changelog available._");
    }

    lines.push("");
  }

  fs.writeFileSync(filename, lines.join("\n"));
  console.log(`✅ Created changeset: ${filename}`);
}

// === Main Script ===
async function run() {
  const localPkg = JSON.parse(
    fs.readFileSync("lib/package.json", { encoding: "utf8" }),
  );
  const currentDepsRaw = execSync("npm view mdast2docx dependencies --json", {
    encoding: "utf-8",
  });
  const currentDeps = JSON.parse(currentDepsRaw);

  const latestDeps = localPkg.dependencies || {};
  const updates = [];

  const m2dPkgs = Object.keys(currentDeps).filter((name) =>
    name.startsWith("@m2d/"),
  );

  for (const pkgName of m2dPkgs) {
    const currentVer = currentDeps[pkgName]?.replace(/^[^\d]*/, "");
    const latestVer = latestDeps[pkgName]?.replace(/^[^\d]*/, "");
    if (!currentVer || !latestVer) continue;

    if (compareVersions(currentVer, latestVer) < 0) {
      console.log(`⬆️ ${pkgName}: ${currentVer} → ${latestVer}`);
      const changelog = await fetchChangelog(pkgName, currentVer, latestVer);
      updates.push({
        name: pkgName,
        from: currentVer,
        to: latestVer,
        changelog,
      });
    }
  }

  if (updates.length === 0) {
    console.log("✅ No @m2d/* dependencies need updates.");
    return;
  }

  createChangeset(updates);
}

run()
  .catch((err) => {
    console.error("❌ Script failed:", err);
  })
  .finally(() => exit());
