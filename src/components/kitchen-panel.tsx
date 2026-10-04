import { CHAT_LIMITS } from "@/lib/contracts/chat";
import type { KitchenDraft } from "@/lib/client/use-chat";

type Props = {
  draft: KitchenDraft;
  dirty: boolean;
  error: string;
  unresolved: boolean;
  onEdit: (patch: Partial<KitchenDraft>) => void;
  onSave: () => void;
};
const fieldLimit =
  CHAT_LIMITS.maxProfileItems * (CHAT_LIMITS.maxLabelCharacters + 1);
export function KitchenPanel({
  draft,
  dirty,
  error,
  unresolved,
  onEdit,
  onSave,
}: Props) {
  return (
    <form
      className="kitchen-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <p className="muted">
        Tell us what you actually have. No starter kitchen assumed.
      </p>
      <label className="check-label">
        <input
          type="checkbox"
          checked={draft.equipmentKnown}
          onChange={(e) => onEdit({ equipmentKnown: e.target.checked })}
        />
        I’m ready to confirm my equipment
      </label>
      <p className="field-hint">
        {draft.equipmentKnown
          ? "Confirm both categories below. Blank is not the same as none."
          : "Equipment is unknown. You can still ask cooking questions."}
      </p>
      <fieldset disabled={!draft.equipmentKnown}>
        <legend>Equipment</legend>
        <label htmlFor="cookware">Cookware & utensils</label>
        <textarea
          id="cookware"
          rows={3}
          value={draft.cookware}
          disabled={draft.noCookware}
          maxLength={fieldLimit}
          placeholder={"e.g. frying pan\nwooden spoon"}
          onChange={(e) => onEdit({ cookware: e.target.value })}
          aria-describedby="equipment-format"
        />
        <label className="check-label">
          <input
            type="checkbox"
            checked={draft.noCookware}
            onChange={(e) =>
              onEdit({ noCookware: e.target.checked, cookware: "" })
            }
          />
          I have no cookware or utensils
        </label>
        <label htmlFor="heat-sources">Heat sources</label>
        <textarea
          id="heat-sources"
          rows={2}
          value={draft.heatSources}
          disabled={draft.noHeatSources}
          maxLength={fieldLimit}
          placeholder={"e.g. hot plate\nmicrowave"}
          onChange={(e) => onEdit({ heatSources: e.target.value })}
          aria-describedby="equipment-format"
        />
        <label className="check-label">
          <input
            type="checkbox"
            checked={draft.noHeatSources}
            onChange={(e) =>
              onEdit({ noHeatSources: e.target.checked, heatSources: "" })
            }
          />
          I have no heat sources
        </label>
      </fieldset>
      <p className="field-hint" id="equipment-format">
        One item per line. Use your own names.
      </p>
      <label htmlFor="preferences">
        Cooking preferences <span>(optional)</span>
      </label>
      <textarea
        id="preferences"
        rows={2}
        value={draft.preferences}
        maxLength={fieldLimit}
        placeholder={"e.g. quick meals\nless washing up"}
        onChange={(e) => onEdit({ preferences: e.target.value })}
        aria-describedby="profile-format"
      />
      <label htmlFor="exclusions">
        Ingredients to leave out <span>(optional)</span>
      </label>
      <textarea
        id="exclusions"
        rows={2}
        value={draft.ingredientExclusions}
        maxLength={fieldLimit}
        placeholder={"e.g. peanuts\nsesame"}
        onChange={(e) => onEdit({ ingredientExclusions: e.target.value })}
        aria-describedby="profile-format exclusion-hint"
      />
      <p className="field-hint" id="exclusion-hint">
        Explicit exclusions only; this is not medical advice or a guarantee of
        allergy safety.
      </p>
      <p className="field-hint" id="profile-format">
        One item per line. Up to {CHAT_LIMITS.maxProfileItems} per field,{" "}
        {CHAT_LIMITS.maxLabelCharacters} characters each.
      </p>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {unresolved && (
        <p className="inline-note">
          There’s an equipment correction to resolve. Confirm your complete
          kitchen before continuing.
        </p>
      )}
      <button
        className="primary kitchen-save"
        type="submit"
        disabled={!dirty && !unresolved}
      >
        Confirm kitchen
      </button>
      <p className="field-hint">
        {dirty
          ? "Unsaved changes — chat is paused."
          : "Changes apply to this session only."}
      </p>
    </form>
  );
}
