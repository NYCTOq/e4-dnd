import fs from "node:fs";
import path from "node:path";

const targetPath = path.join(
  process.cwd(),
  "PUBLISH_GITHUB_RELEASE_M_MEGA1.ps1",
);

if (!fs.existsSync(targetPath)) {
  throw new Error(`Target script not found: ${targetPath}`);
}

let source = fs.readFileSync(targetPath, "utf8");

const oldBlock = `$releaseExists = $false
gh release view $Tag --repo $Repository *> $null
if ($LASTEXITCODE -eq 0) {
  $releaseExists = $true
}`;

const newBlock = `$releaseExists = $false
$previousErrorActionPreference = $ErrorActionPreference

try {
  $ErrorActionPreference = "Continue"
  gh release view $Tag --repo $Repository *> $null

  if ($LASTEXITCODE -eq 0) {
    $releaseExists = $true
  }
}
finally {
  $ErrorActionPreference = $previousErrorActionPreference
}`;

if (!source.includes(oldBlock) && !source.includes(newBlock)) {
  throw new Error("GitHub Release existence check block not found.");
}

source = source.replace(oldBlock, newBlock);

fs.writeFileSync(targetPath, source, "utf8");

console.log(JSON.stringify({
  target: path.relative(process.cwd(), targetPath),
  nonFatalMissingReleaseCheck: source.includes("$previousErrorActionPreference"),
  createWhenMissing: source.includes("gh release create"),
  updateWhenExisting: source.includes("gh release upload"),
}, null, 2));
