export type ListingCategory =
  | "noi-that"
  | "dien-tu"
  | "sach-tai-lieu"
  | "quan-ao"
  | "do-bep"
  | "khac";

export type ApiListingCategory =
  | "furniture"
  | "electronics"
  | "appliances"
  | "clothes"
  | "books"
  | "other";

export const CATEGORY_TO_API: Record<ListingCategory, ApiListingCategory> = {
  "noi-that": "furniture",
  "dien-tu": "electronics",
  "do-bep": "appliances",
  "quan-ao": "clothes",
  "sach-tai-lieu": "books",
  khac: "other",
};

export const CATEGORY_FROM_API: Record<string, ListingCategory> = {
  furniture: "noi-that",
  electronics: "dien-tu",
  appliances: "do-bep",
  clothes: "quan-ao",
  books: "sach-tai-lieu",
  other: "khac",
  kitchen: "do-bep",
};

const API_CATEGORIES = new Set<string>(Object.values(CATEGORY_TO_API));

export function toApiCategory(category: string): ApiListingCategory | undefined {
  const mapped =
    CATEGORY_TO_API[category as ListingCategory] ??
    (category === "kitchen" ? "appliances" : category);
  return API_CATEGORIES.has(mapped) ? (mapped as ApiListingCategory) : undefined;
}
