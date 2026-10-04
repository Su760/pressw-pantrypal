"use client";

import { useEffect, useRef, useState } from "react";
import { ALLERGEN_NOTICE, CHAT_LIMITS } from "@/lib/contracts/chat";
import { useChat } from "@/lib/client/use-chat";
import { KitchenPanel } from "@/components/kitchen-panel";
import { ChatAnswer } from "@/components/chat-answer";
import { KitchenIcon } from "@/components/kitchen-icon";

export default function Home() {
  const chat = useChat();
  const { state } = chat;
  const [kitchenOpen, setKitchenOpen] = useState(false);
  const [newAnswer, setNewAnswer] = useState(false);
  const conversation = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const acknowledgement = useRef<HTMLInputElement>(null);
  const followLatest = useRef(true);
  const pending = state.turns.at(-1)?.message.role === "user";
  const blocked =
    !state.acknowledged || state.kitchenDirty || state.correctionUnresolved;
  const full = state.turns.length >= CHAT_LIMITS.maxMessages;

  useEffect(() => {
    const element = conversation.current;
    if (!element) return;
    if (followLatest.current)
      element.scrollTo({ top: element.scrollHeight, behavior: "instant" });
    else if (state.turns.at(-1)?.message.role === "assistant")
      setNewAnswer(true);
  }, [state.turns, state.loading]);

  function openKitchen() {
    setKitchenOpen(true);
    requestAnimationFrame(() =>
      document.getElementById("kitchen-heading")?.focus(),
    );
  }
  function clearSession() {
    chat.clearSession();
    setKitchenOpen(false);
    setNewAnswer(false);
    followLatest.current = true;
    acknowledgement.current?.focus();
  }
  function submit() {
    if (blocked || pending || state.loading || full) return;
    followLatest.current = true;
    void chat.send();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#chat-input">
        Skip to message
      </a>
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark"><KitchenIcon /></span>
          <div>PantryPal<span className="brand-caption">Your kitchen notebook</span></div>
        </div>
        <div className="header-actions">
          <span className="session-tag"><span className="state-dot" aria-hidden="true" /> Just this session</span>
          <button className="quiet" onClick={clearSession}>
            Clear session
          </button>
        </div>
      </header>
      <aside className="kitchen-sidebar" aria-label="Your kitchen">
        <button
          className="mobile-kitchen-toggle"
          aria-expanded={kitchenOpen}
          aria-controls="kitchen-body"
          onClick={() => setKitchenOpen(!kitchenOpen)}
        >
          Your kitchen{" "}
          <span>
            {state.kitchenDirty
              ? "Unsaved changes"
              : state.profile.equipment.status === "unknown"
                ? "Equipment unknown"
                : "Equipment confirmed"}{" "}
            · {kitchenOpen ? "Back to chat" : "Edit"}
          </span>
        </button>
        <div
          id="kitchen-body"
          className={`kitchen-body ${kitchenOpen ? "is-open" : ""}`}
        >
          <div className="kitchen-title">
            <h2 id="kitchen-heading" tabIndex={-1}>
              Your kitchen
            </h2>
            <span className="small-tag">
              {state.kitchenDirty
                ? "Unsaved"
                : state.profile.equipment.status === "unknown"
                  ? "Unknown"
                  : "Confirmed"}
            </span>
          </div>
          <KitchenPanel
            draft={state.kitchen}
            profile={state.profile}
            dirty={state.kitchenDirty}
            error={state.kitchenError}
            unresolved={state.correctionUnresolved}
            onEdit={chat.editKitchen}
            onSave={chat.saveKitchen}
          />
        </div>
      </aside>
      <main className="chat-main" aria-labelledby="chat-heading">
        <div className="chat-heading-row">
          <h1 id="chat-heading"><KitchenIcon name="book" />Let’s talk cooking</h1>
          <span className="small-tag">Adults-only prototype</span>
        </div>
        <div
          className="conversation"
          ref={conversation}
          role="region"
          aria-label="Conversation"
          tabIndex={0}
          onScroll={() => {
            const el = conversation.current;
            if (!el) return;
            followLatest.current =
              el.scrollHeight - el.scrollTop - el.clientHeight <=
              el.clientHeight / 4;
            if (followLatest.current) setNewAnswer(false);
          }}
        >
          {state.turns.length === 0 && (
            <section className="welcome">
              <div className="welcome-note"><span className="note-rule" />Pull up a chair.</div>
              <h2 className="welcome-heading">A little inspiration.<br />A kitchen that’s yours.</h2>
              <p>Something in the pantry, a technique to try, or tonight’s dinner. Let’s start with what you have.</p>
              <div className="starter-prompts" aria-label="Message ideas">
                {[
                  { label: "Use what’s here", detail: "Turn a few ingredients into a starting point.", icon: "leaf" as const, prompt: "What can I make with chickpeas, tomatoes, and rice?" },
                  { label: "Learn a technique", detail: "A little know-how for your next meal.", icon: "spoon" as const, prompt: "How do I build more flavor into a simple soup?" },
                  { label: "Work with my kitchen", detail: "Cooking ideas for the equipment I have.", icon: "pot" as const, prompt: "Can you help me plan a meal using my confirmed kitchen equipment? Ask me about anything you still need to know." },
                ].map(({ label, detail, icon, prompt }) => (
                  <button key={label} type="button" onClick={() => { chat.setDraft(prompt); composer.current?.focus(); }}>
                    <KitchenIcon name={icon} className="starter-icon" />
                    <span className="starter-label">{label}</span><span className="starter-detail">{detail}</span>
                    <span className="starter-action">Start a question <KitchenIcon name="arrow" /></span>
                  </button>
                ))}
              </div>
              <p className="welcome-footnote">Your kitchen notes are always editable.</p>
            </section>
          )}
          <div className="turns">
            {state.turns.map((turn) =>
              turn.message.role === "user" ? (
                <article
                  className="turn user-turn"
                  key={turn.message.id}
                  aria-label="Your message"
                >
                  <p className="speaker">You</p>
                  <div className="message-content">{turn.message.content}</div>
                </article>
              ) : (
                <ChatAnswer
                  key={turn.message.id}
                  turn={turn}
                  revision={state.revision}
                  unresolved={state.correctionUnresolved}
                />
              ),
            )}
            {state.loading && (
              <div className="loading-note">
                <span className="loading-dot" aria-hidden="true" />
                Thinking through your question…

              </div>
            )}
            {state.proposal && (
              <section className="proposal" aria-labelledby="proposal-title">
                <h2 id="proposal-title">Replace your equipment?</h2>
                <p>This replaces your entire cookware and heat-source list.</p>
                <blockquote>{state.proposal.evidenceQuote}</blockquote>
                <dl>
                  <dt>Cookware & utensils</dt>
                  <dd>
                    {state.proposal.equipment.cookware.join(", ") || "None"}
                  </dd>
                  <dt>Heat sources</dt>
                  <dd>
                    {state.proposal.equipment.heatSources.join(", ") || "None"}
                  </dd>
                </dl>
                <div className="button-row">
                  <button className="primary" onClick={chat.confirmProposal}>
                    Confirm replacement
                  </button>
                  <button
                    className="secondary"
                    onClick={() => {
                      chat.editProposal();
                      openKitchen();
                    }}
                  >
                    Edit replacement
                  </button>
                  <button
                    className="text-button"
                    onClick={chat.dismissProposal}
                  >
                    Dismiss
                  </button>
                </div>
              </section>
            )}
            {state.error && (
              <div className="error-panel" role="alert">
                <p>{state.error.message}</p>
                <p className="allergen-notice">{ALLERGEN_NOTICE}</p>
              </div>
            )}
            {pending && !state.loading && (
              <div className="pending-panel">
                <p>
                  Your last message is waiting for an answer. Retrying keeps the
                  same message.
                </p>
                <button
                  className="secondary"
                  disabled={blocked || state.error?.retryable === false}
                  onClick={() => {
                    followLatest.current = true;
                    void chat.send(true);
                  }}
                >
                  Retry last message
                </button>
                {state.error?.retryable === false && (
                  <p className="field-hint">
                    This error cannot be retried. Correct your kitchen details
                    if relevant, or clear this session.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="composer-area">
          {newAnswer && (
            <button
              className="latest-button secondary"
              onClick={() => {
                followLatest.current = true;
                setNewAnswer(false);
                conversation.current?.scrollTo({
                  top: conversation.current.scrollHeight,
                  behavior: "instant",
                });
              }}
            >
              Jump to latest answer
            </button>
          )}
          <div className="session-explanation">
            <label className="check-label">
              <input
                ref={acknowledgement}
                type="checkbox"
                checked={state.acknowledged}
                onChange={(event) => chat.acknowledge(event.target.checked)}
              />
              I am 18 or older.
            </label>
            <p>
              Session only. Refresh or Clear session removes this chat and
              kitchen from the app. Messages go to AI/search providers; clearing
              cannot undo their processing.
            </p>
          </div>
          {(state.kitchenDirty || state.correctionUnresolved) && (
            <p className="composer-warning">
              {state.kitchenDirty
                ? "Confirm your kitchen changes to continue."
                : "Resolve the equipment correction to continue."}{" "}
              <button className="text-button" onClick={openKitchen}>
                Review kitchen
              </button>
            </p>
          )}
          {full && (
            <p className="composer-warning">
              The {CHAT_LIMITS.maxMessages}-message history limit is reached.{" "}
              <button className="text-button" onClick={clearSession}>
                Clear session
              </button>{" "}
              to start fresh. Your history has not been shortened.
            </p>
          )}
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label className="sr-only" htmlFor="chat-input">
              Your cooking question
            </label>
            <textarea
              id="chat-input"
              ref={composer}
              rows={2}
              value={state.draft}
              maxLength={CHAT_LIMITS.maxMessageCharacters}
              placeholder="What’s on your mind (or in your pantry)?"
              aria-describedby="composer-hint"
              onChange={(event) => chat.setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  (event.ctrlKey || event.metaKey) &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  submit();
                }
              }}
            />
            <div className="composer-toolbar">
              <p id="composer-hint">Enter for a new line.<span> Ctrl / ⌘ + Enter to send.</span></p>
              {state.loading ? <button type="button" className="cancel-button" onClick={chat.cancel}><KitchenIcon name="stop" />Cancel request</button> :
                <button type="submit" className="primary send-button" disabled={blocked || pending || state.loading || full || !state.draft.trim()}>Send message<KitchenIcon name="arrow" /></button>}
            </div>
          </form>
          <div className="composer-footer"><span>For cooking inspiration. Always use your own judgment.</span><span>{state.draft.length.toLocaleString()} / {CHAT_LIMITS.maxMessageCharacters.toLocaleString()}</span></div>
          <p
            className="status-line"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {state.status}
          </p>
        </div>
      </main>
    </div>
  );
}
