// Geocoding via OpenStreetMap Nominatim (kostenlos, kein Key nötig).
// Wandelt eine Adresse in Koordinaten + Kanton um, damit das Mitglied auf der
// Schweizer Karte platziert werden kann.

export interface GeocodeResult {
  lat: number;
  lng: number;
  canton: string | null;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Mapping der von Nominatim gelieferten Kantonsnamen auf Kürzel.
const CANTON_CODES: Record<string, string> = {
  Aargau: "AG",
  "Appenzell Ausserrhoden": "AR",
  "Appenzell Innerrhoden": "AI",
  "Basel-Landschaft": "BL",
  "Basel-Stadt": "BS",
  Bern: "BE",
  Berne: "BE",
  Fribourg: "FR",
  Freiburg: "FR",
  Genève: "GE",
  Genf: "GE",
  Glarus: "GL",
  Graubünden: "GR",
  Jura: "JU",
  Luzern: "LU",
  Neuchâtel: "NE",
  Nidwalden: "NW",
  Obwalden: "OW",
  Schaffhausen: "SH",
  Schwyz: "SZ",
  Solothurn: "SO",
  "St. Gallen": "SG",
  "Sankt Gallen": "SG",
  Thurgau: "TG",
  Ticino: "TI",
  Tessin: "TI",
  Uri: "UR",
  Valais: "VS",
  Wallis: "VS",
  Vaud: "VD",
  Waadt: "VD",
  Zug: "ZG",
  Zürich: "ZH",
};

/**
 * Geocodiert eine Adresse. Gibt `null` zurück, wenn nichts gefunden wird —
 * der Aufrufer sollte dann die alten Koordinaten beibehalten.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const query = (address ?? "").trim();
  if (!query) return null;

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "1",
    countrycodes: "ch",
  });

  try {
    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        // Nominatim verlangt einen aussagekräftigen User-Agent.
        "User-Agent": "SwissDentalIndustry/1.0 (admin@swissdentalindustry.ch)",
        "Accept-Language": "de",
      },
      // Server-seitig; Ergebnisse selten ändernd → kurzes Caching ist ok.
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      address?: { state?: string; county?: string };
    }>;
    if (!data.length) return null;

    const hit = data[0];
    const stateName = hit.address?.state || hit.address?.county || "";
    return {
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
      canton: CANTON_CODES[stateName] ?? (stateName || null),
    };
  } catch (err) {
    console.error("geocodeAddress failed:", err);
    return null;
  }
}
