import React from "react";
import { OCCUPANCY_LABELS, OCCUPANCY_COLORS } from "../data/corridors.js";

/**
 * OccupancyBadge — Minimal color-coded chip showing crowd level.
 * @param {{ tier: 'low'|'moderate'|'high' }} props
 */
export default function OccupancyBadge({ tier = "low" }) {
  const label = OCCUPANCY_LABELS[tier] ?? "Seats Available";
  const color = OCCUPANCY_COLORS[tier] ?? "#16a34a";

  const dotStyle = {
    display: "inline-block",
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: color,
    marginRight: 5,
    flexShrink: 0,
  };

  const chipStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 9px 2px 7px",
    borderRadius: 20,
    fontSize: "0.68rem",
    fontWeight: 700,
    color,
    background: `${color}18`,
    border: `1px solid ${color}44`,
    letterSpacing: "0.01em",
    lineHeight: 1.6,
    whiteSpace: "nowrap",
  };

  return (
    <span style={chipStyle}>
      <span style={dotStyle} />
      {label}
    </span>
  );
}
