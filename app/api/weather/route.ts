import { WEATHER_STATIONS, type WeatherReading } from "@/lib/weather";

const SOURCE_URL =
  "https://www.ilmateenistus.ee/meri/vaatlusandmed/kogu-rannik/andmed-tabelis/";

export const revalidate = 300;

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

/** "11,8" -> 11.8; empty/whitespace -> null. */
function parseEstonianNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTable(html: string): WeatherReading[] {
  const tableStart = html.indexOf('<table class="table table-compressed');
  if (tableStart === -1) return [];
  const tableEnd = html.indexOf("</table>", tableStart);
  const table = html.slice(tableStart, tableEnd);

  const tbodyStart = table.indexOf("<tbody>");
  const tbodyEnd = table.indexOf("</tbody>", tbodyStart);
  if (tbodyStart === -1 || tbodyEnd === -1) return [];
  const tbody = table.slice(tbodyStart + "<tbody>".length, tbodyEnd);

  const readings: WeatherReading[] = [];
  for (const row of tbody.split("</tr>")) {
    if (!row.includes("<td")) continue;
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) =>
      decodeHtml(stripTags(match[1])).trim(),
    );
    if (cells.length < 9) continue;

    const [name, bk77, eh2000, change, waterTemp, airTemp, windDir, windSpeed, maxWind] =
      cells;
    const coords = WEATHER_STATIONS[name];
    if (!coords) continue;

    readings.push({
      name,
      lat: coords[0],
      lng: coords[1],
      waterLevelBk77: parseEstonianNumber(bk77),
      waterLevelEh2000: parseEstonianNumber(eh2000),
      waterLevelChange24h: parseEstonianNumber(change),
      waterTemp: parseEstonianNumber(waterTemp),
      airTemp: parseEstonianNumber(airTemp),
      windDir: parseEstonianNumber(windDir),
      windSpeed: parseEstonianNumber(windSpeed),
      maxWind: parseEstonianNumber(maxWind),
    });
  }
  return readings;
}

export async function GET(): Promise<Response> {
  const response = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "fishingmap/0.1 (+https://github.com)" },
  });

  if (!response.ok) {
    return Response.json(
      { error: `Upstream returned ${response.status}` },
      { status: 502 },
    );
  }

  const html = await response.text();
  const observedAt = html.match(/UTC\s+[0-9.]+\s+[0-9:]+/)?.[0] ?? null;

  return Response.json({
    observedAt,
    stations: parseTable(html),
  });
}
