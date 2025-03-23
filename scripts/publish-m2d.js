/** It is assumed that this is called only from the default branch. */
const { execSync, execFileSync } = require("child_process");
const fs = require("fs");

const BRANCH = process.env.BRANCH;

// Apply changesets if any -- e.g., coming from pre-release branches
try {
  execSync("pnpm changeset pre exit");
} catch {
  // empty
}
try {
  execSync("pnpm changeset version");
  execSync(
    `git add . && git commit -m "Apply changesets and update CHANGELOG [skip ci]" && git push origin ${BRANCH}`,
  );
} catch {
  // no changesets to be applied
}

fs.readdirSync("m2d").forEach(pkg => {
  const pkgDir = `m2d/${pkg}`;
  const pkgJson = JSON.parse(fs.readFileSync(`${pkgDir}/package.json`, "utf8"));
  if (pkgJson.private) return;

  // Publish
  try {
    // First publish
    try {
      execFileSync("npm", ["publish", "--access", "public", "--provenance"], {
        cwd: pkgDir,
        stdio: "inherit", // Optional: inherit output to console
      });
    } catch (err) {
      console.error(`Error publishing ${pkg}:`, err);
    }

    ["md2docx", "mdast2docx"].forEach(org => {
      try {
        pkgJson.name = `@${org}/${pkg}`;
        console.log("publishing -- ", pkgJson.name);
        fs.writeFileSync(path.join(pkgDir, "package.json"), JSON.stringify(pkgJson, null, 2));

        execFileSync("npm", ["publish", "--access", "public", "--provenance"], {
          cwd: pkgDir,
          stdio: "inherit",
        });
      } catch (err) {
        console.error(`Error publishing @${org}/${pkg}:`, err);
      }
    });
  } catch {
    // empty
  }
});
