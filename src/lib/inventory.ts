/** Inventory domain — vehicles with real dealer signals: market pricing
 *  position (vAuto-style), aging/velocity, syndication, VDP demand. */

export type VStatus = "available" | "recon" | "reserved" | "wholesale" | "sold";
export const STATUS_LABEL: Record<VStatus, string> = {
  available: "Available", recon: "In recon", reserved: "Reserved", wholesale: "Wholesale", sold: "Sold",
};
export const STATUS_TONE: Record<VStatus, "ok" | "warn" | "brand" | "neutral"> = {
  available: "ok", recon: "warn", reserved: "brand", wholesale: "neutral", sold: "neutral",
};

export type Vehicle = {
  id: string; year: number; make: string; model: string; trim: string; body: string;
  vin: string; stock: string;
  price: number; marketLow: number; marketAvg: number; marketHigh: number; cost: number;
  mileage: number; days: number; status: VStatus;
  color: string; colorHex: string;
  vdpViews: number; leads: number; photos: number;
  channels: string[];
};

export const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
export const miles = (n: number) => `${Math.round(n).toLocaleString()} mi`;

export function agingBucket(days: number): { label: string; tone: "ok" | "brand" | "warn" | "err" } {
  if (days < 15) return { label: "Fresh", tone: "ok" };
  if (days < 30) return { label: "Active", tone: "brand" };
  if (days < 45) return { label: "Aging", tone: "warn" };
  return { label: "Stale", tone: "err" };
}

/** Price vs market: negative = below market (good for buyers). */
export function marketDelta(v: Vehicle) {
  const delta = v.price - v.marketAvg;
  const pct = v.marketAvg ? (delta / v.marketAvg) * 100 : 0;
  const tone = delta <= -300 ? "ok" : delta >= 500 ? "err" : "neutral";
  return { delta, pct, tone: tone as "ok" | "err" | "neutral", position: Math.max(0, Math.min(1, (v.price - v.marketLow) / (v.marketHigh - v.marketLow || 1))), avgPos: Math.max(0, Math.min(1, (v.marketAvg - v.marketLow) / (v.marketHigh - v.marketLow || 1))) };
}

const ALL = ["facebook", "google", "cars", "autotrader", "cargurus", "website"];

export const VEHICLES: Vehicle[] = [
  { id: "k2213", year: 2023, make: "Chevrolet", model: "Silverado 1500", trim: "LT Trail Boss", body: "Crew Cab", vin: "1GCUYEED8PZ101024", stock: "K-2213", price: 38940, marketLow: 36500, marketAvg: 40100, marketHigh: 43800, cost: 33200, mileage: 28450, days: 6, status: "available", color: "Summit White", colorHex: "#e9ecf0", vdpViews: 412, leads: 9, photos: 32, channels: ALL },
  { id: "k2188", year: 2021, make: "Tesla", model: "Model 3", trim: "Long Range AWD", body: "Sedan", vin: "5YJ3E1EB4MF882841", stock: "K-2188", price: 27450, marketLow: 26200, marketAvg: 29050, marketHigh: 31900, cost: 24100, mileage: 41220, days: 21, status: "available", color: "Midnight Silver", colorHex: "#3a3f47", vdpViews: 631, leads: 14, photos: 41, channels: ["facebook", "google", "cars", "cargurus", "website"] },
  { id: "k2201", year: 2020, make: "Ram", model: "1500", trim: "Laramie", body: "Crew Cab", vin: "1C6SRFJT4LN256620", stock: "K-2201", price: 34120, marketLow: 33000, marketAvg: 34600, marketHigh: 37200, cost: 29900, mileage: 52310, days: 3, status: "recon", color: "Diamond Black", colorHex: "#15171b", vdpViews: 88, leads: 2, photos: 0, channels: [] },
  { id: "k2150", year: 2022, make: "Honda", model: "CR-V", trim: "EX-L AWD", body: "SUV", vin: "7FARW2H83NE042093", stock: "K-2150", price: 29880, marketLow: 28400, marketAvg: 29200, marketHigh: 31500, cost: 25600, mileage: 33940, days: 44, status: "available", color: "Sonic Gray", colorHex: "#6b7078", vdpViews: 274, leads: 5, photos: 28, channels: ["facebook", "cars", "autotrader", "website"] },
  { id: "k2099", year: 2019, make: "BMW", model: "4 Series", trim: "440i xDrive", body: "Coupe", vin: "WBA4Z3C50KEF41177", stock: "K-2099", price: 25300, marketLow: 24800, marketAvg: 27100, marketHigh: 29600, cost: 21400, mileage: 47880, days: 12, status: "reserved", color: "Alpine White", colorHex: "#eef1f5", vdpViews: 356, leads: 7, photos: 36, channels: ALL },
  { id: "k2244", year: 2023, make: "Toyota", model: "Tacoma", trim: "TRD Sport", body: "Double Cab", vin: "3TMCZ5AN9PM554410", stock: "K-2244", price: 41200, marketLow: 39900, marketAvg: 41600, marketHigh: 44100, cost: 36800, mileage: 19870, days: 9, status: "available", color: "Army Green", colorHex: "#5b6350", vdpViews: 489, leads: 11, photos: 30, channels: ["facebook", "google", "cars", "autotrader", "cargurus"] },
  { id: "k2012", year: 2018, make: "Ford", model: "F-150", trim: "XLT SuperCrew", body: "Crew Cab", vin: "1FTEW1EP2JKD88120", stock: "K-2012", price: 26900, marketLow: 27400, marketAvg: 29800, marketHigh: 32100, cost: 22600, mileage: 68420, days: 58, status: "available", color: "Oxford White", colorHex: "#eef1f5", vdpViews: 142, leads: 3, photos: 22, channels: ["facebook", "cars"] },
  { id: "k2233", year: 2022, make: "Kia", model: "Telluride", trim: "SX", body: "SUV", vin: "5XYP5DHC8NG221904", stock: "K-2233", price: 42600, marketLow: 41000, marketAvg: 42900, marketHigh: 45400, cost: 38200, mileage: 24110, days: 17, status: "available", color: "Ebony Black", colorHex: "#15171b", vdpViews: 398, leads: 8, photos: 34, channels: ALL },
  { id: "k1998", year: 2020, make: "Subaru", model: "Outback", trim: "Onyx XT", body: "Wagon", vin: "4S4BTGLD2L3182774", stock: "K-1998", price: 24700, marketLow: 24100, marketAvg: 25300, marketHigh: 27000, cost: 21200, mileage: 44560, days: 31, status: "available", color: "Crystal Black", colorHex: "#15171b", vdpViews: 201, leads: 4, photos: 26, channels: ["facebook", "cars", "cargurus", "website"] },
  { id: "k2260", year: 2024, make: "Hyundai", model: "Santa Fe", trim: "Calligraphy", body: "SUV", vin: "5NMS5DAL0RH123344", stock: "K-2260", price: 43900, marketLow: 42800, marketAvg: 44200, marketHigh: 46500, cost: 40100, mileage: 8920, days: 4, status: "available", color: "Hampton Gray", colorHex: "#8a9098", vdpViews: 305, leads: 6, photos: 38, channels: ["facebook", "google", "cars", "website"] },
  { id: "k1975", year: 2017, make: "Jeep", model: "Wrangler", trim: "Unlimited Sahara", body: "SUV", vin: "1C4BJWEG5HL621188", stock: "K-1975", price: 23400, marketLow: 22800, marketAvg: 24900, marketHigh: 27200, cost: 19800, mileage: 71230, days: 49, status: "wholesale", color: "Firecracker Red", colorHex: "#b23b32", vdpViews: 176, leads: 3, photos: 19, channels: ["facebook"] },
  { id: "k2270", year: 2021, make: "Lexus", model: "RX 350", trim: "F Sport", body: "SUV", vin: "2T2SZMDA3MC287610", stock: "K-2270", price: 39600, marketLow: 38200, marketAvg: 39400, marketHigh: 42000, cost: 35100, mileage: 36780, days: 2, status: "recon", color: "Nebula Gray", colorHex: "#6b7078", vdpViews: 61, leads: 1, photos: 0, channels: [] },
];

export function inventoryStats() {
  const live = VEHICLES.filter((v) => v.status !== "sold");
  const value = live.reduce((s, v) => s + v.price, 0);
  const gross = live.reduce((s, v) => s + (v.price - v.cost), 0);
  const days = Math.round(live.reduce((s, v) => s + v.days, 0) / live.length);
  const stale = live.filter((v) => v.days >= 45).length;
  return { units: live.length, value, avgGross: Math.round(gross / live.length), avgDays: days, stalePct: Math.round((stale / live.length) * 100) };
}
