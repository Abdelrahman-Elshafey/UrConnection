// Every country we offer, alphabetical. Kept apart from the city lists (cities.ts) on purpose:
// the country dropdown needs only these names (≈ 2 KB), while all the cities together are
// ≈ 30 KB. The website loads the cities only once someone picks a country (Stage 12).

export const COUNTRY_LIST = [
  "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahrain", "Bangladesh", "Belgium", "Bolivia", "Bosnia and Herzegovina", "Brazil",
  "Bulgaria", "Cambodia", "Cameroon", "Canada", "Chile", "China", "Colombia", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Estonia", "Ethiopia", "Finland", "France", "Georgia", "Germany", "Ghana",
  "Greece", "Guatemala", "Honduras", "Hungary", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait",
  "Laos", "Latvia", "Lebanon", "Libya", "Lithuania", "Luxembourg", "Malaysia", "Mexico", "Moldova",
  "Mongolia", "Morocco", "Mozambique", "Myanmar", "Nepal", "Netherlands", "New Zealand",
  "Nicaragua", "Nigeria", "Norway", "Oman", "Pakistan", "Palestine", "Panama", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia", "Senegal",
  "Serbia", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain",
  "Sri Lanka", "Sudan", "Sweden", "Switzerland", "Syria", "Taiwan", "Tanzania", "Thailand",
  "Tunisia", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
] as const;

export type Country = (typeof COUNTRY_LIST)[number];

const COUNTRY_SET: ReadonlySet<string> = new Set(COUNTRY_LIST);

/** Type guard: narrows any string to a known Country. */
export const isCountry = (value: string): value is Country => COUNTRY_SET.has(value);
