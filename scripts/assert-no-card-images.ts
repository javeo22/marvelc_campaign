import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp", ".tiff"]);
const imageSignatures: Array<[string, Buffer]> = [
  ["png", Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  ["jpg", Buffer.from([0xff, 0xd8, 0xff])],
  ["gif", Buffer.from("GIF8", "ascii")],
  ["webp", Buffer.from("RIFF", "ascii")]
];
const ignoredParts = new Set(["node_modules", ".git", "source-materials", "playwright-report", "test-results"]);
const findings: string[] = [];

function isIgnored(relativePath: string): boolean {
  return relativePath.split(path.sep).some((part) => ignoredParts.has(part));
}

function walk(directory: string) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(root, fullPath);
    if (isIgnored(relativePath)) continue;
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (imageExtensions.has(extension)) {
      findings.push(`Image extension is not allowed outside source materials: ${relativePath}`);
      continue;
    }

    const sample = fs.readFileSync(fullPath).subarray(0, 12);
    const signature = imageSignatures.find(([, bytes]) => sample.subarray(0, bytes.length).equals(bytes));
    if (signature) {
      findings.push(`Image binary signature (${signature[0]}) is not allowed: ${relativePath}`);
    }
  }
}

walk(root);

const apiDir = path.join(root, "src", "app", "api");
if (fs.existsSync(apiDir)) {
  const routeFiles: string[] = [];
  const collect = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) collect(fullPath);
      if (entry.isFile() && entry.name === "route.ts") routeFiles.push(fullPath);
    }
  };
  collect(apiDir);
  for (const route of routeFiles) {
    const text = fs.readFileSync(route, "utf8").toLowerCase();
    const relativePath = path.relative(root, route);
    if (relativePath.includes("image") || text.includes("image-proxy") || text.includes("arraybuffer")) {
      findings.push(`Potential image proxy route detected: ${relativePath}`);
    }
  }
}

if (findings.length > 0) {
  console.error(`FAIL - ${findings.length} image rights finding(s)`);
  for (const finding of findings) {
    console.error(`  ERROR: ${finding}`);
  }
  process.exit(1);
}

console.log("PASS - no bundled card-image binaries or image proxy routes found");
