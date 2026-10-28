"use client";

import { useState } from "react";
import { ICON_TYPES, type IconType } from "@/lib/types";

export type MarkerDraft = { lat: number; lng: number };

type Props = {
  draft: MarkerDraft;
  onSave: (values: { name: string; description: string; icon: IconType }) => void;
  onCancel: () => void;
};

export default function MarkerForm({ draft, onSave, onCancel }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<IconType>("fish");

  return (
    <form
      className="marker-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ name: name.trim(), description: description.trim(), icon });
      }}
    >
      <h2 className="marker-form__title">New marker</h2>
      <p className="marker-form__coords">
        {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
      </p>

      <label className="marker-form__field">
        <span>Name</span>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Snaggy rocks"
        />
      </label>

      <label className="marker-form__field">
        <span>Description</span>
        <textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Notes about this spot"
        />
      </label>

      <label className="marker-form__field">
        <span>Icon</span>
        <select value={icon} onChange={(event) => setIcon(event.target.value as IconType)}>
          {ICON_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="marker-form__actions">
        <button type="submit" className="button button--primary" disabled={name.length === 0}>
          Save
        </button>
        <button type="button" className="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
