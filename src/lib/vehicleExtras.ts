/** Extra dealer-grade listing data that lives in Vehicle.attributes:
 *  standard-equipment checklists, the on-site condition report (star ratings),
 *  and marketplace-specific pricing. Kept separate from vehicleSpecs.ts (which
 *  drives the category-adaptive spec sheet) so both stay readable. */

/* ── Standard equipment: grouped checklists (Tab 5 in the reference form) ── */
export const EQUIPMENT_GROUPS: { key: string; label: string; items: string[] }[] = [
  { key: "mechanical", label: "Mechanical", items: ["ABS Brakes", "4-Wheel Disc Brakes", "Traction Control", "Stability Control", "Tow / Trailer Package", "Adaptive Cruise Control", "Keyless Start", "Auto Stop/Start", "Locking Differential", "Skid Plates"] },
  { key: "exterior", label: "Exterior", items: ["Alloy Wheels", "Sunroof / Moonroof", "Panoramic Roof", "Roof Rack", "LED Headlights", "Fog Lights", "Power Liftgate", "Running Boards", "Tinted Glass", "Tow Hitch", "Bed Liner"] },
  { key: "entertainment", label: "Entertainment", items: ["Bluetooth", "Apple CarPlay", "Android Auto", "Navigation System", "Premium Sound", "Satellite Radio", "Wireless Charging", "Wi-Fi Hotspot", "Rear Seat Entertainment"] },
  { key: "interior", label: "Interior", items: ["Leather Seats", "Heated Front Seats", "Ventilated Seats", "Heated Rear Seats", "Heated Steering Wheel", "Power Driver Seat", "Memory Seat", "Third Row Seating", "Keyless Entry", "Remote Start", "Dual-Zone Climate", "Ambient Lighting"] },
  { key: "safety", label: "Safety", items: ["Backup Camera", "360° Camera", "Blind Spot Monitor", "Lane Departure Warning", "Lane Keep Assist", "Forward Collision Warning", "Automatic Emergency Braking", "Rear Cross-Traffic Alert", "Parking Sensors", "Adaptive Headlights"] },
  { key: "optional", label: "Optional", items: [] }, // free-form via "additional equipment"
];

/* ── Condition report: 28 star-rated points, grouped (Tab 6 in the reference form) ── */
export const CONDITION_REPORT_GROUPS: { key: string; label: string; items: string[] }[] = [
  { key: "exterior", label: "Exterior", items: ["Front Bumper", "Front Grille", "Glass", "Left Doors", "Hood", "Left Front Fender", "Left Rear", "Paint", "Rear Bumper", "Right Doors", "Right Front Fender", "Right Rear", "Trunk", "Wheels"] },
  { key: "interior", label: "Interior", items: ["Carpet", "Dash", "Electronics", "Front Seats", "Headliner", "Rear Seats"] },
  { key: "mechanical", label: "Mechanical", items: ["Air Conditioning", "Brakes", "Engine", "Exhaust", "Steering", "Suspension", "Tires", "Transmission"] },
];
export const CONDITION_POINT_COUNT = CONDITION_REPORT_GROUPS.reduce((n, g) => n + g.items.length, 0); // 28

/* ── Marketplace pricing channels (Tab 4 additional prices) ── */
export const PRICE_CHANNELS: { key: string; label: string }[] = [
  { key: "website", label: "Website Price" },
  { key: "fbmp", label: "Facebook Marketplace" },
  { key: "craigslist", label: "Craigslist" },
];
export const PRICE_TYPES = ["Price", "Cash", "Down Payment", "Call for Price", "Custom Text"] as const;

/** Stable key for a condition-report point. */
export const crKey = (groupKey: string, item: string) => `${groupKey}:${item}`;
