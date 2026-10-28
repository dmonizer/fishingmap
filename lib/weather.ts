export type WeatherReading = {
  name: string;
  lat: number;
  lng: number;
  waterLevelBk77: number | null;
  waterLevelEh2000: number | null;
  waterLevelChange24h: number | null;
  waterTemp: number | null;
  airTemp: number | null;
  windDir: number | null;
  windSpeed: number | null;
  maxWind: number | null;
};

/**
 * Coordinates of the 23 Estonian coastal observation stations shown on the
 * Keskkonnaagentuur (ilmateenistus.ee) "Kogu rannik" data table. Keyed by the
 * exact station name used in that table.
 */
export const WEATHER_STATIONS: Record<string, readonly [number, number]> = {
  Kihnu: [58.098639, 23.970167],
  Osmussaare: [59.303889, 23.360556],
  Vilsandi: [58.382778, 21.814222],
  Dirhami: [59.209444, 23.498333],
  "Haapsalu sadam": [58.957989, 23.527344],
  Heltermaa: [58.864206, 23.043742],
  Häädemeeste: [58.036667, 24.458056],
  Kunda: [59.521411, 26.541397],
  Kõrgessaare: [58.993056, 22.464722],
  Loksa: [59.583333, 25.698611],
  Mõntu: [57.949167, 22.123889],
  Naissaare: [59.540833, 24.563333],
  "Narva-Jõesuu": [59.468333, 28.0425],
  "Paldiski (Põhjasadam)": [59.349722, 24.0475],
  Pirita: [59.468842, 24.820756],
  Pärnu: [58.384567, 24.485197],
  Ristna: [58.920953, 22.0663],
  Rohuneeme: [59.562631, 24.793856],
  Roomassaare: [58.218056, 22.506389],
  Ruhnu: [57.783394, 23.258883],
  Tilgu: [59.455795, 24.48814],
  Vaindloo: [59.816944, 26.361111],
  Virtsu: [58.572675, 23.513556],
};
