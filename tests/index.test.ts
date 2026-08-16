import { describe, expect, it } from "vitest";
import { validateManifest } from "../src/index.js";

const sample = {
  schemaVersion: 2 as const, id: "community.hello-clock", name: "Hello clock",
  description: "SDK sample", publisher: "SDK sample", version: "0.1.0",
  renderer: "declarative-v2" as const, defaultWidth: 320, defaultHeight: 150,
  refreshIntervalMilliseconds: 1000, permissions: ["system.clock.read"], visible: true,
  previewText: "12:34", primaryText: "12:34", secondaryText: "Local time",
  accentColor: "#00D9ED", backgroundColor: "#0D1518", transparentBackground: false,
  dataSource: "system.clock" as const, dataFormat: "h:mm:ss tt",
  layout: { type: "text" as const, binding: "clock", fontSize: 30, weight: "bold" as const },
  settings: [], networkHosts: [],
};

describe("widget manifest", () => {
  it("accepts the sample", () => expect(validateManifest(sample).schemaVersion).toBe(2));
  it("rejects executable renderers", () => expect(() => validateManifest({ ...sample, renderer: "javascript" })).toThrow());
  it("requires clock permission", () => expect(() => validateManifest({ ...sample, permissions: [] })).toThrow());
});
