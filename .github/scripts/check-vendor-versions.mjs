// Checks the third-party libraries vendored in js/ and css/ against their upstream
// registry, since Dependabot only tracks npm package.json dependencies and these
// files are manually downloaded (see .github/vendor-versions.json for the source of truth).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, "..", "vendor-versions.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

function isNewer(latest, current) {
  const a = latest.split(".").map(Number);
  const b = current.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
}

async function latestNpmVersion(pkg) {
  const res = await fetch(`https://registry.npmjs.org/${pkg}`);
  if (!res.ok) throw new Error(`npm registry HTTP ${res.status}`);
  const data = await res.json();
  return data["dist-tags"].latest;
}

async function latestGithubTag(repo) {
  const res = await fetch(`https://api.github.com/repos/${repo}/tags`, {
    headers: { "User-Agent": "vendor-version-check", Accept: "application/vnd.github+json" }
  });
  if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);
  const tags = await res.json();
  return tags[0]?.name.replace(/^v/, "") ?? null;
}

const outdated = [];
const unknown = [];
const failed = [];

function latestVersion(library) {
  return library.source === "github" ? latestGithubTag(library.repo) : latestNpmVersion(library.npm);
}

// Every check settles to { library, latest } or { library, error }, so one failed request doesn't abort the others.
const checks = await Promise.all(
  manifest.map(library => latestVersion(library).then(
    latest => ({ library, latest }),
    error => ({ library, error })
  ))
);

for (const { library, latest, error } of checks) {
  if (error) {
    failed.push({ ...library, error: error.message });
  } else if (library.version === null) {
    unknown.push({ ...library, latest });
  } else if (isNewer(latest, library.version)) {
    outdated.push({ ...library, latest });
  }
}

let body = "Automated weekly check of the third-party libraries vendored in `js/` and `css/` " +
  "(not managed by Dependabot since they are not npm dependencies of this project).\n\n";

if (outdated.length) {
  body += "### Updates available\n\n| Library | File | Current | Latest |\n|---|---|---|---|\n";
  for (const r of outdated) body += `| ${r.name} | \`${r.file}\` | ${r.version} | ${r.latest} |\n`;
  body += "\n";
}
if (unknown.length) {
  body += "### Latest version for reference (current version could not be determined from the file)\n\n" +
    "| Library | File | Latest available |\n|---|---|---|\n";
  for (const r of unknown) body += `| ${r.name} | \`${r.file}\` | ${r.latest} |\n`;
  body += "\n";
}
if (failed.length) {
  body += "### Check failed\n\n";
  for (const r of failed) body += `- ${r.name}: ${r.error}\n`;
  body += "\n";
}
body += `_Generated on ${new Date().toISOString().slice(0, 10)}. ` +
  "Update `.github/vendor-versions.json` after upgrading a library so future checks compare against the new version._\n";

writeFileSync(path.join(process.cwd(), "vendor-report.md"), body);

const hasUpdates = outdated.length > 0;
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(process.env.GITHUB_OUTPUT, `has_updates=${hasUpdates}\n`, { flag: "a" });
}

console.log(body);
