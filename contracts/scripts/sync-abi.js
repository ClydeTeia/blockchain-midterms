const fs = require("node:fs");
const path = require("node:path");

const source = path.resolve(__dirname, "../artifacts/contracts/TipPost.sol/TipPost.json");
const targetDir = path.resolve(__dirname, "../../frontend/src/abi");
const target = path.join(targetDir, "TipPost.json");

if (!fs.existsSync(source)) {
  console.error("TipPost artifact not found. Run `npm run build` first in /contracts.");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(source, "utf8"));
fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(target, JSON.stringify(artifact.abi, null, 2));

console.log(`ABI synced to ${target}`);
