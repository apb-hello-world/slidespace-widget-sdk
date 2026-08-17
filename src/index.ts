import { z } from "zod";

export const WIDGET_API_VERSION = 3 as const;
export const WIDGET_RUNTIME_API_VERSION = "3.0" as const;

export const widgetIdSchema = z.string().regex(
  /^[a-z0-9](?:[a-z0-9.-]{1,126}[a-z0-9])?$/,
  "Use lowercase letters, numbers, dots, and hyphens.",
);

export const widgetPermissionSchema = z.string().regex(
  /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/,
  "Permission identifiers use lowercase letters, numbers, dots, underscores, and hyphens.",
);

export const widgetPermissions = [
  "network.https",
  "network.local",
  "system.clock.read",
  "system.performance.read",
  "system.storage.read",
  "system.media.read",
  "system.media.control",
  "links.open",
  "storage.local",
  "animation.continuous",
] as const;

export const widgetPermissionV3Schema = z.enum(widgetPermissions);

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/,
  "Colors use #RRGGBB or #RRGGBBAA notation.");
const stableSemverSchema = z.string().trim().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
const bindingSchema = z.string().trim().min(1).max(128);
const settingKeySchema = z.string().regex(/^[A-Za-z][A-Za-z0-9._-]{0,62}$/);
const dataSourceIdSchema = z.string().regex(/^[a-z][a-z0-9_-]{0,47}$/);
const hostSchema = z.string().trim().toLowerCase().max(253).refine((value) => {
  if (value === "localhost") return true;
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value);
}, "Use a DNS host name without a scheme, path, port, or wildcard.");

export const widgetSettingSchema = z.object({
  key: settingKeySchema,
  label: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).optional(),
  type: z.enum(["boolean", "number", "text", "url", "choice", "color", "font", "volume", "volumes", "secret"]),
  defaultValue: z.union([
    z.string().max(2_000),
    z.number(),
    z.boolean(),
    z.array(z.string().trim().min(1).max(260)).max(64),
  ]).optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  options: z.array(z.object({
    value: z.string().trim().min(1).max(120),
    label: z.string().trim().min(1).max(120),
  })).max(64).optional(),
  required: z.boolean().default(false),
  secret: z.boolean().optional(),
  approvesNetworkOrigin: z.boolean().default(false),
}).superRefine((setting, context) => {
  if (setting.type === "choice" && !setting.options?.length)
    context.addIssue({ code: "custom", path: ["options"], message: "Choice settings need options." });
  if (setting.type !== "choice" && setting.options?.length)
    context.addIssue({ code: "custom", path: ["options"], message: "Only choice settings use options." });
  if (setting.minimum !== undefined && setting.maximum !== undefined && setting.minimum > setting.maximum)
    context.addIssue({ code: "custom", path: ["minimum"], message: "Minimum cannot exceed maximum." });
  if (setting.approvesNetworkOrigin && setting.type !== "url")
    context.addIssue({ code: "custom", path: ["approvesNetworkOrigin"], message: "Only URL settings approve origins." });
});

export type WidgetSetting = z.infer<typeof widgetSettingSchema>;

const widgetSettingV2Schema = z.object({
  key: settingKeySchema,
  label: z.string().trim().min(1).max(80),
  type: z.enum(["boolean", "number", "text", "choice", "color", "secret"]),
  defaultValue: z.string().max(1_000).optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  options: z.array(z.string().trim().min(1)).max(32).optional(),
  secret: z.boolean().optional(),
});

export const widgetActionSchema = z.discriminatedUnion("type", [
  z.object({ id: settingKeySchema, type: z.literal("refresh"), dataSource: dataSourceIdSchema.optional() }),
  z.object({ id: settingKeySchema, type: z.literal("openLink"), urlBinding: bindingSchema }),
  z.object({ id: settingKeySchema, type: z.literal("select"), valueBinding: bindingSchema.optional() }),
  z.object({
    id: settingKeySchema,
    type: z.literal("mediaControl"),
    command: z.enum(["playPause", "previous", "next"]),
  }),
]);

export type WidgetAction = z.infer<typeof widgetActionSchema>;

const conditionSchema = z.object({
  binding: bindingSchema,
  operator: z.enum(["truthy", "falsy", "equals", "notEquals", "greaterThan", "lessThan"]),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

const styleSchema = z.object({
  color: colorSchema.optional(),
  colorBinding: bindingSchema.optional(),
  backgroundColor: colorSchema.optional(),
  backgroundColorBinding: bindingSchema.optional(),
  fontSize: z.number().min(8).max(128).optional(),
  fontFamily: z.string().trim().min(1).max(120).optional(),
  fontSizeBinding: bindingSchema.optional(),
  fontFamilyBinding: bindingSchema.optional(),
  weight: z.enum(["normal", "medium", "bold"]).optional(),
  horizontalAlignment: z.enum(["start", "center", "end", "stretch"]).optional(),
  verticalAlignment: z.enum(["start", "center", "end", "stretch"]).optional(),
  padding: z.number().min(0).max(96).optional(),
  gap: z.number().min(0).max(96).optional(),
  cornerRadius: z.number().min(0).max(96).optional(),
  borderColor: colorSchema.optional(),
  borderColorBinding: bindingSchema.optional(),
  borderWidth: z.number().min(0).max(8).optional(),
  opacity: z.number().min(0).max(1).optional(),
}).strict();

export type WidgetLayoutNode = {
  type: "stack" | "grid" | "overlay" | "repeat" | "conditional" | "text" | "image" | "progress" | "chart" | "button" | "spacer";
  id?: string;
  text?: string;
  binding?: string;
  sourceBinding?: string;
  altBinding?: string;
  value?: number;
  action?: string;
  direction?: "horizontal" | "vertical";
  columns?: number;
  itemsBinding?: string;
  itemName?: string;
  scrollable?: boolean;
  condition?: z.infer<typeof conditionSchema>;
  chartKind?: "line" | "bar" | "area";
  style?: z.infer<typeof styleSchema>;
  children?: WidgetLayoutNode[];
  template?: WidgetLayoutNode;
};

export const widgetLayoutNodeSchema: z.ZodType<WidgetLayoutNode> = z.lazy(() => z.object({
  type: z.enum(["stack", "grid", "overlay", "repeat", "conditional", "text", "image", "progress", "chart", "button", "spacer"]),
  id: settingKeySchema.optional(),
  text: z.string().max(1_000).optional(),
  binding: bindingSchema.optional(),
  sourceBinding: bindingSchema.optional(),
  altBinding: bindingSchema.optional(),
  value: z.number().min(0).max(1).optional(),
  action: settingKeySchema.optional(),
  direction: z.enum(["horizontal", "vertical"]).optional(),
  columns: z.number().int().min(1).max(12).optional(),
  itemsBinding: bindingSchema.optional(),
  itemName: z.string().regex(/^[a-z][a-z0-9_]{0,31}$/).optional(),
  scrollable: z.boolean().optional(),
  condition: conditionSchema.optional(),
  chartKind: z.enum(["line", "bar", "area"]).optional(),
  style: styleSchema.optional(),
  children: z.array(widgetLayoutNodeSchema).max(256).optional(),
  template: widgetLayoutNodeSchema.optional(),
}).strict().superRefine((node, context) => {
  if (node.type === "stack" && !node.direction)
    context.addIssue({ code: "custom", path: ["direction"], message: "Stacks need a direction." });
  if (node.type === "grid" && !node.columns)
    context.addIssue({ code: "custom", path: ["columns"], message: "Grids need a column count." });
  if (node.type === "repeat" && (!node.itemsBinding || !node.template))
    context.addIssue({ code: "custom", path: ["template"], message: "Repeat nodes need itemsBinding and template." });
  if (node.type === "conditional" && (!node.condition || !node.children?.length))
    context.addIssue({ code: "custom", path: ["condition"], message: "Conditional nodes need a condition and child." });
  if (node.type === "image" && !node.sourceBinding)
    context.addIssue({ code: "custom", path: ["sourceBinding"], message: "Images need a source binding." });
  if (node.type === "button" && !node.action)
    context.addIssue({ code: "custom", path: ["action"], message: "Buttons need an action." });
  if (node.type === "chart" && !node.binding)
    context.addIssue({ code: "custom", path: ["binding"], message: "Charts need a numeric-series binding." });
}));

const httpDataSourceSchema = z.object({
  id: dataSourceIdSchema,
  type: z.literal("http"),
  request: z.object({
    method: z.enum(["GET", "HEAD"]).default("GET"),
    url: z.string().trim().min(1).max(2_000),
    headers: z.record(z.string().max(100), z.union([
      z.string().max(2_000),
      z.object({ secretSetting: settingKeySchema }),
    ])).default({}),
    query: z.record(z.string().max(100), z.union([
      z.string().max(2_000),
      z.object({ secretSetting: settingKeySchema, exposeInUrl: z.literal(true) }),
    ])).default({}),
  }),
  response: z.object({
    format: z.enum(["json", "xml", "text"]),
    selector: z.string().max(500).optional(),
    itemsSelector: z.string().max(500).optional(),
    maximumItems: z.number().int().min(1).max(100).optional(),
    maximumItemsSetting: settingKeySchema.optional(),
  }),
  refreshIntervalMilliseconds: z.number().int().min(60_000).max(86_400_000),
  manualRefresh: z.boolean().default(true),
});

const systemDataSourceSchema = z.object({
  id: dataSourceIdSchema,
  type: z.enum(["system.clock", "system.performance", "system.storage", "system.media"]),
  refreshIntervalMilliseconds: z.number().int().min(250).max(86_400_000),
  options: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export const widgetDataSourceSchema = z.discriminatedUnion("type", [httpDataSourceSchema, systemDataSourceSchema]);
export type WidgetDataSource = z.infer<typeof widgetDataSourceSchema>;

export const widgetNetworkPolicySchema = z.object({
  declaredHosts: z.array(hostSchema).max(32).default([]),
  allowUserProvidedOrigins: z.boolean().default(false),
  allowLocalOrigins: z.boolean().default(false),
}).default({ declaredHosts: [], allowUserProvidedOrigins: false, allowLocalOrigins: false });

export const widgetCompatibilitySchema = z.object({
  minimumSlideSpaceVersion: z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/),
  runtimeApi: z.literal(WIDGET_RUNTIME_API_VERSION),
});

export const widgetSourceSchema = z.object({
  repository: z.string().url().max(2_000).refine((value) => new URL(value).protocol === "https:",
    "Source repositories must use HTTPS."),
  commit: z.string().regex(/^[a-fA-F0-9]{7,64}$/),
  license: z.string().trim().min(1).max(80),
  buildInstructions: z.string().trim().min(1).max(2_000),
});

export const widgetRuntimeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("declarative") }),
  z.object({
    kind: z.literal("wasm"),
    apiVersion: z.literal(WIDGET_RUNTIME_API_VERSION),
    module: z.literal("logic.wasm"),
    exports: z.object({
      initialize: z.literal("initialize"),
      handleEvent: z.literal("handle_event"),
      migrateState: z.literal("migrate_state"),
    }),
    maximumStateBytes: z.number().int().min(0).max(1_048_576).default(262_144),
  }),
]);

export type V2LayoutNode = {
  type: "stack" | "text" | "progress" | "spacer";
  text?: string; binding?: string; color?: string; fontSize?: number;
  weight?: "normal" | "bold"; direction?: "horizontal" | "vertical";
  value?: number; children?: V2LayoutNode[];
};

const v2LayoutNodeSchema: z.ZodType<V2LayoutNode> = z.lazy(() => z.object({
  type: z.enum(["stack", "text", "progress", "spacer"]),
  text: z.string().max(500).optional(),
  binding: z.string().max(64).optional(),
  color: colorSchema.optional(),
  fontSize: z.number().min(8).max(96).optional(),
  weight: z.enum(["normal", "bold"]).optional(),
  direction: z.enum(["horizontal", "vertical"]).optional(),
  value: z.number().min(0).max(1).optional(),
  children: z.array(v2LayoutNodeSchema).max(128).optional(),
}));

export const widgetManifestV2Schema = z.object({
  schemaVersion: z.literal(2),
  id: widgetIdSchema,
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500),
  publisher: z.string().trim().min(1).max(80),
  version: z.string().trim().min(1).max(32),
  renderer: z.literal("declarative-v2"),
  defaultWidth: z.number().int().min(120).max(1200),
  defaultHeight: z.number().int().min(64).max(900),
  refreshIntervalMilliseconds: z.number().int().min(250).max(86_400_000),
  permissions: z.array(widgetPermissionV3Schema).max(widgetPermissions.length).default([]),
  visible: z.boolean().default(true),
  previewText: z.string().trim().min(1).max(24),
  primaryText: z.string().trim().min(1).max(120),
  secondaryText: z.string().trim().min(1).max(180),
  accentColor: colorSchema,
  backgroundColor: colorSchema,
  transparentBackground: z.boolean().default(false),
  dataSource: z.enum(["static", "system.clock"]).default("static"),
  dataFormat: z.string().trim().max(40).nullable().default(null),
  layout: v2LayoutNodeSchema,
  settings: z.array(widgetSettingV2Schema).max(32).default([]),
  networkHosts: z.array(hostSchema).max(16).default([]),
}).superRefine((manifest, context) => {
  if (manifest.dataSource === "system.clock" && !manifest.permissions.includes("system.clock.read"))
    context.addIssue({ code: "custom", path: ["permissions"], message: "system.clock requires system.clock.read." });
  if (manifest.networkHosts.length && !manifest.permissions.includes("network.https"))
    context.addIssue({ code: "custom", path: ["permissions"], message: "Network hosts require network.https." });
});

export const widgetManifestV3Schema = z.object({
  schemaVersion: z.literal(3),
  id: widgetIdSchema,
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500),
  publisher: z.string().trim().min(1).max(80),
  version: stableSemverSchema,
  renderer: z.literal("declarative-v3"),
  defaultWidth: z.number().int().min(120).max(1200),
  defaultHeight: z.number().int().min(64).max(900),
  permissions: z.array(widgetPermissionSchema).max(32).default([]),
  visible: z.boolean().default(true),
  previewText: z.string().trim().min(1).max(24),
  accentColor: colorSchema,
  backgroundColor: colorSchema,
  transparentBackground: z.boolean().default(false),
  runtime: widgetRuntimeSchema.default({ kind: "declarative" }),
  compatibility: widgetCompatibilitySchema,
  source: widgetSourceSchema.optional(),
  settings: z.array(widgetSettingSchema).max(48).default([]),
  network: widgetNetworkPolicySchema,
  dataSources: z.array(widgetDataSourceSchema).max(16).default([]),
  actions: z.array(widgetActionSchema).max(64).default([]),
  layout: widgetLayoutNodeSchema,
}).strict().superRefine((manifest, context) => {
  const permissions = new Set(manifest.permissions);
  const dataSourceIds = manifest.dataSources.map((source) => source.id);
  if (new Set(dataSourceIds).size !== dataSourceIds.length)
    context.addIssue({ code: "custom", path: ["dataSources"], message: "Data-source IDs must be unique." });
  const actionIds = manifest.actions.map((action) => action.id);
  if (new Set(actionIds).size !== actionIds.length)
    context.addIssue({ code: "custom", path: ["actions"], message: "Action IDs must be unique." });
  if (manifest.dataSources.some((source) => source.type === "http") && !permissions.has("network.https"))
    context.addIssue({ code: "custom", path: ["permissions"], message: "HTTP data sources require network.https." });
  if (manifest.network.allowLocalOrigins && !permissions.has("network.local"))
    context.addIssue({ code: "custom", path: ["permissions"], message: "Local origins require network.local." });
  if ((manifest.network.declaredHosts.length || manifest.network.allowUserProvidedOrigins) && !permissions.has("network.https"))
    context.addIssue({ code: "custom", path: ["permissions"], message: "Network origins require network.https." });
  const requiredBySource: Partial<Record<WidgetDataSource["type"], string>> = {
    "system.clock": "system.clock.read",
    "system.performance": "system.performance.read",
    "system.storage": "system.storage.read",
    "system.media": "system.media.read",
  };
  for (const source of manifest.dataSources) {
    const required = requiredBySource[source.type];
    if (required && !permissions.has(required))
      context.addIssue({ code: "custom", path: ["permissions"], message: `${source.type} requires ${required}.` });
  }
  if (manifest.actions.some((action) => action.type === "openLink") && !permissions.has("links.open"))
    context.addIssue({ code: "custom", path: ["permissions"], message: "Open-link actions require links.open." });
  if (manifest.actions.some((action) => action.type === "mediaControl") && !permissions.has("system.media.control"))
    context.addIssue({ code: "custom", path: ["permissions"], message: "Media actions require system.media.control." });
  if (manifest.runtime.kind === "wasm" && manifest.runtime.maximumStateBytes > 0 && !permissions.has("storage.local"))
    context.addIssue({ code: "custom", path: ["permissions"], message: "Persistent WebAssembly state requires storage.local." });
  if (manifest.permissions.includes("animation.continuous") && manifest.runtime.kind !== "wasm")
    context.addIssue({ code: "custom", path: ["permissions"], message: "Continuous animation is available only to WebAssembly widgets." });
  if (manifest.runtime.kind === "wasm" && !manifest.source)
    context.addIssue({ code: "custom", path: ["source"], message: "Community WebAssembly widgets require public source metadata." });
  const settingKeys = new Set(manifest.settings.map((setting) => setting.key));
  for (const source of manifest.dataSources) {
    if (source.type === "http") {
      const secretReferences = [...Object.values(source.request.headers), ...Object.values(source.request.query)]
        .filter((value): value is { secretSetting: string } => typeof value === "object" && value !== null && "secretSetting" in value);
      for (const reference of secretReferences) {
        const setting = manifest.settings.find((candidate) => candidate.key === reference.secretSetting);
        if (!settingKeys.has(reference.secretSetting) || setting?.type !== "secret")
          context.addIssue({ code: "custom", path: ["dataSources", source.id], message: `Secret reference ${reference.secretSetting} must name a secret setting.` });
      }
      if (source.response.maximumItemsSetting) {
        const setting = manifest.settings.find((candidate) => candidate.key === source.response.maximumItemsSetting);
        if (setting?.type !== "number")
          context.addIssue({ code: "custom", path: ["dataSources", source.id, "response", "maximumItemsSetting"], message: "maximumItemsSetting must name a number setting." });
      }
    }
    if (source.type === "system.storage") {
      const volumeSetting = typeof source.options.volumeSetting === "string" ? source.options.volumeSetting : undefined;
      const volumesSetting = typeof source.options.volumesSetting === "string" ? source.options.volumesSetting : undefined;
      const showAllSetting = typeof source.options.showAllSetting === "string" ? source.options.showAllSetting : undefined;
      if (volumeSetting && manifest.settings.find((candidate) => candidate.key === volumeSetting)?.type !== "volume")
        context.addIssue({ code: "custom", path: ["dataSources", source.id, "options", "volumeSetting"], message: "volumeSetting must name a volume setting." });
      if (volumesSetting && manifest.settings.find((candidate) => candidate.key === volumesSetting)?.type !== "volumes")
        context.addIssue({ code: "custom", path: ["dataSources", source.id, "options", "volumesSetting"], message: "volumesSetting must name a volumes setting." });
      if (showAllSetting && manifest.settings.find((candidate) => candidate.key === showAllSetting)?.type !== "boolean")
        context.addIssue({ code: "custom", path: ["dataSources", source.id, "options", "showAllSetting"], message: "showAllSetting must name a Boolean setting." });
    }
  }
  for (const setting of manifest.settings) {
    if (setting.type === "secret" && setting.defaultValue !== undefined)
      context.addIssue({ code: "custom", path: ["settings", setting.key], message: "Secret settings cannot have defaults." });
    if (setting.approvesNetworkOrigin && !manifest.network.allowUserProvidedOrigins)
      context.addIssue({ code: "custom", path: ["settings", setting.key], message: "Origin settings require allowUserProvidedOrigins." });
  }
});

export const widgetManifestSchema = z.union([widgetManifestV2Schema, widgetManifestV3Schema]);
export type WidgetManifestV2 = z.infer<typeof widgetManifestV2Schema>;
export type WidgetManifestV3 = z.infer<typeof widgetManifestV3Schema>;
export type WidgetManifest = z.infer<typeof widgetManifestSchema>;

export function validateManifest(value: unknown): WidgetManifest {
  return widgetManifestSchema.parse(value);
}

export const widgetRuntimeInputSchema = z.object({
  apiVersion: z.literal(WIDGET_RUNTIME_API_VERSION),
  instanceId: z.string().uuid(),
  event: z.object({
    type: z.enum(["initialize", "refresh", "timer", "animation", "action", "resize", "migrate_state"]),
    actionId: z.string().optional(),
    value: z.unknown().optional(),
    elapsedMilliseconds: z.number().min(0).max(60_000).optional(),
    fromVersion: stableSemverSchema.optional(),
    toVersion: stableSemverSchema.optional(),
  }),
  size: z.object({ width: z.number().int().min(1), height: z.number().int().min(1) }),
  settings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  data: z.record(z.string(), z.unknown()),
  state: z.unknown(),
});

export const widgetRuntimeOutputSchema = z.object({
  state: z.unknown().optional(),
  values: z.record(z.string(), z.unknown()).default({}),
  commands: z.array(z.discriminatedUnion("type", [
    z.object({ type: z.literal("refresh"), dataSource: dataSourceIdSchema.optional() }),
    z.object({ type: z.literal("openLink"), url: z.string().url().max(2_000) }),
    z.object({ type: z.literal("mediaControl"), command: z.enum(["playPause", "previous", "next"]) }),
  ])).max(16).default([]),
});

export type WidgetRuntimeInput = z.infer<typeof widgetRuntimeInputSchema>;
export type WidgetRuntimeOutput = z.infer<typeof widgetRuntimeOutputSchema>;

export type WidgetPermissionSnapshot = {
  permissions: string[];
  declaredHosts: string[];
  allowUserProvidedOrigins: boolean;
  allowLocalOrigins: boolean;
  secretSettings: string[];
  actions: string[];
  runtimeKind: "declarative" | "wasm";
};

export function createPermissionSnapshot(manifest: WidgetManifest): WidgetPermissionSnapshot {
  if (manifest.schemaVersion === 2) return {
    permissions: [...manifest.permissions].sort(),
    declaredHosts: [...manifest.networkHosts].sort(),
    allowUserProvidedOrigins: false,
    allowLocalOrigins: false,
    secretSettings: manifest.settings.filter((setting) => setting.type === "secret").map((setting) => setting.key).sort(),
    actions: [],
    runtimeKind: "declarative",
  };
  return {
    permissions: [...manifest.permissions].sort(),
    declaredHosts: [...manifest.network.declaredHosts].sort(),
    allowUserProvidedOrigins: manifest.network.allowUserProvidedOrigins,
    allowLocalOrigins: manifest.network.allowLocalOrigins,
    secretSettings: manifest.settings.filter((setting) => setting.type === "secret").map((setting) => setting.key).sort(),
    actions: manifest.actions.map((action) => action.type).sort(),
    runtimeKind: manifest.runtime.kind,
  };
}
