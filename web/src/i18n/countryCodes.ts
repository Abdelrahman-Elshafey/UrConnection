import type { Country } from "@urconnections/shared";

/**
 * ISO 3166-1 alpha-2 code of every country we offer. The database stores the English name
 * ("Germany"); the code lets the browser's built-in Intl.DisplayNames show it in the
 * visitor's language ("Germania", "Deutschland", "Allemagne") without shipping translations.
 *
 * `Record<Country, string>`: TypeScript fails the build if a country in COUNTRY_LIST has no
 * code here (or if a key here is not in the list).
 */
export const COUNTRY_CODES: Record<Country, string> = {
  Afghanistan: "AF", Albania: "AL", Algeria: "DZ", Angola: "AO", Argentina: "AR", Armenia: "AM",
  Australia: "AU", Austria: "AT", Azerbaijan: "AZ", Bahrain: "BH", Bangladesh: "BD", Belgium: "BE",
  Bolivia: "BO", "Bosnia and Herzegovina": "BA", Brazil: "BR", Bulgaria: "BG", Cambodia: "KH",
  Cameroon: "CM", Canada: "CA", Chile: "CL", China: "CN", Colombia: "CO", "Costa Rica": "CR",
  Croatia: "HR", Cuba: "CU", Cyprus: "CY", Czechia: "CZ", Denmark: "DK", "Dominican Republic": "DO",
  Ecuador: "EC", Egypt: "EG", "El Salvador": "SV", Estonia: "EE", Ethiopia: "ET", Finland: "FI",
  France: "FR", Georgia: "GE", Germany: "DE", Ghana: "GH", Greece: "GR", Guatemala: "GT",
  Honduras: "HN", Hungary: "HU", India: "IN", Indonesia: "ID", Iran: "IR", Iraq: "IQ", Ireland: "IE",
  Israel: "IL", Italy: "IT", "Ivory Coast": "CI", Jamaica: "JM", Japan: "JP", Jordan: "JO",
  Kazakhstan: "KZ", Kenya: "KE", Kuwait: "KW", Laos: "LA", Latvia: "LV", Lebanon: "LB", Libya: "LY",
  Lithuania: "LT", Luxembourg: "LU", Malaysia: "MY", Mexico: "MX", Moldova: "MD", Mongolia: "MN",
  Morocco: "MA", Mozambique: "MZ", Myanmar: "MM", Nepal: "NP", Netherlands: "NL", "New Zealand": "NZ",
  Nicaragua: "NI", Nigeria: "NG", Norway: "NO", Oman: "OM", Pakistan: "PK", Palestine: "PS",
  Panama: "PA", Paraguay: "PY", Peru: "PE", Philippines: "PH", Poland: "PL", Portugal: "PT",
  Qatar: "QA", Romania: "RO", Russia: "RU", "Saudi Arabia": "SA", Senegal: "SN", Serbia: "RS",
  Singapore: "SG", Slovakia: "SK", Slovenia: "SI", "South Africa": "ZA", "South Korea": "KR",
  Spain: "ES", "Sri Lanka": "LK", Sudan: "SD", Sweden: "SE", Switzerland: "CH", Syria: "SY",
  Taiwan: "TW", Tanzania: "TZ", Thailand: "TH", Tunisia: "TN", Turkey: "TR", Ukraine: "UA",
  "United Arab Emirates": "AE", "United Kingdom": "GB", "United States": "US", Uruguay: "UY",
  Uzbekistan: "UZ", Venezuela: "VE", Vietnam: "VN", Yemen: "YE", Zambia: "ZM", Zimbabwe: "ZW",
};
