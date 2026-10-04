import { ALLERGEN_NOTICE } from "@/lib/contracts/chat";
import { KitchenIcon } from "@/components/kitchen-icon";
import type { Turn } from "@/lib/client/use-chat";

export function ChatAnswer({
  turn,
  revision,
  unresolved,
}: {
  turn: Turn;
  revision: number;
  unresolved: boolean;
}) {
  const response = turn.response;
  if (!response) return null;
  const old = turn.revision !== revision;
  const pending = unresolved || response.inventoryProposal !== null;
  return (
    <article className="turn assistant-turn" aria-label="PantryPal response">
      <p className="speaker"><span className="answer-mark"><KitchenIcon /></span>PantryPal</p>
      <div className="message-content">{response.message.content}</div>
      {response.equipmentChecks.length > 0 ? (
        <section className="equipment-results" aria-label="Equipment checks">
          <h3><KitchenIcon name="pot" />Equipment checks</h3>
          {old && (
            <p className="inline-note">
              Older kitchen setup — these checks do not verify your current
              equipment.
            </p>
          )}
          {!old && pending && (
            <p className="inline-note">
              Equipment correction pending — confirm your kitchen and request a
              fresh check.
            </p>
          )}
          {response.equipmentChecks.map((check, index) => (
            <div
              className="equipment-result"
              key={`${check.candidateId}-${index}`}
            >
              <div className="check-heading">
                <strong>{check.candidateName}</strong>
                <span
                  className={`check-status ${old || pending ? "neutral" : check.status}`}
                >
                  {old
                    ? "Earlier check"
                    : pending
                      ? "Needs confirmation"
                      : check.status === "feasible"
                        ? "Equipment matches"
                        : check.status === "missing"
                          ? "Equipment missing"
                          : "Needs clarification"}
                </span>
              </div>
              <p>
                Cookware needed:{" "}
                {check.requiredCookware.join(", ") || "None listed"}
              </p>
              <p>
                Heat needed:{" "}
                {check.requiredHeatSources.join(", ") || "None listed"}
              </p>
              {check.status === "missing" && (
                <p>
                  Missing at time of check:{" "}
                  {[...check.missingCookware, ...check.missingHeatSources].join(
                    ", ",
                  )}
                </p>
              )}
            </div>
          ))}
        </section>
      ) : (
        <p className="field-hint">
          No equipment check was returned with this answer.
        </p>
      )}
      {response.sources.length > 0 && (
        <section className="sources" aria-label="Sources">
          <h3><KitchenIcon name="book" />Sources</h3>
          <ul>
            {response.sources.map((source, index) => (
              <li key={`${source.url}-${index}`}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}<KitchenIcon name="arrow" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="allergen-notice">{ALLERGEN_NOTICE}</p>
    </article>
  );
}
