"use client";

import { useEffect, useRef, useState } from "react";
import {
  CHAT_LIMITS,
  ChatRequestSchema,
  ChatResponseSchema,
  ERROR_HTTP_STATUS,
  SessionProfileSchema,
  type ChatMessage,
  type ChatSuccess,
  type InventoryProposal,
  type SessionProfile,
} from "@/lib/contracts/chat";

export type KitchenDraft = {
  equipmentKnown: boolean;
  cookware: string;
  heatSources: string;
  noCookware: boolean;
  noHeatSources: boolean;
  preferences: string;
  ingredientExclusions: string;
};
export type Turn = {
  message: ChatMessage;
  response?: ChatSuccess;
  revision: number;
};
type Problem = { message: string; retryable: boolean };
type State = {
  sessionId: string;
  revision: number;
  acknowledged: boolean;
  profile: SessionProfile;
  kitchen: KitchenDraft;
  kitchenDirty: boolean;
  kitchenError: string;
  draft: string;
  turns: Turn[];
  loading: boolean;
  error: Problem | null;
  proposal: InventoryProposal | null;
  correctionUnresolved: boolean;
  status: string;
};
type Attempt = {
  sessionId: string;
  revision: number;
  requestId: string;
  controller: AbortController;
};
const emptyKitchen = (): KitchenDraft => ({
  equipmentKnown: false,
  cookware: "",
  heatSources: "",
  noCookware: false,
  noHeatSources: false,
  preferences: "",
  ingredientExclusions: "",
});
const initialState = (): State => ({
  sessionId: "",
  revision: 0,
  acknowledged: false,
  profile: {
    equipment: { status: "unknown" },
    preferences: [],
    ingredientExclusions: [],
  },
  kitchen: emptyKitchen(),
  kitchenDirty: false,
  kitchenError: "",
  draft: "",
  turns: [],
  loading: false,
  error: null,
  proposal: null,
  correctionUnresolved: false,
  status: "Ready when you are. Acknowledge that you are an adult to begin.",
});
const labels = (text: string) =>
  text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
function draftFromProfile(profile: SessionProfile): KitchenDraft {
  const equipment = profile.equipment;
  return {
    equipmentKnown: equipment.status === "confirmed",
    cookware:
      equipment.status === "confirmed" ? equipment.cookware.join("\n") : "",
    heatSources:
      equipment.status === "confirmed" ? equipment.heatSources.join("\n") : "",
    noCookware:
      equipment.status === "confirmed" && equipment.cookware.length === 0,
    noHeatSources:
      equipment.status === "confirmed" && equipment.heatSources.length === 0,
    preferences: profile.preferences.join("\n"),
    ingredientExclusions: profile.ingredientExclusions.join("\n"),
  };
}

export function useChat() {
  const [state, setState] = useState(initialState);
  // Event handlers update this snapshot synchronously, before React's next render.
  const current = useRef(state);
  const active = useRef<Attempt | null>(null);
  function update(patch: Partial<State>) {
    current.current = { ...current.current, ...patch };
    setState(current.current);
  }
  function invalidate() {
    const previous = active.current;
    active.current = null;
    previous?.controller.abort();
  }
  function isCurrent(attempt: Attempt) {
    return (
      active.current?.requestId === attempt.requestId &&
      current.current.sessionId === attempt.sessionId &&
      current.current.revision === attempt.revision
    );
  }
  useEffect(
    () => () => {
      const previous = active.current;
      active.current = null;
      previous?.controller.abort();
    },
    [],
  );

  function editKitchen(patch: Partial<KitchenDraft>) {
    invalidate();
    const s = current.current;
    update({
      kitchen: { ...s.kitchen, ...patch },
      kitchenDirty: true,
      kitchenError: "",
      revision: s.revision + 1,
      loading: false,
      error: null,
      proposal: null,
      status: "Kitchen changes are unsaved. Confirm them before continuing.",
    });
  }
  function saveKitchen() {
    invalidate();
    const s = current.current;
    const d = s.kitchen;
    if (s.correctionUnresolved && !d.equipmentKnown) {
      update({
        kitchenError:
          "Confirm your complete cookware and heat sources to resolve the correction.",
      });
      return;
    }
    if (
      d.equipmentKnown &&
      ((!labels(d.cookware).length && !d.noCookware) ||
        (!labels(d.heatSources).length && !d.noHeatSources))
    ) {
      update({
        kitchenError:
          "List both equipment categories, or explicitly choose none for each empty category.",
      });
      return;
    }
    const parsed = SessionProfileSchema.safeParse({
      equipment: d.equipmentKnown
        ? {
            status: "confirmed",
            cookware: d.noCookware ? [] : labels(d.cookware),
            heatSources: d.noHeatSources ? [] : labels(d.heatSources),
          }
        : { status: "unknown" },
      preferences: labels(d.preferences),
      ingredientExclusions: labels(d.ingredientExclusions),
    });
    if (!parsed.success) {
      update({
        kitchenError: `Use at most ${CHAT_LIMITS.maxProfileItems} items per field, each at most ${CHAT_LIMITS.maxLabelCharacters} characters.`,
      });
      return;
    }
    update({
      profile: parsed.data,
      kitchen: draftFromProfile(parsed.data),
      kitchenDirty: false,
      kitchenError: "",
      revision: s.revision + 1,
      loading: false,
      error: null,
      proposal: null,
      correctionUnresolved: false,
      status:
        "Kitchen saved. Earlier equipment checks belong to the older setup.",
    });
  }
  function confirmProposal() {
    const s = current.current;
    if (!s.proposal) return;
    invalidate();
    const profile = { ...s.profile, equipment: s.proposal.equipment };
    update({
      profile,
      kitchen: draftFromProfile(profile),
      kitchenDirty: false,
      kitchenError: "",
      revision: s.revision + 1,
      loading: false,
      error: null,
      proposal: null,
      correctionUnresolved: false,
      status: "Equipment replaced. Ask again for a check against this kitchen.",
    });
  }
  function editProposal() {
    const s = current.current;
    if (!s.proposal) return;
    editKitchen(
      draftFromProfile({ ...s.profile, equipment: s.proposal.equipment }),
    );
  }
  function dismissProposal() {
    update({
      proposal: null,
      status:
        "Proposal dismissed. Your saved kitchen is unchanged. Confirm your kitchen to clarify the conflicting equipment before continuing.",
    });
  }
  function acknowledge(value: boolean) {
    invalidate();
    update({
      acknowledged: value,
      loading: false,
      error: null,
      status: value
        ? "Ready to talk cooking."
        : "Acknowledge that you are an adult to continue.",
    });
  }
  function clearSession() {
    invalidate();
    current.current = {
      ...initialState(),
      sessionId: crypto.randomUUID(),
      status:
        "Session cleared. All conversation and kitchen details have been removed from this page.",
    };
    setState(current.current);
  }
  function cancel() {
    invalidate();
    update({
      loading: false,
      error: {
        message: "Request cancelled. You can retry this same message.",
        retryable: true,
      },
      status: "Request cancelled.",
    });
  }
  async function send(retry = false) {
    let s = current.current;
    if (
      active.current ||
      !s.acknowledged ||
      s.kitchenDirty ||
      s.correctionUnresolved
    )
      return;
    const hasPending = s.turns.at(-1)?.message.role === "user";
    if (retry !== hasPending || (retry && s.error && !s.error.retryable))
      return;
    if (!s.sessionId) {
      update({ sessionId: crypto.randomUUID() });
      s = current.current;
    }
    const turns: Turn[] = retry
      ? s.turns
      : [
          ...s.turns,
          {
            message: {
              id: crypto.randomUUID(),
              role: "user",
              content: s.draft.trim(),
            },
            revision: s.revision,
          },
        ];
    const requestId = crypto.randomUUID();
    const parsed = ChatRequestSchema.safeParse({
      requestId,
      sessionId: s.sessionId,
      sessionRevision: s.revision,
      adultAcknowledged: s.acknowledged,
      profile: s.profile,
      messages: turns.map((turn) => turn.message),
    });
    if (!parsed.success) {
      update({
        error: {
          message:
            turns.length > CHAT_LIMITS.maxMessages
              ? `This session has reached its ${CHAT_LIMITS.maxMessages}-message history limit. Clear session to start fresh; nothing has been dropped.`
              : `Enter a message of 1–${CHAT_LIMITS.maxMessageCharacters.toLocaleString()} characters. If this session is full, use Clear session.`,
          retryable: false,
        },
      });
      return;
    }
    const body = JSON.stringify(parsed.data);
    if (
      new TextEncoder().encode(body).byteLength > CHAT_LIMITS.maxRequestBytes
    ) {
      update({
        error: {
          message: `This conversation and kitchen exceed the ${CHAT_LIMITS.maxRequestBytes.toLocaleString()}-byte request limit. Shorten your unsent message or kitchen details, or Clear session. No history was removed.`,
          retryable: false,
        },
      });
      return;
    }
    const attempt: Attempt = {
      sessionId: s.sessionId,
      revision: s.revision,
      requestId,
      controller: new AbortController(),
    };
    active.current = attempt;
    update({
      turns,
      draft: retry ? s.draft : "",
      error: null,
      loading: true,
      status: "PantryPal is working on your answer…",
    });
    const timer = setTimeout(() => {
      if (!isCurrent(attempt)) return;
      invalidate();
      update({
        loading: false,
        error: {
          message:
            "The answer took too long. Retry this message when you are ready.",
          retryable: true,
        },
        status: "Request timed out.",
      });
    }, CHAT_LIMITS.requestTimeoutMs);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: attempt.controller.signal,
        cache: "no-store",
      });
      if (!isCurrent(attempt)) return;
      if (response.status === 404 || response.status === 405) {
        update({
          error: {
            message:
              "Chat is not available on this server yet. Your message is kept here; retry once the service is available.",
            retryable: true,
          },
          status: "Chat service unavailable.",
        });
        return;
      }
      const result = ChatResponseSchema.safeParse(await response.json());
      if (!isCurrent(attempt)) return;
      if (!result.success) throw new Error("Invalid response");
      const data = result.data;
      if (
        (data.requestId !== null && data.requestId !== requestId) ||
        (data.sessionId !== null && data.sessionId !== attempt.sessionId) ||
        (data.sessionRevision !== null &&
          data.sessionRevision !== attempt.revision)
      )
        throw new Error("Mismatched response");
      if (!data.ok) {
        if (response.status !== ERROR_HTTP_STATUS[data.error.code])
          throw new Error("Invalid error status");
        update({
          error: {
            message: data.error.message,
            retryable: data.error.retryable,
          },
          status: "The request could not be completed.",
        });
        return;
      }
      if (
        response.status !== 200 ||
        turns.some(
          (turn) => turn.message.id.toLowerCase() === data.message.id.toLowerCase(),
        )
      )
        throw new Error("Invalid success");
      if (data.inventoryProposal) {
        const proposal = data.inventoryProposal;
        const evidence = turns.find(
          (turn) => turn.message.id === proposal.basedOnMessageId,
        )?.message;
        if (
          evidence?.role !== "user" ||
          !evidence.content.includes(proposal.evidenceQuote)
        )
          throw new Error("Invalid proposal evidence");
      }
      update({
        turns: [
          ...turns,
          { message: data.message, response: data, revision: attempt.revision },
        ],
        proposal: data.inventoryProposal,
        correctionUnresolved: data.inventoryProposal !== null,
        status: data.inventoryProposal
          ? "Answer received. Review the proposed kitchen replacement."
          : "Answer received.",
      });
    } catch {
      if (!isCurrent(attempt)) return;
      update({
        error: {
          message:
            "The connection failed or the server returned an invalid response. Your message is kept here. Retry to try again.",
          retryable: true,
        },
        status: "No answer received.",
      });
    } finally {
      clearTimeout(timer);
      if (isCurrent(attempt)) {
        active.current = null;
        update({ loading: false });
      }
    }
  }
  return {
    state,
    setDraft: (draft: string) => update({ draft }),
    editKitchen,
    saveKitchen,
    confirmProposal,
    editProposal,
    dismissProposal,
    acknowledge,
    clearSession,
    cancel,
    send,
  };
}
