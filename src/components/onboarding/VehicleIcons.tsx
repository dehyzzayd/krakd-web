/**
 * Hand-built vehicle-category icons — one consistent grid, 1.6 stroke, round
 * joins, currentColor. Minimal line marks tuned to sit on the light theme.
 */
type P = { className?: string };

const svg = "h-6 w-6";
const common = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CarsTrucks({ className = svg }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} aria-hidden>
      <path d="M2.5 14.5v-2.2h8.3V8.7h3.4l2.6 3.1h2.2a1.5 1.5 0 0 1 1.5 1.5v1.2h-1.7" />
      <path d="M2.5 14.5h1.4M9.4 14.5h6M18.6 14.5h.4" />
      <circle cx="6.6" cy="14.7" r="1.9" />
      <circle cx="16.9" cy="14.7" r="1.9" />
    </svg>
  );
}

export function Motorcycle({ className = svg }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} aria-hidden>
      <circle cx="5.4" cy="15" r="3.2" />
      <circle cx="18.6" cy="15" r="3.2" />
      <path d="M5.4 15l3.1-4.8h4.2l2.2 3.6" />
      <path d="M7.6 10.2H5.9M12.7 10.2l2.2 3.4M15 8.4h3" />
    </svg>
  );
}

export function Powersports({ className = svg }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} aria-hidden>
      <circle cx="5.2" cy="15.4" r="2.7" />
      <circle cx="18.8" cy="15.4" r="2.7" />
      <path d="M5.2 15.4h13.6M7.4 15l1.5-3.6h5l1.9 3.6" />
      <path d="M9 11.4V9.2h3.6M13 9.2l3 1.1" />
    </svg>
  );
}

export function GolfCart({ className = svg }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} aria-hidden>
      <path d="M4 15.5v-4h8.5M4 15.5h1.2M8.6 15.5h5.4" />
      <path d="M12.5 15.5l1.6-4h3.3l1.6 4h.5" />
      <path d="M5 11.5V6.5h8v5M5 6.5h9.2" />
      <circle cx="6.9" cy="16" r="1.7" />
      <circle cx="16.4" cy="16" r="1.7" />
    </svg>
  );
}

export function RV({ className = svg }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} aria-hidden>
      <path d="M2.5 15.2V8.8A1.3 1.3 0 0 1 3.8 7.5h10.5l4.2 3.6v4.1" />
      <path d="M2.5 15.2h2.4M9 15.2h6.6M19.3 15.2h1.7" />
      <path d="M5.2 10h4.3v3H5.2zM13 10h1.6" />
      <circle cx="7" cy="15.4" r="1.8" />
      <circle cx="17.4" cy="15.4" r="1.8" />
    </svg>
  );
}

export function CustomVehicle({ className = svg }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} aria-hidden>
      <path d="M14.8 6.6a3.4 3.4 0 0 0-4.5 4.2l-4.6 4.6a1.6 1.6 0 0 0 2.3 2.3l4.6-4.6a3.4 3.4 0 0 0 4.2-4.5l-2.1 2.1-1.9-.5-.5-1.9z" />
    </svg>
  );
}

export const VEHICLE_TYPES = [
  { id: "cars", label: "Cars & Trucks", Icon: CarsTrucks },
  { id: "moto", label: "Motorcycles", Icon: Motorcycle },
  { id: "power", label: "Powersports", Icon: Powersports },
  { id: "golf", label: "Golf Carts", Icon: GolfCart },
  { id: "rv", label: "RVs & Campers", Icon: RV },
  { id: "custom", label: "Custom / Other", Icon: CustomVehicle },
];
