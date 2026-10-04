import { z } from "zod";
import limits from "../../../config/limits.json";

export { limits as CHAT_LIMITS };

export const ALLERGEN_NOTICE =
  "Allergen notice: Verify ingredient labels and allergen information yourself. PantryPal cannot guarantee that any ingredient or recipe is safe for your allergies.";

const IdSchema = z.uuid();
const LabelSchema = z.string().trim().min(1).max(limits.maxLabelCharacters);
const LabelsSchema = z.array(LabelSchema).max(limits.maxProfileItems);
const RevisionSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

export const ConfirmedEquipmentSchema = z.strictObject({
  status: z.literal("confirmed"),
  cookware: LabelsSchema,
  heatSources: LabelsSchema,
});

export const EquipmentSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("unknown") }),
  ConfirmedEquipmentSchema,
]);

export const SessionProfileSchema = z.strictObject({
  equipment: EquipmentSchema,
  preferences: LabelsSchema,
  ingredientExclusions: LabelsSchema,
});

export const AssistantMessageSchema = z.strictObject({
  id: IdSchema,
  role: z.literal("assistant"),
  content: z.string().trim().min(1).max(limits.maxReplyCharacters),
});

export const ChatMessageSchema = z.discriminatedUnion("role", [
  z.strictObject({
    id: IdSchema,
    role: z.literal("user"),
    content: z.string().trim().min(1).max(limits.maxMessageCharacters),
  }),
  AssistantMessageSchema,
]);

// History contains only completed turns plus the new user message, last.
export const ChatRequestSchema = z.strictObject({
  requestId: IdSchema,
  sessionId: IdSchema,
  sessionRevision: RevisionSchema,
  adultAcknowledged: z.literal(true),
  profile: SessionProfileSchema,
  messages: z.array(ChatMessageSchema).min(1).max(limits.maxMessages),
}).superRefine((request, ctx) => {
  const ids = new Set(request.messages.map((message) => message.id));
  if (ids.size !== request.messages.length) {
    ctx.addIssue({ code: "custom", path: ["messages"], message: "Message IDs must be unique." });
  }
  request.messages.forEach((message, index) => {
    const expectedRole = index % 2 === 0 ? "user" : "assistant";
    if (message.role !== expectedRole) {
      ctx.addIssue({ code: "custom", path: ["messages", index, "role"], message: "History must alternate user and assistant turns." });
    }
  });
  if (request.messages.at(-1)?.role !== "user") {
    ctx.addIssue({ code: "custom", path: ["messages"], message: "The final message must be from the user." });
  }
});

export const SourceSchema = z.strictObject({
  title: LabelSchema,
  url: z.url({ protocol: /^https?$/ }).max(limits.maxUrlCharacters).refine((value) => {
    try {
      const url = new URL(value);
      return !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Source URLs must not contain credentials."),
});

export const EquipmentCheckSchema = z.strictObject({
  // Identifies the exact candidate/method in the answer, including alternatives.
  candidateId: IdSchema,
  candidateName: LabelSchema,
  status: z.enum(["feasible", "missing", "unknown"]),
  requiredCookware: LabelsSchema,
  requiredHeatSources: LabelsSchema,
  missingCookware: LabelsSchema,
  missingHeatSources: LabelsSchema,
}).superRefine((check, ctx) => {
  const hasMissing = check.missingCookware.length + check.missingHeatSources.length > 0;
  if ((check.status === "missing") !== hasMissing) {
    ctx.addIssue({ code: "custom", path: ["status"], message: "Only a missing result contains confirmed missing items." });
  }
  if (check.missingCookware.some((item) => !check.requiredCookware.includes(item)) ||
      check.missingHeatSources.some((item) => !check.requiredHeatSources.includes(item))) {
    ctx.addIssue({ code: "custom", message: "Missing items must be candidate requirements." });
  }
});

export const InventoryProposalSchema = z.strictObject({
  kind: z.literal("replace_equipment"),
  // Ground in a current user message; never infer ownership from a recipe.
  basedOnMessageId: IdSchema,
  evidenceQuote: z.string().trim().min(1).max(limits.maxMessageCharacters),
  equipment: ConfirmedEquipmentSchema,
});

export const ChatSuccessSchema = z.strictObject({
  ok: z.literal(true),
  requestId: IdSchema,
  sessionId: IdSchema,
  sessionRevision: RevisionSchema,
  message: AssistantMessageSchema,
  allergenNotice: z.literal(ALLERGEN_NOTICE),
  sources: z.array(SourceSchema).max(limits.maxSources),
  equipmentChecks: z.array(EquipmentCheckSchema).max(limits.maxEquipmentChecks),
  inventoryProposal: InventoryProposalSchema.nullable(),
  metrics: z.strictObject({
    durationMs: z.number().nonnegative(),
    usage: z.strictObject({
      inputTokens: z.number().int().nonnegative(),
      outputTokens: z.number().int().nonnegative(),
    }).nullable(),
  }),
});

export const ERROR_HTTP_STATUS = {
  INVALID_REQUEST: 400,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  CONFIGURATION_ERROR: 503,
  UPSTREAM_ERROR: 502,
  TIMEOUT: 504,
  CANCELLED: 499,
  INTERNAL_ERROR: 500,
} as const;

export const ChatErrorCodeSchema = z.enum([
  "INVALID_REQUEST", "PAYLOAD_TOO_LARGE", "RATE_LIMITED", "CONFIGURATION_ERROR",
  "UPSTREAM_ERROR", "TIMEOUT", "CANCELLED", "INTERNAL_ERROR",
]);

export const ChatFailureSchema = z.strictObject({
  ok: z.literal(false),
  // Null when the request could not be validated; never echo arbitrary input.
  requestId: IdSchema.nullable(),
  sessionId: IdSchema.nullable(),
  sessionRevision: RevisionSchema.nullable(),
  error: z.strictObject({
    code: ChatErrorCodeSchema,
    message: z.string().trim().min(1).max(limits.maxMessageCharacters),
    retryable: z.boolean(),
  }),
  allergenNotice: z.literal(ALLERGEN_NOTICE),
});

export const ChatResponseSchema = z.discriminatedUnion("ok", [ChatSuccessSchema, ChatFailureSchema]);

export type Equipment = z.infer<typeof EquipmentSchema>;
export type SessionProfile = z.infer<typeof SessionProfileSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type EquipmentCheck = z.infer<typeof EquipmentCheckSchema>;
export type InventoryProposal = z.infer<typeof InventoryProposalSchema>;
export type ChatSuccess = z.infer<typeof ChatSuccessSchema>;
export type ChatFailure = z.infer<typeof ChatFailureSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
