#!/usr/bin/env node
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";
import { validateManifest } from "./index.js";

const MAX_PACKAGE_BYTES = 10 * 1024 * 1024;
const SAFE_ASSETS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

async function validateDirectory(directory: string) {
  const manifestPath = path.join(directory, "manifest.json");
  const manifest = validateManifest(JSON.parse(await readFile(manifestPath, "utf8")));
  const files = await walk(directory);
  if (files.length > 64) throw new Error("A widget package may contain at most 64 files.");
  for (const file of files) {
    const relative = path.relative(directory, file).replaceAll("\\", "/");
    if (relative === "manifest.json" || relative === "README.md" || relative === "LICENSE") continue;
    if (!relative.startsWith("assets/") || !SAFE_ASSETS.has(path.extname(relative).toLowerCase()))
      throw new Error(`Unsafe package file: ${relative}. Only raster assets are allowed.`);
  }
  return { manifest, files };
}

async function pack(directory: string, output?: string) {
  const root = path.resolve(directory);
  const { manifest, files } = await validateDirectory(root);
  const entries: Record<string, Uint8Array> = {};
  for (const file of files)
    entries[path.relative(root, file).replaceAll("\\", "/")] = new Uint8Array(await readFile(file));
  const bytes = zipSync(entries, { level: 9 });
  if (bytes.byteLength > MAX_PACKAGE_BYTES) throw new Error("The packaged widget is larger than 10 MB.");
  const target = path.resolve(output ?? `${manifest.id}-${manifest.version}.sswidget`);
  await writeFile(target, bytes);
  console.log(`Created ${target}`);
}

async function init(directory: string) {
  const root = path.resolve(directory);
  await mkdir(root, { recursive: true });
  const manifest = {
    schemaVersion: 2,
    id: "community.my-widget",
    name: "My widget",
    description: "A small declarative SlideSpace widget.",
    publisher: "Your name",
    version: "0.1.0",
    renderer: "declarative-v2",
    defaultWidth: 300,
    defaultHeight: 140,
    refreshIntervalMilliseconds: 1000,
    permissions: [],
    visible: true,
    previewText: "MW",
    primaryText: "Hello, desktop",
    secondaryText: "My first widget",
    accentColor: "#00D9ED",
    backgroundColor: "#0D1518",
    transparentBackground: false,
    dataSource: "static",
    dataFormat: null,
    layout: {
      type: "stack",
      direction: "vertical",
      children: [
        { type: "text", binding: "primary", fontSize: 24, weight: "bold" },
        { type: "text", binding: "secondary", fontSize: 12, color: "#8EBBC3" }
      ]
    },
    settings: [],
    networkHosts: []
  };
  await writeFile(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2));
  await writeFile(path.join(root, "README.md"), "# My SlideSpace widget\n");
  console.log(`Initialized ${root}`);
}

async function walk(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const name of await readdir(directory)) {
    const value = path.join(directory, name);
    const info = await stat(value);
    if (info.isSymbolicLink()) throw new Error("Symbolic links are not allowed.");
    if (info.isDirectory()) result.push(...await walk(value));
    else result.push(value);
  }
  return result;
}

async function main() {
  const [command, directory = ".", output] = process.argv.slice(2);
  if (command === "validate") {
    const { manifest } = await validateDirectory(path.resolve(directory));
    console.log(`${manifest.name} ${manifest.version} is valid.`);
  } else if (command === "pack") await pack(directory, output);
  else if (command === "init") await init(directory);
  else {
    console.log("Usage: slidespace-widget <init|validate|pack> <directory> [output.sswidget]");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

