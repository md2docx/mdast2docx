const { execSync } = require("child_process");

// Publish canonical packages
["md-to-docx", "mdast-to-docx"].forEach(pkg => {
  execSync(`sed -i -e "s/name.*/name\\": \\"${pkg}\\",/" lib/package.json`);
  execSync("cd lib && npm publish --provenance --access public");
});
