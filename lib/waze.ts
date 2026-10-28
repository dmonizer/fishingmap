"use client";

/**
 * True when the current user agent is an Android device. The Waze deep link
 * behaves differently on Android (intent:// URL) than on iOS/desktop
 * (https://waze.com/ul?...).
 */
export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

/**
 * Builds a Waze "navigate here" URL for the given coordinates.
 * On Android the `intent://` form reliably launches the Waze app when it is
 * installed; on other platforms the standard `waze://` / `https://waze.com/ul`
 * deep link is used.
 */
export function wazeNavigateUrl(lat: number, lng: number): string {
  const ll = `${lat},${lng}`;
  if (isAndroid()) {
    return (
      `intent://waze?ll=${ll}&navigate=yes#Intent;` +
      `scheme=waze;package=com.waze;end`
    );
  }
  return `https://waze.com/ul?ll=${ll}&navigate=yes`;
}
