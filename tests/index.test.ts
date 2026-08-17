import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  createPermissionSnapshot,
  validateManifest,
  widgetRuntimeInputSchema,
  widgetRuntimeOutputSchema,
} from "../src/index.js";

const v2Sample = {
  schemaVersion: 2 as const, id: "community.sdk-samples.hello-clock", name: "Hello clock",
  description: "SDK sample", publisher: "SDK sample", version: "0.1.0",
  renderer: "declarative-v2" as const, defaultWidth: 320, defaultHeight: 150,
  refreshIntervalMilliseconds: 1000, permissions: ["system.clock.read"], visible: true,
  previewText: "12:34", primaryText: "12:34", secondaryText: "Local time",
  accentColor: "#00D9ED", backgroundColor: "#0D1518", transparentBackground: false,
  dataSource: "system.clock" as const, dataFormat: "h:mm:ss tt",
  layout: { type: "text" as const, binding: "clock", fontSize: 30, weight: "bold" as const },
  settings: [], networkHosts: [],
};

const v3Examples = [
  "rss-reader", "drive-capacity", "media-controls", "authenticated-api",
  "rust-mini-game", "typescript-dashboard",
];

async function example(name: string) {
  return JSON.parse(await readFile(new URL(`../examples/${name}/manifest.json`, import.meta.url), "utf8"));
}

describe("widget manifest", () => {
  it("retains v2 compatibility", () => expect(validateManifest(v2Sample).schemaVersion).toBe(2));
  it("rejects executable renderers", () => expect(() => validateManifest({ ...v2Sample, renderer: "javascript" })).toThrow());
  it("requires the v2 clock permission", () => expect(() => validateManifest({ ...v2Sample, permissions: [] })).toThrow());

  it.each(["hello-clock", "layout-showcase"])("validates the v2 %s example", async (name) => {
    expect(validateManifest(await example(name)).schemaVersion).toBe(2);
  });

  it.each(v3Examples)("validates the v3 %s example", async (name) => {
    const manifest = validateManifest(await example(name));
    expect(manifest.schemaVersion).toBe(3);
    expect(manifest.id).toMatch(/^community\.sdk-samples\./);
  });

  it("normalizes the RSS permission snapshot", async () => {
    const snapshot = createPermissionSnapshot(validateManifest(await example("rss-reader")));
    expect(snapshot).toMatchObject({
      permissions: ["links.open", "network.https"],
      allowUserProvidedOrigins: true,
      runtimeKind: "declarative",
    });
  });

  it("rejects a local network policy without network.local", async () => {
    const manifest = await example("rss-reader");
    manifest.network.allowLocalOrigins = true;
    expect(() => validateManifest(manifest)).toThrow(/network\.local/);
  });

  it("rejects secret references to ordinary settings", async () => {
    const manifest = await example("authenticated-api");
    manifest.dataSources[0].request.headers.Authorization = { secretSetting: "missing" };
    expect(() => validateManifest(manifest)).toThrow(/secret setting/);
  });

  it("requires source provenance for Wasm widgets", async () => {
    const manifest = await example("rust-mini-game");
    delete manifest.source;
    expect(() => validateManifest(manifest)).toThrow(/public source/);
  });
});

describe("runtime protocol", () => {
  it("accepts bounded non-secret input and typed output", () => {
    expect(widgetRuntimeInputSchema.parse({
      apiVersion: "3.0",
      instanceId: "25e87ae9-b972-4cea-a315-ad9f2fdca8a7",
      event: { type: "action", actionId: "move", value: { x: 20, y: 40 } },
      size: { width: 420, height: 260 },
      settings: { difficulty: "normal" },
      data: { status: { healthy: true } },
      state: { score: 2 },
    }).apiVersion).toBe("3.0");

    expect(widgetRuntimeOutputSchema.parse({
      state: { score: 3 },
      values: { score: "3" },
      commands: [{ type: "refresh", dataSource: "status" }],
    }).commands).toHaveLength(1);
  });

  it("rejects arbitrary runtime commands", () => {
    expect(() => widgetRuntimeOutputSchema.parse({ values: {}, commands: [{ type: "shell", value: "cmd" }] })).toThrow();
  });
});
