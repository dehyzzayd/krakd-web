/** Category-driven vehicle spec schema.
 *  Picking a category unlocks a deep, domain-accurate set of spec sections/fields,
 *  with fields that reveal conditionally (showIf) on other answers — e.g. truck
 *  fields appear when the body style is a pickup, EV fields when the fuel is electric,
 *  powersport fields swap entirely by sub-type. Values are stored in Vehicle.attributes. */

export type FieldType = "select" | "number" | "text" | "toggle";
export type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  unit?: string;
  placeholder?: string;
  showIf?: { key: string; in: string[] };
};
export type Section = { title: string; fields: Field[] };
export type CategoryDef = {
  id: string;
  label: string;
  noun: string;          // "vehicle", "motorcycle", "unit"…
  usageLabel: string;    // "Mileage" vs "Hours" vs ""
  usageUnit: string;
  sections: Section[];
};

const CONDITION = ["New", "Used", "Certified Pre-Owned"];
const TITLE = ["Clean", "Salvage", "Rebuilt / Reconstructed", "Flood", "Lemon / Manufacturer Buyback", "Bonded", "Not Actual Miles", "Parts Only"];

/* ─────────────────────────  CARS & TRUCKS  ───────────────────────── */
const CAR: CategoryDef = {
  id: "CAR", label: "Cars & Trucks", noun: "vehicle", usageLabel: "Mileage", usageUnit: "mi",
  sections: [
    { title: "Body & configuration", fields: [
      { key: "condition", label: "Condition", type: "select", options: CONDITION },
      { key: "bodyStyle", label: "Body style", type: "select", options: ["Sedan", "Coupe", "Hatchback", "Wagon", "Convertible", "SUV", "Crossover", "Minivan", "Pickup Truck", "Cargo Van", "Passenger Van", "Chassis Cab"] },
      { key: "cabType", label: "Cab type", type: "select", options: ["Regular Cab", "Extended / Super Cab", "Crew Cab", "Mega Cab"], showIf: { key: "bodyStyle", in: ["Pickup Truck", "Chassis Cab"] } },
      { key: "bedLength", label: "Bed length", type: "select", options: ["Short (5'0\")", "Standard (5'7\")", "Standard (6'4\")", "Long (6'6\")", "Long (8'0\")"], showIf: { key: "bodyStyle", in: ["Pickup Truck", "Chassis Cab"] } },
      { key: "doors", label: "Doors", type: "select", options: ["2", "3", "4", "5"] },
      { key: "seats", label: "Seating capacity", type: "number", unit: "seats", placeholder: "5" },
    ] },
    { title: "Powertrain", fields: [
      { key: "drivetrain", label: "Drivetrain", type: "select", options: ["FWD", "RWD", "AWD", "4WD / 4x4", "Part-time 4WD"] },
      { key: "fuelType", label: "Fuel type", type: "select", options: ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Electric", "Flex Fuel (E85)", "Hydrogen", "CNG"] },
      { key: "cylinders", label: "Cylinders", type: "select", options: ["3", "4", "5", "6", "8", "10", "12", "16", "Rotary", "Electric"], showIf: { key: "fuelType", in: ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Flex Fuel (E85)", "CNG"] } },
      { key: "displacementL", label: "Displacement", type: "number", unit: "L", placeholder: "2.5", showIf: { key: "fuelType", in: ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Flex Fuel (E85)", "CNG"] } },
      { key: "aspiration", label: "Aspiration", type: "select", options: ["Naturally Aspirated", "Turbocharged", "Twin-Turbo", "Supercharged", "Twin-Charged"], showIf: { key: "fuelType", in: ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Flex Fuel (E85)"] } },
      { key: "transmission", label: "Transmission", type: "select", options: ["Automatic", "Manual", "CVT", "Dual-Clutch (DCT)", "Automated Manual", "Single-Speed"] },
      { key: "gears", label: "Gears / speeds", type: "number", unit: "spd", placeholder: "8", showIf: { key: "transmission", in: ["Automatic", "Manual", "Dual-Clutch (DCT)", "Automated Manual"] } },
      { key: "horsepower", label: "Horsepower", type: "number", unit: "hp", placeholder: "300" },
      { key: "torque", label: "Torque", type: "number", unit: "lb-ft", placeholder: "265" },
    ] },
    { title: "Electrification", fields: [
      { key: "batteryKwh", label: "Battery capacity", type: "number", unit: "kWh", placeholder: "77.4", showIf: { key: "fuelType", in: ["Electric", "Plug-in Hybrid"] } },
      { key: "epaRange", label: "EPA range", type: "number", unit: "mi", placeholder: "300", showIf: { key: "fuelType", in: ["Electric", "Plug-in Hybrid"] } },
      { key: "motorLayout", label: "Motor layout", type: "select", options: ["Single Motor", "Dual Motor", "Tri Motor", "Quad Motor"], showIf: { key: "fuelType", in: ["Electric"] } },
      { key: "dcFastCharge", label: "DC fast charge (10-80%)", type: "number", unit: "min", placeholder: "18", showIf: { key: "fuelType", in: ["Electric", "Plug-in Hybrid"] } },
      { key: "chargePort", label: "Charge port", type: "select", options: ["NACS (Tesla)", "CCS Combo", "CHAdeMO", "J1772 only"], showIf: { key: "fuelType", in: ["Electric", "Plug-in Hybrid"] } },
    ] },
    { title: "Fuel economy", fields: [
      { key: "mpgCity", label: "City", type: "number", unit: "mpg", placeholder: "28", showIf: { key: "fuelType", in: ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Flex Fuel (E85)", "CNG"] } },
      { key: "mpgHwy", label: "Highway", type: "number", unit: "mpg", placeholder: "39", showIf: { key: "fuelType", in: ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Flex Fuel (E85)", "CNG"] } },
      { key: "mpge", label: "Efficiency", type: "number", unit: "MPGe", placeholder: "120", showIf: { key: "fuelType", in: ["Electric"] } },
      { key: "fuelTank", label: "Fuel tank", type: "number", unit: "gal", placeholder: "14.5", showIf: { key: "fuelType", in: ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Flex Fuel (E85)"] } },
    ] },
    { title: "Towing & capability", fields: [
      { key: "towingLbs", label: "Max towing", type: "number", unit: "lbs", placeholder: "11,000", showIf: { key: "bodyStyle", in: ["Pickup Truck", "SUV", "Cargo Van", "Passenger Van", "Chassis Cab", "Minivan"] } },
      { key: "payloadLbs", label: "Payload", type: "number", unit: "lbs", placeholder: "1,940", showIf: { key: "bodyStyle", in: ["Pickup Truck", "Cargo Van", "Chassis Cab"] } },
      { key: "gvwrLbs", label: "GVWR", type: "number", unit: "lbs", placeholder: "7,000", showIf: { key: "bodyStyle", in: ["Pickup Truck", "Cargo Van", "Passenger Van", "Chassis Cab"] } },
      { key: "hitchType", label: "Hitch", type: "select", options: ["None", "Receiver (Class III/IV)", "Gooseneck", "5th Wheel"], showIf: { key: "bodyStyle", in: ["Pickup Truck", "Chassis Cab"] } },
    ] },
    { title: "Appearance & interior", fields: [
      { key: "exteriorColor", label: "Exterior color", type: "text", placeholder: "Summit White" },
      { key: "interiorColor", label: "Interior color", type: "text", placeholder: "Jet Black" },
      { key: "interiorMaterial", label: "Upholstery", type: "select", options: ["Cloth", "Leather", "Leatherette", "Synthetic Suede", "Alcantara", "Vinyl", "Nappa Leather"] },
      { key: "roof", label: "Roof", type: "select", options: ["Standard", "Sunroof", "Moonroof", "Panoramic Roof", "Convertible Soft Top", "Convertible Hard Top", "Removable Top"] },
    ] },
    { title: "History & title", fields: [
      { key: "titleStatus", label: "Title status", type: "select", options: TITLE },
      { key: "owners", label: "Previous owners", type: "number", placeholder: "1" },
      { key: "accidents", label: "Reported accidents", type: "number", placeholder: "0" },
      { key: "usage", label: "Prior use", type: "select", options: ["Personal", "Fleet / Commercial", "Rental", "Lease", "Livery / Taxi"] },
      { key: "keys", label: "Keys", type: "number", placeholder: "2" },
    ] },
  ],
};

/* ─────────────────────────  MOTORCYCLE  ───────────────────────── */
const MOTORCYCLE: CategoryDef = {
  id: "MOTORCYCLE", label: "Motorcycle", noun: "motorcycle", usageLabel: "Mileage", usageUnit: "mi",
  sections: [
    { title: "Type & class", fields: [
      { key: "condition", label: "Condition", type: "select", options: CONDITION },
      { key: "motoType", label: "Type", type: "select", options: ["Cruiser", "Sportbike", "Standard / Naked", "Touring", "Sport Touring", "Adventure (ADV)", "Dual-Sport", "Dirt / Off-Road", "Motocross", "Enduro", "Cafe Racer", "Bobber", "Chopper", "Bagger", "Trike", "Scooter", "Moped", "Electric"] },
    ] },
    { title: "Engine", fields: [
      { key: "engineConfig", label: "Engine layout", type: "select", options: ["Single", "Parallel Twin", "V-Twin", "L-Twin", "Boxer Twin", "Inline-3", "Inline-4", "Inline-6", "V4", "Flat-6", "Electric"], showIf: { key: "motoType", in: ["Cruiser", "Sportbike", "Standard / Naked", "Touring", "Sport Touring", "Adventure (ADV)", "Dual-Sport", "Dirt / Off-Road", "Motocross", "Enduro", "Cafe Racer", "Bobber", "Chopper", "Bagger", "Trike"] } },
      { key: "displacementCc", label: "Displacement", type: "number", unit: "cc", placeholder: "1200", showIf: { key: "motoType", in: ["Cruiser", "Sportbike", "Standard / Naked", "Touring", "Sport Touring", "Adventure (ADV)", "Dual-Sport", "Dirt / Off-Road", "Motocross", "Enduro", "Cafe Racer", "Bobber", "Chopper", "Bagger", "Trike", "Scooter", "Moped"] } },
      { key: "strokeCycle", label: "Stroke", type: "select", options: ["4-Stroke", "2-Stroke"], showIf: { key: "motoType", in: ["Dirt / Off-Road", "Motocross", "Enduro", "Dual-Sport", "Scooter", "Moped"] } },
      { key: "cooling", label: "Cooling", type: "select", options: ["Air-Cooled", "Oil / Air-Cooled", "Liquid-Cooled"] },
      { key: "horsepower", label: "Horsepower", type: "number", unit: "hp", placeholder: "90" },
    ] },
    { title: "Drivetrain", fields: [
      { key: "finalDrive", label: "Final drive", type: "select", options: ["Chain", "Belt", "Shaft"] },
      { key: "transmissionSpeeds", label: "Transmission", type: "select", options: ["Automatic / CVT", "Semi-Automatic", "5-Speed", "6-Speed", "Single-Speed (Electric)"] },
      { key: "abs", label: "ABS", type: "toggle" },
      { key: "tractionControl", label: "Traction control", type: "toggle" },
    ] },
    { title: "Chassis & dimensions", fields: [
      { key: "seatHeightIn", label: "Seat height", type: "number", unit: "in", placeholder: "31.5" },
      { key: "dryWeightLbs", label: "Weight (dry)", type: "number", unit: "lbs", placeholder: "540" },
      { key: "fuelCapacityGal", label: "Fuel capacity", type: "number", unit: "gal", placeholder: "5.0", showIf: { key: "motoType", in: ["Cruiser", "Sportbike", "Standard / Naked", "Touring", "Sport Touring", "Adventure (ADV)", "Dual-Sport", "Dirt / Off-Road", "Motocross", "Enduro", "Cafe Racer", "Bobber", "Chopper", "Bagger", "Trike", "Scooter", "Moped"] } },
    ] },
    { title: "Appearance & title", fields: [
      { key: "color", label: "Color", type: "text", placeholder: "Vivid Black" },
      { key: "titleStatus", label: "Title status", type: "select", options: TITLE },
    ] },
  ],
};

/* ─────────────────────────  POWERSPORT (sub-type gated)  ───────────────────────── */
const POWERSPORT: CategoryDef = {
  id: "POWERSPORT", label: "Powersport", noun: "unit", usageLabel: "Usage", usageUnit: "",
  sections: [
    { title: "Category", fields: [
      { key: "condition", label: "Condition", type: "select", options: CONDITION },
      { key: "subType", label: "Sub-type", type: "select", options: ["ATV", "Side-by-Side (UTV)", "Personal Watercraft (PWC)", "Snowmobile", "Golf Cart", "Go-Kart", "Electric Bike"] },
    ] },
    { title: "ATV / UTV", fields: [
      { key: "engineCcAtv", label: "Engine displacement", type: "number", unit: "cc", placeholder: "1000", showIf: { key: "subType", in: ["ATV", "Side-by-Side (UTV)", "Go-Kart"] } },
      { key: "driveAtv", label: "Drive", type: "select", options: ["2WD", "4WD", "Selectable 2WD/4WD", "AWD"], showIf: { key: "subType", in: ["ATV", "Side-by-Side (UTV)"] } },
      { key: "seatingAtv", label: "Seating", type: "number", unit: "seats", placeholder: "2", showIf: { key: "subType", in: ["Side-by-Side (UTV)", "Go-Kart"] } },
      { key: "coolingAtv", label: "Cooling", type: "select", options: ["Air-Cooled", "Liquid-Cooled"], showIf: { key: "subType", in: ["ATV", "Side-by-Side (UTV)"] } },
      { key: "winch", label: "Winch", type: "toggle", showIf: { key: "subType", in: ["ATV", "Side-by-Side (UTV)"] } },
      { key: "startType", label: "Start", type: "select", options: ["Electric", "Electric + Pull", "Pull"], showIf: { key: "subType", in: ["ATV", "Side-by-Side (UTV)"] } },
    ] },
    { title: "Personal watercraft", fields: [
      { key: "engineCcPwc", label: "Engine displacement", type: "number", unit: "cc", placeholder: "1630", showIf: { key: "subType", in: ["Personal Watercraft (PWC)"] } },
      { key: "seatingPwc", label: "Rider capacity", type: "select", options: ["1", "2", "3"], showIf: { key: "subType", in: ["Personal Watercraft (PWC)"] } },
      { key: "hoursPwc", label: "Engine hours", type: "number", unit: "hrs", placeholder: "45", showIf: { key: "subType", in: ["Personal Watercraft (PWC)"] } },
      { key: "superchargedPwc", label: "Supercharged", type: "toggle", showIf: { key: "subType", in: ["Personal Watercraft (PWC)"] } },
    ] },
    { title: "Snowmobile", fields: [
      { key: "engineCcSnow", label: "Engine displacement", type: "number", unit: "cc", placeholder: "850", showIf: { key: "subType", in: ["Snowmobile"] } },
      { key: "strokeSnow", label: "Stroke", type: "select", options: ["2-Stroke", "4-Stroke"], showIf: { key: "subType", in: ["Snowmobile"] } },
      { key: "trackLengthIn", label: "Track length", type: "number", unit: "in", placeholder: "137", showIf: { key: "subType", in: ["Snowmobile"] } },
      { key: "electricStartSnow", label: "Electric start", type: "toggle", showIf: { key: "subType", in: ["Snowmobile"] } },
      { key: "reverseSnow", label: "Reverse", type: "toggle", showIf: { key: "subType", in: ["Snowmobile"] } },
    ] },
    { title: "Electric / cart", fields: [
      { key: "powerGc", label: "Power", type: "select", options: ["Electric", "Gas"], showIf: { key: "subType", in: ["Golf Cart", "Electric Bike"] } },
      { key: "voltageGc", label: "Voltage", type: "select", options: ["36V", "48V", "72V", "Lithium"], showIf: { key: "subType", in: ["Golf Cart", "Electric Bike"] } },
      { key: "seatingGc", label: "Seating", type: "select", options: ["2", "4", "6"], showIf: { key: "subType", in: ["Golf Cart"] } },
    ] },
    { title: "Appearance & title", fields: [
      { key: "color", label: "Color", type: "text", placeholder: "Team Edition" },
      { key: "titleStatus", label: "Title status", type: "select", options: TITLE },
    ] },
  ],
};

/* ─────────────────────────  RV  ───────────────────────── */
const MOTORIZED_RV = ["Class A", "Class B (Camper Van)", "Class B+", "Class C", "Super C"];
const RV: CategoryDef = {
  id: "RV", label: "RV & Camper", noun: "RV", usageLabel: "Mileage", usageUnit: "mi",
  sections: [
    { title: "Class & type", fields: [
      { key: "condition", label: "Condition", type: "select", options: CONDITION },
      { key: "rvClass", label: "RV class", type: "select", options: [...MOTORIZED_RV, "Travel Trailer", "Fifth Wheel", "Toy Hauler", "Pop-Up Camper", "Truck Camper", "Teardrop", "Destination Trailer"] },
    ] },
    { title: "Dimensions & sleeping", fields: [
      { key: "lengthFt", label: "Length", type: "number", unit: "ft", placeholder: "32" },
      { key: "sleeps", label: "Sleeps", type: "number", unit: "people", placeholder: "6" },
      { key: "slideOuts", label: "Slide-outs", type: "number", placeholder: "2" },
      { key: "awnings", label: "Awnings", type: "number", placeholder: "1" },
    ] },
    { title: "Chassis & power", fields: [
      { key: "chassis", label: "Chassis", type: "select", options: ["Ford", "Freightliner", "Mercedes-Benz", "Chevrolet", "RAM", "Spartan", "Workhorse", "Ford Transit", "RAM ProMaster"], showIf: { key: "rvClass", in: MOTORIZED_RV } },
      { key: "rvFuel", label: "Fuel", type: "select", options: ["Gasoline", "Diesel"], showIf: { key: "rvClass", in: MOTORIZED_RV } },
      { key: "generatorWatts", label: "Generator", type: "number", unit: "W", placeholder: "4000" },
      { key: "acUnits", label: "A/C units", type: "number", placeholder: "2" },
      { key: "leveling", label: "Leveling", type: "select", options: ["Manual", "Electric Auto-Level", "Hydraulic Auto-Level"] },
    ] },
    { title: "Weights & towing", fields: [
      { key: "dryWeightLbs", label: "Dry weight (UVW)", type: "number", unit: "lbs", placeholder: "9,800" },
      { key: "gvwrLbs", label: "GVWR", type: "number", unit: "lbs", placeholder: "12,500" },
      { key: "hitchWeightLbs", label: "Hitch / pin weight", type: "number", unit: "lbs", placeholder: "1,200", showIf: { key: "rvClass", in: ["Travel Trailer", "Fifth Wheel", "Toy Hauler", "Pop-Up Camper", "Teardrop", "Destination Trailer"] } },
    ] },
    { title: "Tanks & systems", fields: [
      { key: "freshWaterGal", label: "Fresh water", type: "number", unit: "gal", placeholder: "54" },
      { key: "grayWaterGal", label: "Gray water", type: "number", unit: "gal", placeholder: "39" },
      { key: "blackWaterGal", label: "Black water", type: "number", unit: "gal", placeholder: "39" },
      { key: "propaneLbs", label: "Propane", type: "number", unit: "lbs", placeholder: "60" },
    ] },
    { title: "Appearance & title", fields: [
      { key: "exteriorColor", label: "Exterior color", type: "text", placeholder: "Champagne" },
      { key: "titleStatus", label: "Title status", type: "select", options: TITLE },
    ] },
  ],
};

/* ─────────────────────────  TRAILER  ───────────────────────── */
const TRAILER: CategoryDef = {
  id: "TRAILER", label: "Trailer", noun: "trailer", usageLabel: "", usageUnit: "",
  sections: [
    { title: "Type", fields: [
      { key: "condition", label: "Condition", type: "select", options: CONDITION },
      { key: "trailerType", label: "Trailer type", type: "select", options: ["Utility", "Enclosed Cargo", "Flatbed", "Dump", "Car Hauler", "Equipment", "Gooseneck", "Livestock", "Horse", "Boat", "Motorcycle", "Toy Hauler", "Tilt", "Vending / Concession", "Refrigerated Reefer"] },
    ] },
    { title: "Dimensions", fields: [
      { key: "lengthFt", label: "Length", type: "number", unit: "ft", placeholder: "20" },
      { key: "widthFt", label: "Width", type: "number", unit: "ft", placeholder: "8.5" },
      { key: "interiorHeightFt", label: "Interior height", type: "number", unit: "ft", placeholder: "7", showIf: { key: "trailerType", in: ["Enclosed Cargo", "Toy Hauler", "Horse", "Livestock", "Vending / Concession", "Refrigerated Reefer"] } },
    ] },
    { title: "Capacity & axles", fields: [
      { key: "gvwrLbs", label: "GVWR", type: "number", unit: "lbs", placeholder: "14,000" },
      { key: "payloadLbs", label: "Payload capacity", type: "number", unit: "lbs", placeholder: "9,900" },
      { key: "axles", label: "Axles", type: "select", options: ["1", "2", "3", "4"] },
      { key: "axleCapacityLbs", label: "Axle rating (each)", type: "number", unit: "lbs", placeholder: "7,000" },
      { key: "brakes", label: "Brakes", type: "select", options: ["None", "Electric", "Electric over Hydraulic", "Surge / Hydraulic"] },
    ] },
    { title: "Hitch & construction", fields: [
      { key: "hitchType", label: "Hitch type", type: "select", options: ["Bumper Pull", "Gooseneck", "5th Wheel", "Pintle"] },
      { key: "couplerSize", label: "Coupler / ball size", type: "select", options: ["1-7/8\"", "2\"", "2-5/16\"", "3\"", "Gooseneck Ball", "Pintle Ring"], showIf: { key: "hitchType", in: ["Bumper Pull", "Gooseneck", "Pintle"] } },
      { key: "construction", label: "Frame construction", type: "select", options: ["Steel", "Aluminum", "Steel & Aluminum", "Galvanized Steel"] },
      { key: "floorMaterial", label: "Floor / deck", type: "select", options: ["Wood", "Steel", "Aluminum", "Rubber", "Composite"] },
    ] },
    { title: "Features", fields: [
      { key: "ramp", label: "Loading ramp / gate", type: "toggle" },
      { key: "sideDoor", label: "Side access door", type: "toggle", showIf: { key: "trailerType", in: ["Enclosed Cargo", "Toy Hauler", "Vending / Concession"] } },
      { key: "spareTire", label: "Spare tire", type: "toggle" },
      { key: "color", label: "Color", type: "text", placeholder: "Charcoal" },
      { key: "titleStatus", label: "Title status", type: "select", options: TITLE },
    ] },
  ],
};

export const CATEGORIES: CategoryDef[] = [CAR, MOTORCYCLE, POWERSPORT, RV, TRAILER];
export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id) ?? CAR;

/** Whether a field should render given the current answers. */
export const fieldVisible = (f: Field, values: Record<string, unknown>) =>
  !f.showIf || f.showIf.in.includes(String(values[f.showIf.key] ?? ""));
