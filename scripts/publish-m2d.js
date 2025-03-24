/** It is assumed that this is called only from the default branch. */
const { execSync } = require("child_process");
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

  ["dependencies", "devDependencies", "peerDependencies"].forEach(deps => {
    Object.keys(pkgJson[deps] || {}).forEach(dep => {
      if (pkgJson[deps][dep] === "workspace:*") pkgJson[deps][dep] = "latest";
    });
  });

  execSync("pnpm update --latest -r");

  try {
    execSync("npm publish --access public --provenance", { cwd: pkgDir });
    // Publish
    try {
      ["md2docx", "mdast2docx"].forEach(org => {
        try {
          pkgJson.name = `@${org}/${pkg}`;
          console.log("publishing -- ", pkgJson.name);
          fs.writeFileSync(path.join(pkgDir, "package.json"), JSON.stringify(pkgJson, null, 2));

          execSync("npm publish --access public --provenance", { cwd: pkgDir });
        } catch (err) {
          console.error(`Error publishing @${org}/${pkg}:`, err);
        }
      });
    } catch {
      // empty
    }
  } catch (err) {
    console.error(`Error publishing ${pkg}:`, err);
  }
});
