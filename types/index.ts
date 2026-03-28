export type Region =
  | "us-cold"
  | "us-warm"
  | "uk"
  | "canada"
  | "europe-west"
  | "australia"
  | "singapore"
  | "middle-east";

export type AccommodationType =
  | "dorm-furnished"
  | "dorm-unfurnished"
  | "shared-apt"
  | "solo-apt";

export type Priority = "day-1" | "week-1" | "month-1" | "optional";

export type Source = "bring-from-india" | "buy-there" | "either";

export type BudgetTier = "tight" | "comfortable" | "flexible";

export type ArrivalTiming = "lt-2-weeks" | "1-2-months" | "3-plus-months";

export interface StudentProfile {
  region: Region;
  accommodation: AccommodationType;
  arrivalTiming: ArrivalTiming;
  budget: BudgetTier;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  brand?: string;
  imageUrl: string;
  externalUrl: string;
  price?: {
    inr?: number;
    local?: number;
    localCurrency?: string;
  };
  priority: Priority;
  source: Source;
  relevantRegions: Region[];
  relevantAccommodations: AccommodationType[];
  budgetTiers: BudgetTier[];
  tip?: string;
  availabilityNote?: string;
  indianCommunityNote?: string;
  specs?: Record<string, string>;
  cardSpecKeys?: string[];
  displayPosition?: number;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  adminUsername: string;
  adminPassword: string;
  createdAt: Date;
}

export interface Room {
  items: Item[];
}

export interface Flat {
  rooms: Room[];
}

export interface Tower {
  flats: Flat[];
}
