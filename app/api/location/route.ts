import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseCoordinate(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function GET(request: Request): NextResponse {
  const headers = request.headers;
  const lat = parseCoordinate(headers.get("x-vercel-ip-latitude"));
  const lng = parseCoordinate(headers.get("x-vercel-ip-longitude"));
  const city = headers.get("x-vercel-ip-city");
  const country = headers.get("x-vercel-ip-country");
  const label = city && country ? `${safeDecode(city)}, ${country}` : null;

  return NextResponse.json({ lat, lng, label });
}
