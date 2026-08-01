/** The ad networks Krakd publishes to. One source of truth shared by the
 *  sidebar, marketing pages and the campaign builder. Connection state is
 *  per-dealer and comes from the API — it is NOT hardcoded here. */

export type NetId = "facebook" | "instagram" | "google";
export type Channel = "FACEBOOK" | "INSTAGRAM" | "GOOGLE";

export type NetworkDef = { id: NetId; channel: Channel; name: string; logo: string; sub: string };

export const NETWORKS: NetworkDef[] = [
  { id: "facebook", channel: "FACEBOOK", name: "Facebook", logo: "/logos/facebook.svg", sub: "Page feed, Marketplace & Reels" },
  { id: "instagram", channel: "INSTAGRAM", name: "Instagram", logo: "/logos/instagram.svg", sub: "Feed & Stories" },
  { id: "google", channel: "GOOGLE", name: "Google", logo: "/logos/google.svg", sub: "Search, Vehicle Ads & PMax" },
];

export const netById = (id: string) => NETWORKS.find((n) => n.id === id);
export const netByChannel = (ch: string) => NETWORKS.find((n) => n.channel === ch);
export const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;
