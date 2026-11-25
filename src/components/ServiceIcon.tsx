import React from "react";
import {
  Droplets,
  Droplet,
  ClipboardCheck,
  Wind,
  Disc,
  ShieldCheck,
  BatteryCharging,
  BatteryFull,
  Thermometer,
  Cpu,
  Wrench,
} from "lucide-react";

export function ServiceIcon({
  name,
  className = "h-5 w-5",
}: {
  name?: string | null;
  className?: string;
}) {
  switch (name) {
    case "Droplets":
      return <Droplets className={className} aria-hidden="true" />;
    case "Droplet":
      return <Droplet className={className} aria-hidden="true" />;
    case "ClipboardCheck":
      return <ClipboardCheck className={className} aria-hidden="true" />;
    case "Wind":
      return <Wind className={className} aria-hidden="true" />;
    case "Disc":
      return <Disc className={className} aria-hidden="true" />;
    case "ShieldCheck":
      return <ShieldCheck className={className} aria-hidden="true" />;
    case "BatteryCharging":
      return <BatteryCharging className={className} aria-hidden="true" />;
    case "BatteryFull":
      return <BatteryFull className={className} aria-hidden="true" />;
    case "Thermometer":
      return <Thermometer className={className} aria-hidden="true" />;
    case "Cpu":
      return <Cpu className={className} aria-hidden="true" />;
    default:
      return <Wrench className={className} aria-hidden="true" />;
  }
}
