/**
 * Region, for the local leaderboard.
 *
 * Derived from the IANA timezone the user already gave us at sign-up. That is
 * a deliberate choice over the two alternatives: geolocating an IP address
 * collects location data nobody agreed to hand over, and asking for a country
 * adds a field to a sign-up form for a leaderboard most people will never open.
 * The timezone is already there, already the user's own statement about where
 * they are, and already the thing day boundaries are computed in.
 *
 * It is an approximation and the UI says so. "Europe/London" is confidently the
 * United Kingdom; "Europe/Madrid" is Spain; but a continent-only zone like
 * "Europe/Brussels" covers several countries, and a user who never changed the
 * default is in the default's country whether they live there or not. So the
 * local board is labelled by the region it actually derived, and a user can
 * override it in settings — that override is the authority when present.
 *
 * Pure, and deliberately small: a full tz-to-country table is a dependency and
 * a maintenance burden for a feature this size. Unknown zones fall back to the
 * continent, which still produces a usable board.
 */

/** Zones worth naming exactly, because they are unambiguous and common. */
const ZONE_TO_REGION: Record<string, string> = {
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Paris": "FR",
  "Europe/Madrid": "ES",
  "Europe/Lisbon": "PT",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Vienna": "AT",
  "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Athens": "GR",
  "Europe/Istanbul": "TR",
  "Europe/Moscow": "RU",
  "Europe/Kyiv": "UA",
  "Europe/Kiev": "UA",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Phoenix": "US",
  "America/Los_Angeles": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Halifax": "CA",
  "America/Mexico_City": "MX",
  "America/Sao_Paulo": "BR",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Bogota": "CO",
  "America/Santiago": "CL",
  "America/Lima": "PE",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Singapore": "SG",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD",
  "Asia/Jakarta": "ID",
  "Asia/Manila": "PH",
  "Asia/Bangkok": "TH",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Jerusalem": "IL",
  "Africa/Lagos": "NG",
  "Africa/Cairo": "EG",
  "Africa/Johannesburg": "ZA",
  "Africa/Nairobi": "KE",
  "Africa/Accra": "GH",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Pacific/Auckland": "NZ",
};

const CONTINENT_NAMES: Record<string, string> = {
  Europe: "Europe",
  America: "the Americas",
  Asia: "Asia",
  Africa: "Africa",
  Australia: "Oceania",
  Pacific: "Oceania",
  Atlantic: "Atlantic",
  Indian: "Indian Ocean",
};

const REGION_NAMES: Record<string, string> = {
  GB: "United Kingdom", IE: "Ireland", FR: "France", ES: "Spain", PT: "Portugal",
  DE: "Germany", IT: "Italy", NL: "Netherlands", BE: "Belgium", AT: "Austria",
  CH: "Switzerland", SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland",
  PL: "Poland", CZ: "Czechia", GR: "Greece", TR: "Türkiye", RU: "Russia", UA: "Ukraine",
  US: "United States", CA: "Canada", MX: "Mexico", BR: "Brazil", AR: "Argentina",
  CO: "Colombia", CL: "Chile", PE: "Peru",
  JP: "Japan", KR: "South Korea", CN: "China", HK: "Hong Kong", SG: "Singapore",
  IN: "India", PK: "Pakistan", BD: "Bangladesh", ID: "Indonesia", PH: "Philippines",
  TH: "Thailand", VN: "Vietnam", AE: "United Arab Emirates", SA: "Saudi Arabia", IL: "Israel",
  NG: "Nigeria", EG: "Egypt", ZA: "South Africa", KE: "Kenya", GH: "Ghana",
  AU: "Australia", NZ: "New Zealand",
};

/**
 * A region code for a timezone.
 *
 * Two-letter ISO codes where the zone identifies a country; otherwise a
 * `CONT:` prefixed continent, which is honest about being coarser rather than
 * guessing a country the zone does not name.
 */
export function regionForTimezone(timezone: string | null | undefined): string | null {
  if (!timezone) return null;

  const exact = ZONE_TO_REGION[timezone];
  if (exact) return exact;

  const continent = timezone.split("/")[0];
  if (continent && CONTINENT_NAMES[continent]) return `CONT:${continent}`;

  return null;
}

/** What to print for a region code. */
export function regionName(code: string | null | undefined): string {
  if (!code) return "Unknown region";
  if (code.startsWith("CONT:")) return CONTINENT_NAMES[code.slice(5)] ?? "Unknown region";
  return REGION_NAMES[code] ?? code;
}

/** True when the code is a country rather than a fallback continent. */
export function isCountryRegion(code: string | null | undefined): boolean {
  return Boolean(code) && !code!.startsWith("CONT:");
}
