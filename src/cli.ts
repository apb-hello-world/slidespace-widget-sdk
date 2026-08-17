#!/usr/bin/env node
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { zipSync } from "fflate";
import { z } from "zod";
import {
  createPermissionSnapshot,
  validateManifest,
  widgetManifestSchema,
  widgetRuntimeInputSchema,
  widgetRuntimeOutputSchema,
  type WidgetManifest,
} from "./index.js";

const MAX_PACKAGE_BYTES = 10 * 1024 * 1024;
const MAX_WASM_BYTES = 10 * 1024 * 1024;
const SAFE_ASSETS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const SAFE_ROOT_FILES = new Set([
  "manifest.json", "README.md", "LICENSE", "logic.wasm",
  "runtime-input.json", "runtime-output.json", "mock-data.json",
]);

async function validateDirectory(directory: string) {
  const manifestPath = path.join(directory, "manifest.json");
  const manifest = validateManifest(JSON.parse(await readFile(manifestPath, "utf8")));
  const files = await walk(directory);
  if (files.length > 128) throw new Error("A widget package may contain at most 128 files.");
  for (const file of files) {
    const relative = path.relative(directory, file).replaceAll("\\", "/");
    if (SAFE_ROOT_FILES.has(relative)) continue;
    if (relative.startsWith("assets/") && SAFE_ASSETS.has(path.extname(relative).toLowerCase())) continue;
    if (relative.startsWith("source/")) continue;
    throw new Error(`Unsafe package file: ${relative}.`);
  }
  let wasmInspection: ReturnType<typeof inspectWasm> | null = null;
  if (manifest.schemaVersion === 3 && manifest.runtime.kind === "wasm") {
    const logicPath = path.join(directory, manifest.runtime.module);
    const info = await stat(logicPath).catch(() => null);
    if (!info?.isFile()) throw new Error("WebAssembly widgets must include logic.wasm.");
    if (info.size > MAX_WASM_BYTES) throw new Error("logic.wasm is larger than 10 MB.");
    const bytes = await readFile(logicPath);
    wasmInspection = inspectWasm(bytes);
  }
  if (manifest.schemaVersion !== 3 && files.some((file) => path.basename(file).toLowerCase() === "logic.wasm"))
    throw new Error("WebAssembly logic requires Widget API v3.");
  return { manifest, files, wasmInspection };
}

function inspectWasm(bytes: Uint8Array) {
  if (bytes.length < 8 || !Buffer.from(bytes.subarray(0, 4)).equals(Buffer.from([0, 97, 115, 109])))
    throw new Error("logic.wasm does not have a WebAssembly module header.");
  const module = new WebAssembly.Module(Uint8Array.from(bytes).buffer);
  const imports = WebAssembly.Module.imports(module).map((item) => `${item.module}.${item.name}`);
  const exports = WebAssembly.Module.exports(module).map((item) => item.name);
  const required = ["initialize", "handle_event", "migrate_state"];
  const missing = required.filter((name) => !exports.includes(name));
  if (missing.length) throw new Error(`logic.wasm is missing required exports: ${missing.join(", ")}.`);
  if (imports.some((name) => !name.startsWith("extism:host/env.") || /wasi|sock|path_|fd_|http/i.test(name)))
    throw new Error("logic.wasm imports functionality outside the restricted Extism host ABI.");
  return { sizeBytes: bytes.byteLength, imports, exports };
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
  return target;
}

async function init(directory: string, template = "declarative") {
  const root = path.resolve(directory);
  await mkdir(root, { recursive: true });
  const wasm = template === "rust" || template === "typescript";
  const manifest = {
    schemaVersion: 3,
    id: "community.my-publisher.my-widget",
    name: "My widget",
    description: "A lightweight SlideSpace desktop widget.",
    publisher: "Your name",
    version: "0.1.0",
    renderer: "declarative-v3",
    defaultWidth: 340,
    defaultHeight: 180,
    permissions: wasm ? ["storage.local"] : [],
    visible: true,
    previewText: "MW",
    accentColor: "#00D9ED",
    backgroundColor: "#0D1518",
    transparentBackground: false,
    runtime: wasm ? {
      kind: "wasm",
      apiVersion: "3.0",
      module: "logic.wasm",
      exports: { initialize: "initialize", handleEvent: "handle_event", migrateState: "migrate_state" },
      maximumStateBytes: 262144,
    } : { kind: "declarative" },
    compatibility: { minimumSlideSpaceVersion: "2.1.0", runtimeApi: "3.0" },
    ...(wasm ? {
      source: {
        repository: "https://github.com/your-name/your-widget",
        commit: "0000000000000000000000000000000000000000",
        license: "MIT",
        buildInstructions: `Build the ${template} source under source/ and copy the resulting component to logic.wasm.`,
      },
    } : {}),
    settings: [],
    network: { declaredHosts: [], allowUserProvidedOrigins: false, allowLocalOrigins: false },
    dataSources: [],
    actions: [],
    layout: {
      type: "stack",
      direction: "vertical",
      style: { padding: 18, gap: 8 },
      children: [
        { type: "text", text: "Hello, desktop", style: { fontSize: 24, weight: "bold" } },
        { type: "text", text: "Widget API v3", style: { fontSize: 12, color: "#8EBBC3" } },
      ],
    },
  };
  await writeFile(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2));
  await writeFile(path.join(root, "README.md"), "# My SlideSpace widget\n");
  if (wasm) {
    await mkdir(path.join(root, "source", "src"), { recursive: true });
    if (template === "rust") {
      await mkdir(path.join(root, "source", ".cargo"), { recursive: true });
      await writeFile(path.join(root, "source", "Cargo.toml"), `[package]\nname = "slidespace-widget-logic"\nversion = "0.1.0"\nedition = "2021"\n\n[lib]\ncrate-type = ["cdylib"]\n\n[dependencies]\nextism-pdk = "1"\nserde_json = "1"\n\n[profile.release]\nlto = true\nopt-level = "s"\nstrip = true\n`);
      await writeFile(path.join(root, "source", ".cargo", "config.toml"), `[build]\ntarget = "wasm32-unknown-unknown"\n`);
      await writeFile(path.join(root, "source", "src", "lib.rs"), `use extism_pdk::*;\nuse serde_json::{json, Value};\n\nfn run(input: Json<Value>) -> FnResult<String> {\n    Ok(json!({"state": input.0.get("state").cloned().unwrap_or(json!({})), "values": {"message": "Hello from Rust"}, "commands": []}).to_string())\n}\n\n#[plugin_fn]\npub fn initialize(input: Json<Value>) -> FnResult<String> { run(input) }\n#[plugin_fn]\npub fn handle_event(input: Json<Value>) -> FnResult<String> { run(input) }\n#[plugin_fn]\npub fn migrate_state(input: Json<Value>) -> FnResult<String> { run(input) }\n`);
    } else {
      await writeFile(path.join(root, "source", "package.json"), JSON.stringify({
        private: true,
        scripts: { build: "asc src/index.ts --outFile ../logic.wasm --optimize --use abort=src/index/myAbort" },
        devDependencies: { "@extism/as-pdk": "1.0.0", assemblyscript: "0.28.8" },
      }, null, 2));
      await writeFile(path.join(root, "source", "src", "index.ts"), `import { Host } from "@extism/as-pdk";\nexport function myAbort(): void {}\nfunction run(): i32 { Host.outputString('{"state":{},"values":{"message":"Hello from TypeScript"},"commands":[]}'); return 0; }\nexport function initialize(): i32 { return run(); }\nexport function handle_event(): i32 { return run(); }\nexport function migrate_state(): i32 { return run(); }\n`);
    }
    await writeFile(path.join(root, "source", "README.md"), `# ${template === "rust" ? "Rust" : "TypeScript-family"} logic\n\nBuild this source and copy the resulting no-WASI module to ../logic.wasm.\n`);
  }
  console.log(`Initialized ${root} using the ${template} template.`);
}

async function inspect(directory: string) {
  const { manifest, wasmInspection } = await validateDirectory(path.resolve(directory));
  console.log(JSON.stringify({
    id: manifest.id,
    version: manifest.version,
    schemaVersion: manifest.schemaVersion,
    renderer: manifest.renderer,
    permissionSnapshot: createPermissionSnapshot(manifest),
    wasm: wasmInspection,
  }, null, 2));
}

async function simulate(directory: string) {
  const root = path.resolve(directory);
  const { manifest } = await validateDirectory(root);
  const mockPath = path.join(root, "mock-data.json");
  const mock = await readFile(mockPath, "utf8").then(JSON.parse).catch(() => ({}));
  console.log(JSON.stringify({
    widget: manifest.id,
    schemaVersion: manifest.schemaVersion,
    size: { width: manifest.defaultWidth, height: manifest.defaultHeight },
    data: mock,
    layout: manifest.layout,
    note: "The desktop preview harness consumes this same validated manifest and mock-data shape.",
  }, null, 2));
}

async function testPackage(directory: string) {
  const root = path.resolve(directory);
  const { manifest } = await validateDirectory(root);
  if (manifest.schemaVersion === 3 && manifest.runtime.kind === "wasm") {
    const input = await readJsonIfPresent(path.join(root, "runtime-input.json"));
    const output = await readJsonIfPresent(path.join(root, "runtime-output.json"));
    if (input) widgetRuntimeInputSchema.parse(input);
    if (output) widgetRuntimeOutputSchema.parse(output);
  }
  console.log(`${manifest.name} passed package and fixture checks.`);
}

async function writeSchemas(directory: string) {
  const root = path.resolve(directory);
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, "widget-manifest.schema.json"),
    JSON.stringify(z.toJSONSchema(widgetManifestSchema), null, 2));
  await writeFile(path.join(root, "runtime-input.schema.json"),
    JSON.stringify(z.toJSONSchema(widgetRuntimeInputSchema), null, 2));
  await writeFile(path.join(root, "runtime-output.schema.json"),
    JSON.stringify(z.toJSONSchema(widgetRuntimeOutputSchema), null, 2));
  console.log(`Wrote contract schemas to ${root}`);
}

async function publish(directory: string, output?: string) {
  const target = await pack(directory, output);
  console.log(`Upload ${target} at https://aterrible.day/widgets/submit`);
}

async function readJsonIfPresent(file: string) {
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function walk(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const name of await readdir(directory)) {
    if (name === "node_modules" || name === "target" || name === "dist") continue;
    const value = path.join(directory, name);
    const info = await stat(value);
    if (info.isSymbolicLink()) throw new Error("Symbolic links are not allowed.");
    if (info.isDirectory()) result.push(...await walk(value));
    else result.push(value);
  }
  return result;
}

async function main() {
  const [command, directory = ".", option] = process.argv.slice(2);
  if (command === "validate") {
    const { manifest } = await validateDirectory(path.resolve(directory));
    console.log(`${manifest.name} ${manifest.version} is valid.`);
  } else if (command === "pack") await pack(directory, option);
  else if (command === "init") await init(directory, option ?? "declarative");
  else if (command === "inspect") await inspect(directory);
  else if (command === "simulate") await simulate(directory);
  else if (command === "test") await testPackage(directory);
  else if (command === "schemas") await writeSchemas(directory);
  else if (command === "publish") await publish(directory, option);
  else {
    console.log("Usage: slidespace-widget <init|validate|inspect|simulate|test|pack|publish|schemas> <directory> [option]");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
