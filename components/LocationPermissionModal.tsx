"use client";

type LocationPermissionModalProps = {
  onAllow: () => void;
  onDeny: () => void;
};

export default function LocationPermissionModal({
  onAllow,
  onDeny,
}: LocationPermissionModalProps) {
  return (
    <div className="location-modal" role="dialog" aria-modal="true" aria-label="Location access">
      <div className="location-modal__card">
        <h2 className="location-modal__title">Allow location access?</h2>
        <p className="location-modal__text">
          Share your precise GPS location to center the map on your position. You can
          then follow your location as you move.
        </p>
        <div className="location-modal__actions">
          <button type="button" className="button button--primary" onClick={onAllow}>
            Allow GPS
          </button>
          <button type="button" className="button" onClick={onDeny}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
