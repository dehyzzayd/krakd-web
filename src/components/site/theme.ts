import type { SiteConfig } from "@/lib/server/site";

export type Template = SiteConfig["template"];

export type TplUI = {
  hero: "split" | "search" | "bleed";
  header: "light" | "dark";
  container: string;
  heading: string;      // section heading classes
  card: "soft" | "flat" | "feature";
  cardRadius: string;
  photo: string;        // card photo aspect ratio
  featuredCols: string; // homepage featured grid
  invCols: string;      // inventory page grid
  chip: string;         // shop-by-make chip radius
  inventoryFirst: boolean; // show inventory before shop-by-make on home
};

/** Each template diverges across the whole site — not just the hero. */
export function siteTheme(t: Template): TplUI {
  switch (t) {
    case "INVENTORY_FIRST":
      return {
        hero: "search", header: "light", container: "max-w-[1360px]",
        heading: "text-[21px] font-bold tracking-tight", card: "flat", cardRadius: "rounded-xl",
        photo: "aspect-[4/3]", featuredCols: "sm:grid-cols-2 lg:grid-cols-4",
        invCols: "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5", chip: "rounded-md", inventoryFirst: true,
      };
    case "PREMIUM":
      return {
        hero: "bleed", header: "dark", container: "max-w-[1200px]",
        heading: "text-[28px] font-extrabold tracking-tight", card: "feature", cardRadius: "rounded-3xl",
        photo: "aspect-[3/2]", featuredCols: "sm:grid-cols-2 lg:grid-cols-3",
        invCols: "sm:grid-cols-2 lg:grid-cols-3", chip: "rounded-full", inventoryFirst: false,
      };
    default: // MODERN
      return {
        hero: "split", header: "light", container: "max-w-[1280px]",
        heading: "text-[24px] font-bold tracking-tight", card: "soft", cardRadius: "rounded-2xl",
        photo: "aspect-[4/3]", featuredCols: "sm:grid-cols-2 lg:grid-cols-4",
        invCols: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", chip: "rounded-xl", inventoryFirst: false,
      };
  }
}
