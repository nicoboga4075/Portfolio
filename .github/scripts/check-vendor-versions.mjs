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

// A release version (1.2.3), not a pre-release (1.2.3-beta.1) nor a tag that isn't a version.
const isRelease = version => /^\d+(\.\d+)*$/.test(version);
const majorOf = version => Number(version.split(".")[0]);
const newest = versions => versions.filter(isRelease).reduce((best, v) => (best === null || isNewer(v, best) ? v : best), null);

// The latest release, and every published version so the latest one of the current major can be picked too.
async function npmVersions(pkg) {
  const res = await fetch(`https://registry.npmjs.org/${pkg}`);
  if (!res.ok) throw new Error(`npm registry HTTP ${res.status}`);
  const data = await res.json();
  return { latest: data["dist-tags"].latest, versions: Object.keys(data.versions) };
}

async function githubVersions(repo) {
  const res = await fetch(`https://api.github.com/repos/${repo}/tags?per_page=100`, {
    headers: { "User-Agent": "vendor-version-check", Accept: "application/vnd.github+json" }
  });
  if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);
  const versions = (await res.json()).map(tag => tag.name.replace(/^v/, ""));
  return { latest: versions[0] ?? null, versions };
}

const outdated = [];
const unknown = [];
const failed = [];

function publishedVersions(library) {
  return library.source === "github" ? githubVersions(library.repo) : npmVersions(library.npm);
}

// Every check settles to { library, latest, versions } or { library, error }, so one failed request doesn't abort the others.
const checks = await Promise.all(
  manifest.map(library => publishedVersions(library).then(
    ({ latest, versions }) => ({ library, latest, versions }),
    error => ({ library, error })
  ))
);

for (const { library, latest, versions, error } of checks) {
  if (error) {
    failed.push({ ...library, error: error.message });
  } else if (library.version === null) {
    unknown.push({ ...library, latest });
  } else {
    // A minor or patch release of the current major can be taken even when the next major is held back on purpose.
    const inMajor = newest(versions.filter(v => majorOf(v) === majorOf(library.version)));
    const minorUpdate = inMajor !== null && isNewer(inMajor, library.version) ? inMajor : null;
    if (minorUpdate || isNewer(latest, library.version)) outdated.push({ ...library, latest, inMajor: minorUpdate });
  }
}

let body = "Automated weekly check of the third-party libraries vendored in `js/` and `css/` " +
  "(not managed by Dependabot since they are not npm dependencies of this project).\n\n";

if (outdated.length) {
  body += "### Updates available\n\n" +
    "_Latest in current major_ is a minor or patch release that keeps the same API; _Latest_ may be a new major, held back on purpose for some libraries (see SECURITY.md).\n\n" +
    "| Library | File | Current | Latest in current major | Latest |\n|---|---|---|---|---|\n";
  for (const r of outdated) body += `| ${r.name} | \`${r.file}\` | ${r.version} | ${r.inMajor ?? "-"} | ${r.latest} |\n`;
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
