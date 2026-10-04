import { randomUUID } from "node:crypto";
import {
  generateText,
  isStepCount,
  Output,
  APICallError,
  NoObjectGeneratedError,
  NoOutputGeneratedError,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import {
  ALLERGEN_NOTICE,
  CHAT_LIMITS as limits,
  ChatSuccessSchema,
  InventoryProposalSchema,
  type ChatRequest,
  type ChatSuccess,
} from "../contracts/chat";
import serverConfig from "../../../config/server.json";
import { ChatError } from "./errors";
import {
  boundaryReply,
  inventoryConflict,
  SYSTEM_POLICY,
  validProposal,
} from "./policy";
import { createCookingTools, type CheckedRecipe } from "./tools";

const OutputSchema = z.object({
  reply: z.string().min(1).max(limits.maxMessageCharacters),
  candidateNumbers: z.array(z.number().int().min(1).max(limits.maxEquipmentChecks)).max(limits.maxDisplayedRecipes),
  inventoryNeedsConfirmation: z.boolean(),
  inventoryProposal: InventoryProposalSchema.nullable(),
});

function configured(value: string | undefined) {
  return value && !value.startsWith("replace_with_") ? value : undefined;
}

function renderRecipe({ recipe, check }: CheckedRecipe) {
  const assessment =
    check.status === "feasible"
      ? "Equipment matches the listed requirements; ingredient availability still needs your confirmation."
      : check.status === "missing"
        ? `Equipment missing: ${[...check.missingCookware, ...check.missingHeatSources].join(", ")}. This method is not feasible with your confirmed inventory.`
        : "Equipment is unverified. Confirm your cookware and heat sources before relying on this method.";
  return [
    recipe.name,
    assessment,
    `Cookware required: ${recipe.requiredCookware.join(", ") || "none listed"}. Heat sources required: ${recipe.requiredHeatSources.join(", ") || "none listed"}.`,
    "Ingredients (confirm you have every item):",
    ...recipe.ingredients.map((item) => `- ${item}`),
    "Method:",
    ...recipe.steps.map((step, i) => `${i + 1}. ${step}`),
  ].join("\n");
}

export async function answerChat(
  request: ChatRequest,
  signal: AbortSignal,
  started: number,
): Promise<ChatSuccess> {
  const response = (content: string, extra: Partial<ChatSuccess> = {}) =>
    ChatSuccessSchema.parse({
      ok: true,
      requestId: request.requestId,
      sessionId: request.sessionId,
      sessionRevision: request.sessionRevision,
      message: { id: randomUUID(), role: "assistant", content },
      allergenNotice: ALLERGEN_NOTICE,
      sources: [],
      equipmentChecks: [],
      inventoryProposal: null,
      metrics: {
        durationMs: Math.round(performance.now() - started),
        usage: null,
      },
      ...extra,
    });
  const boundary = boundaryReply(request);
  if (boundary) return response(boundary);
  const apiKey = configured(process.env.OPENAI_API_KEY);
  const modelId = process.env.OPENAI_MODEL?.trim() || serverConfig.defaultModel;
  if (!apiKey || !configured(modelId))
    throw new ChatError("CONFIGURATION_ERROR");
  const provider = createOpenAI({ apiKey });
  const execution = createCookingTools(
    request,
    signal,
    configured(process.env.TAVILY_API_KEY),
  );
  try {
    const result = await generateText({
      model: provider.responses(modelId),
      system: SYSTEM_POLICY,
      prompt: JSON.stringify({
        profile: request.profile,
        messages: request.messages,
      }),
      tools: execution.tools,
      stopWhen: isStepCount(limits.maxModelSteps),
      prepareStep: ({ stepNumber }) =>
        stepNumber >= limits.maxModelSteps - 1 ||
        execution.counts.total >= limits.maxToolCalls
          ? { toolChoice: "none" as const }
          : {},
      output: Output.object({ schema: OutputSchema }),
      maxOutputTokens: limits.maxOutputTokens,
      maxRetries: 0,
      abortSignal: signal,
      providerOptions: { openai: { store: false } },
      telemetry: { isEnabled: false },
      onStepEnd: (step) => {
        console.info(
          JSON.stringify({
            event: "pantrypal_step",
            requestId: request.requestId,
            step: step.stepNumber,
            finishReason: step.finishReason,
            toolCalls: step.toolCalls.length,
            inputTokens: step.usage.inputTokens,
            outputTokens: step.usage.outputTokens,
          }),
        );
      },
    });
    signal.throwIfAborted();
    const output = result.output;
    const proposal = output.inventoryProposal;
    if (proposal && !validProposal(proposal, request)) {
      output.inventoryProposal = null;
      output.inventoryNeedsConfirmation = true;
    }
    const conflict =
      inventoryConflict(request) ||
      output.inventoryNeedsConfirmation ||
      proposal !== null;
    const selected: CheckedRecipe[] = [];
    for (const number of new Set(output.candidateNumbers)) {
      const entry = [...execution.recipes.values()][number - 1];
      if (!entry) throw new ChatError("UPSTREAM_ERROR");
      if (!conflict) selected.push(entry);
    }
    let content = conflict
      ? "Please confirm or edit your complete cookware and heat-source inventory. I won't verify a recipe against equipment you've corrected until you confirm the replacement."
      : [output.reply, ...selected.map(renderRecipe)].join("\n\n");
    if (execution.searchOutcomes.some((outcome) => outcome !== "success")) {
      content +=
        "\n\nOnline search was unavailable, incomplete, or returned no usable results. Any available source links below are only the results actually retrieved.";
    }
    const usage = result.totalUsage;
    const metrics = {
      durationMs: Math.round(performance.now() - started),
      usage:
        typeof usage.inputTokens === "number" &&
        typeof usage.outputTokens === "number"
          ? { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens }
          : null,
    };
    console.info(
      JSON.stringify({
        event: "pantrypal_request",
        requestId: request.requestId,
        durationMs: metrics.durationMs,
        usage: metrics.usage,
        toolExecutions: execution.counts,
      }),
    );
    return response(content, {
      sources: [...execution.sources.values()],
      equipmentChecks: selected.map((entry) => entry.check),
      inventoryProposal: output.inventoryProposal,
      metrics,
    });
  } catch (error) {
    console.info(
      JSON.stringify({
        event: "pantrypal_failure",
        requestId: request.requestId,
        kind: APICallError.isInstance(error)
          ? "provider"
          : NoObjectGeneratedError.isInstance(error)
            ? "structured_output"
            : NoOutputGeneratedError.isInstance(error)
              ? "no_output"
              : error instanceof ChatError
                ? error.code
                : "validation_or_generation",
        providerStatus: APICallError.isInstance(error)
          ? error.statusCode
          : undefined,
        finishReason: NoObjectGeneratedError.isInstance(error)
          ? error.finishReason
          : undefined,
        durationMs: Math.round(performance.now() - started),
        toolExecutions: execution.counts,
      }),
    );
    signal.throwIfAborted();
    if (error instanceof ChatError || APICallError.isInstance(error))
      throw error;
    throw new ChatError("UPSTREAM_ERROR");
  }
}
