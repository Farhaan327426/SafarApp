import React, { useState, useMemo } from "react";
import { MapPin, Bus, Clock, ArrowRight, Search, ChevronDown, ChevronUp, Navigation } from "lucide-react";
import { JK_CORRIDORS, searchCorridors, getStageFare } from "../data/corridors.js";
import OccupancyBadge from "./OccupancyBadge.jsx";

const VEHICLE_TYPE_LABELS = {
  bus:        "🚌 Bus",
  matador:    "🚌 Matador",
  sumo:       "🚙 Sumo",
  "shared-cab": "🚙 Shared Cab",
  "tata-magic": "🚐 Tata Magic",
  "e-rickshaw": "⚡ E-Rickshaw",
  taxi:       "🚕 Taxi",
  "suv-taxi": "🚙 SUV Taxi",
};

/** Chronological stop timeline for a single corridor */
function StageTimeline({ stages }) {
  return (
    <div style={{ position: "relative", paddingLeft: 24, marginTop: 8 }}>
      {/* Vertical connector line */}
      <div
        style={{
          position: "absolute",
          left: 10,
          top: 8,
          bottom: 8,
          width: 2,
          background: "linear-gradient(to bottom, #234b4c, #d36b3d)",
          borderRadius: 2,
        }}
      />
      {stages.map((stage, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === stages.length - 1;
        return (
          <div
            key={stage.stopId}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              marginBottom: isLast ? 0 : 16,
            }}
          >
            {/* Stop dot */}
            <div
              style={{
                position: "absolute",
                left: -20,
                top: 4,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: isFirst ? "#234b4c" : isLast ? "#d36b3d" : "#ffffff",
                border: `2px solid ${isFirst ? "#234b4c" : isLast ? "#d36b3d" : "#234b4c"}`,
                boxShadow: isFirst || isLast ? "0 0 0 3px rgba(35,75,76,0.12)" : "none",
                zIndex: 1,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: isFirst || isLast ? 700 : 600,
                    color: isFirst || isLast ? "#234b4c" : "#345657",
                  }}
                >
                  {stage.stopName}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.68rem", color: "#78908a", fontWeight: 500 }}>
                    {stage.kmFromSource} km
                  </span>
                  {stage.statutoryFare > 0 && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#234b4c",
                        background: "#eaf0e9",
                        border: "1px solid #d8e3d8",
                        borderRadius: 8,
                        padding: "1px 7px",
                      }}
                    >
                      ₹{stage.statutoryFare}
                    </span>
                  )}
                  {stage.statutoryFare === 0 && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "#16a34a",
                        fontWeight: 700,
                        background: "#dcfce7",
                        border: "1px solid #bbf7d0",
                        borderRadius: 8,
                        padding: "1px 7px",
                      }}
                    >
                      Origin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Single corridor card */
function CorridorCard({ corridor, onUseRoute }) {
  const [expanded, setExpanded] = useState(false);

  const lastStop = corridor.stages[corridor.stages.length - 1];
  const totalDistance = lastStop?.kmFromSource ?? 0;
  const totalFare = lastStop?.statutoryFare ?? 0;

  return (
    <div
      style={{
        background: "#fbfcf8",
        border: "1px solid #dce5dc",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 1px 6px rgba(35,75,76,0.06)",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Card Header */}
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "#234b4c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Bus size={18} color="#f2bd70" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "#557b72",
                  background: "#eaf0e9",
                  border: "1px solid #d8e3d8",
                  borderRadius: 6,
                  padding: "1px 6px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {corridor.id}
              </span>
              <OccupancyBadge tier={corridor.occupancyTier} />
            </div>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "#234b4c",
                margin: "4px 0 2px",
                lineHeight: 1.3,
              }}
            >
              {corridor.name}
            </h3>
            <p style={{ fontSize: "0.7rem", color: "#78908a", margin: 0 }}>
              {corridor.highway}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {[
            { icon: <Clock size={12} />, label: "First Trip", value: corridor.firstTrip },
            { icon: <Navigation size={12} />, label: "Distance", value: `${totalDistance} km` },
            { icon: <ArrowRight size={12} />, label: "Frequency", value: corridor.frequencyText },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              style={{
                background: "#f5f7f3",
                border: "1px solid #e5ece3",
                borderRadius: 10,
                padding: "6px 8px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  color: "#557b72",
                  marginBottom: 2,
                }}
              >
                {icon}
                <span style={{ fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {label}
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#234b4c" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Vehicle types */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {corridor.vehicleTypes.map((vt) => (
            <span
              key={vt}
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                color: "#345657",
                background: "#edf3eb",
                border: "1px solid #d2e4d4",
                borderRadius: 8,
                padding: "2px 8px",
              }}
            >
              {VEHICLE_TYPE_LABELS[vt] ?? vt}
            </span>
          ))}
        </div>

        {/* Full route fare highlight */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #eaf0e9, #f5f7f3)",
            border: "1px solid #d8e3d8",
            borderRadius: 12,
            padding: "8px 12px",
            marginBottom: 10,
          }}
        >
          <div>
            <p style={{ fontSize: "0.62rem", color: "#78908a", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Full Route Fare (SRO-97)
            </p>
            <p style={{ fontSize: "1rem", fontWeight: 800, color: "#234b4c", margin: "1px 0 0" }}>
              ₹{totalFare}{" "}
              <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "#78908a" }}>per seat</span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.62rem", color: "#78908a", fontWeight: 600, margin: 0 }}>Last Trip</p>
            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#557b72", margin: "1px 0 0" }}>
              {corridor.lastTrip}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "8px 12px",
              borderRadius: 12,
              border: "1px solid #dce5dc",
              background: "#f0f4ee",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#345657",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? "Hide Stops" : `All ${corridor.stages.length} Stops`}
          </button>
          {onUseRoute && (
            <button
              onClick={() =>
                onUseRoute({
                  from: corridor.stages[0]?.stopName,
                  to: corridor.stages[corridor.stages.length - 1]?.stopName,
                  distance: totalDistance,
                })
              }
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "8px 12px",
                borderRadius: 12,
                border: "1px solid #234b4c",
                background: "#234b4c",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#f4f6ed",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              <MapPin size={13} />
              Calculate Fare
            </button>
          )}
        </div>
      </div>

      {/* Expandable stage timeline */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid #e5ece3",
            padding: "14px 18px 18px",
            background: "#f9fbf8",
          }}
        >
          <p
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#557b72",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 12,
            }}
          >
            Stage-by-Stage Stops & Fares
          </p>
          <StageTimeline stages={corridor.stages} />
          <p
            style={{
              fontSize: "0.62rem",
              color: "#78908a",
              marginTop: 12,
              fontStyle: "italic",
            }}
          >
            ₹ fares are per-seat official SRO-97 ceiling rates from route origin.
            Alight at any intermediate stage for proportional fare.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * StageExplorer — Interactive corridor search and stop visualizer.
 * Chalo-style Route & Stages tab.
 */
export default function StageExplorer({ onUseRoute }) {
  const [query, setQuery] = useState("");
  const filteredCorridors = useMemo(() => searchCorridors(query), [query]);

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, #234b4c 0%, #2c5b5c 60%, #345657 100%)",
          borderRadius: 24,
          padding: "24px 24px 28px",
          color: "#f4f6ed",
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.01em" }}>
            Routes & Stage Stops
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#c7dad0", margin: "0 0 18px" }}>
            Verified J&K corridors with stop-by-stop SRO-97 statutory fares
          </p>
          {/* Search input */}
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#78908a",
              }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search corridors, stops or highways…"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px 10px 40px",
                borderRadius: 14,
                border: "1.5px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.12)",
                color: "#f4f6ed",
                fontSize: "0.85rem",
                outline: "none",
                backdropFilter: "blur(4px)",
              }}
            />
          </div>
        </div>
        {/* Decorative mountain silhouette */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 180,
            height: 80,
            opacity: 0.07,
            background:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 80'%3E%3Cpolygon points='0,80 60,10 100,40 140,5 180,80' fill='white'/%3E%3C/svg%3E\") no-repeat bottom right",
            backgroundSize: "cover",
          }}
        />
      </section>

      {/* Results count */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <p style={{ fontSize: "0.75rem", color: "#78908a", fontWeight: 600, margin: 0 }}>
          {filteredCorridors.length} corridor{filteredCorridors.length !== 1 ? "s" : ""} found
        </p>
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{
              fontSize: "0.7rem",
              color: "#d36b3d",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              padding: 0,
            }}
          >
            Clear search
          </button>
        )}
      </div>

      {/* Corridor grid */}
      {filteredCorridors.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "#fbfcf8",
            borderRadius: 20,
            border: "1px solid #dce5dc",
          }}
        >
          <MapPin size={32} style={{ color: "#d36b3d", marginBottom: 12 }} />
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#234b4c", margin: "0 0 6px" }}>
            No corridors found
          </h3>
          <p style={{ fontSize: "0.8rem", color: "#78908a", margin: 0 }}>
            Try searching for a stop name like "Pampore" or a route like "Baramulla"
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))",
            gap: 16,
          }}
        >
          {filteredCorridors.map((corridor) => (
            <CorridorCard key={corridor.id} corridor={corridor} onUseRoute={onUseRoute} />
          ))}
        </div>
      )}

      {/* Statutory notice */}
      <div
        style={{
          marginTop: 20,
          padding: "10px 16px",
          borderRadius: 12,
          background: "#eaf0e9",
          border: "1px solid #d2e4d4",
          fontSize: "0.68rem",
          color: "#426a54",
          fontWeight: 500,
        }}
      >
        ✅ All fares are per-seat maximum ceiling rates under <strong>J&K Motor Vehicles Rules (SRO-97)</strong>. Drivers cannot legally charge above these amounts.
      </div>
    </div>
  );
}
