import { z } from "zod";

export const widgetIdSchema = z.string().regex(
  /^[a-z0-9](?:[a-z0-9.-]{1,126}[a-z0-9])?$/,
  "Use lowercase letters, numbers, dots, and hyphens.",
);

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const bindingSchema = z.string().trim().min(1).max(64);

export const widgetLayoutNodeSchema: z.ZodType<WidgetLayoutNode> = z.lazy(() =>
  z.object({
    type: z.enum(["stack", "text", "progress", "spacer"]),
    text: z.string().max(500).optional(),
    binding: bindingSchema.optional(),
    color: colorSchema.optional(),
    fontSize: z.number().min(8).max(96).optional(),
    weight: z.enum(["normal", "bold"]).optional(),
    direction: z.enum(["horizontal", "vertical"]).optional(),
    value: z.number().min(0).max(1).optional(),
    children: z.array(widgetLayoutNodeSchema).max(128).optional(),
  }).superRefine((node, context) => {
    if (node.type === "stack" && !node.direction)
      context.addIssue({ code: "custom", path: ["direction"], message: "Stacks need a direction." });
    if (node.type !== "stack" && node.children?.length)
      context.addIssue({ code: "custom", path: ["children"], message: "Only stacks can have children." });
  }),
);

export type WidgetLayoutNode = {
  type: "stack" | "text" | "progress" | "spacer";
  text?: string;
  binding?: string;
  color?: string;
  fontSize?: number;
  weight?: "normal" | "bold";
  direction?: "horizontal" | "vertical";
  value?: number;
  children?: WidgetLayoutNode[];
};

export const widgetSettingSchema = z.object({
  key: z.string().regex(/^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/),
  label: z.string().trim().min(1).max(80),
  type: z.enum(["boolean", "number", "text", "choice", "color", "secret"]),
  defaultValue: z.string().max(1000).optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  options: z.array(z.string().trim().min(1)).max(32).optional(),
  secret: z.boolean().optional(),
}).superRefine((setting, context) => {
  if (setting.type === "choice" && !setting.options?.length)
    context.addIssue({ code: "custom", path: ["options"], message: "Choice settings need options." });
  if (setting.type !== "choice" && setting.options?.length)
    context.addIssue({ code: "custom", path: ["options"], message: "Only choice settings use options." });
  if (setting.minimum !== undefined && setting.maximum !== undefined && setting.minimum > setting.maximum)
    context.addIssue({ code: "custom", path: ["minimum"], message: "Minimum cannot exceed maximum." });
});

export const widgetManifestSchema = z.object({
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
  permissions: z.array(z.string().regex(/^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/)).max(32).default([]),
  visible: z.boolean().default(true),
  previewText: z.string().trim().min(1).max(24),
  primaryText: z.string().trim().min(1).max(120),
  secondaryText: z.string().trim().min(1).max(180),
  accentColor: colorSchema,
  backgroundColor: colorSchema,
  transparentBackground: z.boolean().default(false),
  dataSource: z.enum(["static", "system.clock"]).default("static"),
  dataFormat: z.string().trim().max(40).nullable().default(null),
  layout: widgetLayoutNodeSchema,
  settings: z.array(widgetSettingSchema).max(32).default([]),
  networkHosts: z.array(z.string().trim().toLowerCase()).max(16).default([]),
}).superRefine((manifest, context) => {
  if (manifest.dataSource === "system.clock" && !manifest.permissions.includes("system.clock.read"))
    context.addIssue({ code: "custom", path: ["permissions"], message: "system.clock requires system.clock.read." });
  if (manifest.networkHosts.length && !manifest.permissions.includes("network.https"))
    context.addIssue({ code: "custom", path: ["permissions"], message: "Network hosts require network.https." });
});

export type WidgetManifest = z.infer<typeof widgetManifestSchema>;

export function validateManifest(value: unknown): WidgetManifest {
  return widgetManifestSchema.parse(value);
}

