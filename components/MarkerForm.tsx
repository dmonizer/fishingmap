"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ICON_TYPES, type IconType } from "@/lib/types";

export type MarkerDraft = {
  lat: number;
  lng: number;
  /** Click position in map-container pixels, used to anchor the bubble. */
  x: number;
  y: number;
};

type Props = {
  draft: MarkerDraft;
  onSave: (values: { name: string; description: string; icon: IconType }) => void;
  onCancel: () => void;
};

const GAP = 16;
const MARGIN = 8;
const TAIL_HALF = 8;

type Placement = {
  left: number;
  top: number;
  tailLeft: number;
  tailTop: number;
  above: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function MarkerForm({ draft, onSave, onCancel }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<IconType>("fish");
  const [placement, setPlacement] = useState<Placement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Position the bubble next to the clicked coordinate, flipping above/below
  // and clamping to the viewport so it never renders off-screen.
  useLayoutEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const width = form.offsetWidth;
    const height = form.offsetHeight;
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;

    const left = clamp(
      draft.x - width / 2,
      MARGIN,
      Math.max(MARGIN, viewWidth - width - MARGIN),
    );

    const fitsAbove = draft.y - GAP - height >= MARGIN;
    const top = clamp(
      fitsAbove ? draft.y - GAP - height : draft.y + GAP,
      MARGIN,
      Math.max(MARGIN, viewHeight - height - MARGIN),
    );

    const above = top + height <= draft.y;
    const tailCenter = clamp(draft.x - left, TAIL_HALF, width - TAIL_HALF);

    setPlacement({
      left,
      top,
      tailLeft: tailCenter - TAIL_HALF,
      tailTop: above ? height : -10,
      above,
    });
  }, [draft]);

  return (
    <form
      ref={formRef}
      className="marker-form"
      style={placement ? { left: placement.left, top: placement.top } : { visibility: "hidden" }}
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ name: name.trim(), description: description.trim(), icon });
      }}
    >
      {placement && (
        <span
          className={`marker-form__tail${placement.above ? " marker-form__tail--down" : " marker-form__tail--up"}`}
          style={{ left: placement.tailLeft, top: placement.tailTop }}
          aria-hidden="true"
        />
      )}

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
        <button type="submit" className="button button--primary" disabled={name.trim().length === 0}>
          Save
        </button>
        <button type="button" className="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
