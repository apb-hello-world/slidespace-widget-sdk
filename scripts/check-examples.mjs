import { existsSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const examplesRoot = path.join(root, "examples");
const temporary = await mkdtemp(path.join(tmpdir(), "slidespace-widget-examples-"));

function run(args) {
  const result = spawnSync(process.execPath, [path.join(root, "dist", "cli.js"), ...args], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `Command failed: ${args.join(" ")}`);
  process.stdout.write(result.stdout);
}

try {
  const examples = (await readdir(examplesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const name of examples) {
    const directory = path.join(examplesRoot, name);
    const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
    const missingCompiledWasm = manifest?.runtime?.kind === "wasm" &&
      !existsSync(path.join(directory, manifest.runtime.module ?? "logic.wasm"));
    if (missingCompiledWasm && process.env.REQUIRE_PREBUILT_WASM !== "1") {
      console.log(`${name}: source is present; compiled WebAssembly is verified by CI.`);
      continue;
    }
    run(["validate", directory]);
    run(["simulate", directory]);
    run(["inspect", directory]);
    run(["test", directory]);
    run(["pack", directory, path.join(temporary, `${name}.sswidget`)]);
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
