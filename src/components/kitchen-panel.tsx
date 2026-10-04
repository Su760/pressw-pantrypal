import { CHAT_LIMITS, type SessionProfile } from "@/lib/contracts/chat";
import type { KitchenDraft } from "@/lib/client/use-chat";
import { KitchenIcon } from "@/components/kitchen-icon";

type Props = {
  draft: KitchenDraft;
  profile: SessionProfile;
  dirty: boolean;
  error: string;
  unresolved: boolean;
  onEdit: (patch: Partial<KitchenDraft>) => void;
  onSave: () => void;
};
const fieldLimit = CHAT_LIMITS.maxProfileItems * (CHAT_LIMITS.maxLabelCharacters + 1);

export function KitchenPanel({ draft, profile, dirty, error, unresolved, onEdit, onSave }: Props) {
  const equipment = profile.equipment;
  const equipmentSummary = equipment.status === "unknown" ? "Unknown — nothing assumed" :
    "Cookware: " + (equipment.cookware.join(", ") || "none") + ". Heat: " + (equipment.heatSources.join(", ") || "none") + ".";
  return <form className="kitchen-form" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
    <div className="kitchen-sections">
      <p className="kitchen-intro">A good starting point: your actual kitchen. Add as much as you know.</p>
      <details className="kitchen-section" open>
        <summary><span className="section-title"><KitchenIcon name="pot" /><span>Equipment</span><KitchenIcon name="chevron" /></span>
          <span className="saved-summary">Saved: {equipmentSummary}</span></summary>
        <div className="section-fields">
          <label className="check-label"><input type="checkbox" checked={draft.equipmentKnown} onChange={(e) => onEdit({ equipmentKnown: e.target.checked })} />I’m ready to confirm my equipment</label>
          <p className="field-hint">{draft.equipmentKnown ? "List both categories, or explicitly choose none. Blank is not none." : "Unknown equipment is okay. You can still ask cooking questions."}</p>
          <fieldset disabled={!draft.equipmentKnown}>
            <legend>Equipment</legend>
            <label htmlFor="cookware">Cookware & utensils</label>
            <textarea id="cookware" rows={2} value={draft.cookware} disabled={draft.noCookware} maxLength={fieldLimit} placeholder={"e.g. frying pan\nwooden spoon"} onChange={(e) => onEdit({ cookware: e.target.value })} aria-describedby="equipment-format" />
            <label className="check-label"><input type="checkbox" checked={draft.noCookware} onChange={(e) => onEdit({ noCookware: e.target.checked, cookware: "" })} />I have no cookware or utensils</label>
            <label htmlFor="heat-sources">Heat sources</label>
            <textarea id="heat-sources" rows={2} value={draft.heatSources} disabled={draft.noHeatSources} maxLength={fieldLimit} placeholder={"e.g. hot plate\nmicrowave"} onChange={(e) => onEdit({ heatSources: e.target.value })} aria-describedby="equipment-format" />
            <label className="check-label"><input type="checkbox" checked={draft.noHeatSources} onChange={(e) => onEdit({ noHeatSources: e.target.checked, heatSources: "" })} />I have no heat sources</label>
          </fieldset>
          <p className="field-hint" id="equipment-format">One item per line. Your own names are welcome.</p>
        </div>
      </details>
      <details className="kitchen-section">
        <summary><span className="section-title"><KitchenIcon name="spoon" /><span>Preferences</span><KitchenIcon name="chevron" /></span>
          <span className="saved-summary">Saved: {profile.preferences.join(", ") || "no preferences yet"}</span></summary>
        <div className="section-fields">
          <label htmlFor="preferences">Cooking preferences <span>(optional)</span></label>
          <textarea id="preferences" rows={3} value={draft.preferences} maxLength={fieldLimit} placeholder={"e.g. quick meals\nless washing up"} onChange={(e) => onEdit({ preferences: e.target.value })} aria-describedby="profile-format" />
        </div>
      </details>
      <details className="kitchen-section">
        <summary><span className="section-title"><KitchenIcon name="leaf" /><span>Leave out</span><KitchenIcon name="chevron" /></span>
          <span className="saved-summary">Saved: {profile.ingredientExclusions.join(", ") || "no ingredient exclusions yet"}</span></summary>
        <div className="section-fields">
          <label htmlFor="exclusions">Ingredients to leave out <span>(optional)</span></label>
          <textarea id="exclusions" rows={3} value={draft.ingredientExclusions} maxLength={fieldLimit} placeholder={"e.g. peanuts\nsesame"} onChange={(e) => onEdit({ ingredientExclusions: e.target.value })} aria-describedby="profile-format exclusion-hint" />
          <p className="field-hint" id="exclusion-hint">Explicit exclusions only; not medical advice or a guarantee of allergy safety.</p>
        </div>
      </details>
      <p className="field-hint field-limits" id="profile-format">One item per line. Up to {CHAT_LIMITS.maxProfileItems} per field, {CHAT_LIMITS.maxLabelCharacters} characters each.</p>
    </div>
    <div className="kitchen-save-area">
      {error && <p className="inline-error" role="alert">{error}</p>}
      {unresolved && <p className="inline-note">An equipment correction needs your confirmation. Review the complete kitchen before continuing.</p>}
      <p className="save-state"><span className={dirty ? "state-dot unsaved" : "state-dot"} aria-hidden="true" />{dirty ? "Unsaved changes — chat is paused" : "Your saved setup, for this session"}</p>
      <button className="primary kitchen-save" type="submit" disabled={!dirty && !unresolved}>Confirm kitchen<KitchenIcon name="arrow" /></button>
    </div>
  </form>;
}
