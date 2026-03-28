import type {
  AccommodationType,
  ArrivalTiming,
  BudgetTier,
  Region,
} from "@/types";

export const REGION_OPTIONS: {
  id: Region;
  label: string;
  chip: string;
  searchText: string;
}[] = [
  {
    id: "us-cold",
    label: "USA — Northeast / Midwest (Boston, Chicago, NYC, Michigan…)",
    chip: "US Northeast",
    searchText: "usa cold boston chicago new york michigan",
  },
  {
    id: "us-warm",
    label: "USA — South / West (California, Texas, Arizona, Florida…)",
    chip: "US South/West",
    searchText: "california texas arizona florida warm",
  },
  {
    id: "uk",
    label: "United Kingdom",
    chip: "UK",
    searchText: "uk britain england london",
  },
  {
    id: "canada",
    label: "Canada",
    chip: "Canada",
    searchText: "canada toronto vancouver",
  },
  {
    id: "europe-west",
    label: "Western Europe (Germany, Netherlands, France…)",
    chip: "W. Europe",
    searchText: "germany netherlands france eu",
  },
  {
    id: "australia",
    label: "Australia / New Zealand",
    chip: "Australia",
    searchText: "australia new zealand sydney melbourne",
  },
  {
    id: "singapore",
    label: "Singapore / Southeast Asia",
    chip: "Singapore",
    searchText: "singapore sea southeast asia",
  },
  {
    id: "middle-east",
    label: "Middle East (UAE, Qatar…)",
    chip: "Middle East",
    searchText: "uae dubai qatar middle east",
  },
];

export const ACCOMMODATION_OPTIONS: {
  id: AccommodationType;
  label: string;
  chip: string;
}[] = [
  { id: "dorm-furnished", label: "University Dorm (furnished)", chip: "Dorm" },
  {
    id: "dorm-unfurnished",
    label: "University Dorm (unfurnished)",
    chip: "Dorm (empty)",
  },
  { id: "shared-apt", label: "Shared Apartment", chip: "Shared apt" },
  { id: "solo-apt", label: "Solo Apartment", chip: "Solo apt" },
];

export const ARRIVAL_OPTIONS: {
  id: ArrivalTiming;
  label: string;
  chip: string;
}[] = [
  { id: "lt-2-weeks", label: "Less than 2 weeks away", chip: "< 2 weeks" },
  { id: "1-2-months", label: "1–2 months away", chip: "1–2 months" },
  { id: "3-plus-months", label: "3+ months away", chip: "3+ months" },
];

export const BUDGET_OPTIONS: {
  id: BudgetTier;
  label: string;
}[] = [
  { id: "tight", label: "Tight (student loan / minimal support)" },
  { id: "comfortable", label: "Comfortable (family support)" },
  { id: "flexible", label: "Flexible (not a concern)" },
];

export function profileChipLabel(profile: {
  region: Region;
  accommodation: AccommodationType;
  arrivalTiming: ArrivalTiming;
}): string {
  const r = REGION_OPTIONS.find((x) => x.id === profile.region)?.chip ?? profile.region;
  const a =
    ACCOMMODATION_OPTIONS.find((x) => x.id === profile.accommodation)?.chip ??
    profile.accommodation;
  const t =
    ARRIVAL_OPTIONS.find((x) => x.id === profile.arrivalTiming)?.chip ??
    profile.arrivalTiming;
  return `📍 ${r} · ${a} · ${t}`;
}
