import { useState, useEffect } from "react";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Receipt,
  Check,
  CheckCircle2,
  ChefHat,
  X,
  AlertTriangle,
} from "lucide-react";
import { C } from "./constants";
import { Pill, Btn, Lbl, HR } from "./AdminPrimitives";

// ── Age helpers ───────────────────────────────────────────────────────────────
const getAgeMinutes = (createdAt: string) => {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
};

const getAgeLabel = (mins: number) => {
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
};

// warm = 10–19 min, urgent = 20+ min
const getAgeLevel = (mins: number): "fresh" | "warm" | "urgent" => {
  if (mins >= 20) return "urgent";
  if (mins >= 10) return "warm";
  return "fresh";
};

const AGE_STYLES = {
  fresh: { color: C.faint, bg: "transparent", border: "transparent" },
  warm: { color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" },
  urgent: { color: "#991B1B", bg: "#FEE2E2", border: "#FECACA" },
};

// ── Age badge component ───────────────────────────────────────────────────────
const AgeBadge = ({
  createdAt,
  status,
}: {
  createdAt: string;
  status: string;
}) => {
  const [mins, setMins] = useState(() => getAgeMinutes(createdAt));

  // Tick every 30 seconds
  useEffect(() => {
    if (status !== "pending" && status !== "preparing") return;
    const id = setInterval(() => setMins(getAgeMinutes(createdAt)), 30000);
    return () => clearInterval(id);
  }, [createdAt, status]);

  if (status !== "pending" && status !== "preparing") return null;

  const level = getAgeLevel(mins);
  const s = AGE_STYLES[level];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        padding: level === "fresh" ? "0" : "3px 8px",
        borderRadius: 99,
        transition: "all 0.3s",
      }}
    >
      {level === "urgent" && (
        <AlertTriangle size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
      )}
      {level !== "urgent" && (
        <Clock size={11} strokeWidth={1.5} style={{ flexShrink: 0 }} />
      )}
      {getAgeLabel(mins)}
    </span>
  );
};

// ── Order card ────────────────────────────────────────────────────────────────
export const OrderCard = ({
  order,
  onUpdateStatus,
}: {
  order: any;
  onUpdateStatus: (id: string, status: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const { status } = order;
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";
  const isDone = isCompleted || isCancelled;

  // Derive border urgency for the card itself
  const [mins, setMins] = useState(() => getAgeMinutes(order.created_at));
  useEffect(() => {
    if (isDone) return;
    const id = setInterval(
      () => setMins(getAgeMinutes(order.created_at)),
      30000,
    );
    return () => clearInterval(id);
  }, [order.created_at, isDone]);

  const level = isDone ? "fresh" : getAgeLevel(mins);
  const cardBorder = isCancelled
    ? "#FCA5A5"
    : level === "urgent"
      ? "#FECACA"
      : level === "warm"
        ? "#FDE68A"
        : isDone
          ? C.border
          : "#D6D6D6";

  return (
    <div
      className="a-fade"
      style={{
        background: C.surface,
        borderRadius: 14,
        border: `1.5px solid ${cardBorder}`,
        overflow: "hidden",
        opacity: isDone ? 0.6 : 1,
        transition: "border-color 0.3s",
      }}
    >
      {/* ── Collapsed row ── */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          cursor: "pointer",
        }}
      >
        {/* Table badge */}
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            flexShrink: 0,
            background:
              level === "urgent" && !isDone
                ? "#FEE2E2"
                : level === "warm" && !isDone
                  ? "#FEF3C7"
                  : isDone
                    ? C.lift
                    : C.ink,
            color:
              level === "urgent" && !isDone
                ? "#991B1B"
                : level === "warm" && !isDone
                  ? "#92400E"
                  : isDone
                    ? C.mid
                    : C.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            transition: "background 0.3s, color 0.3s",
          }}
        >
          {order.table_number}
        </div>

        {/* Name + status + age */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: C.ink,
              marginBottom: 6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {order.customer_name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap" as const,
            }}
          >
            <Pill status={status} />
            <AgeBadge createdAt={order.created_at} status={status} />
          </div>
        </div>

        {/* Total + chevron */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: C.ink,
              letterSpacing: "-0.02em",
              marginBottom: 4,
            }}
          >
            ₱{Number(order.total_price).toFixed(0)}
          </div>
          <div style={{ color: C.faint }}>
            {open ? (
              <ChevronUp size={14} strokeWidth={1.5} />
            ) : (
              <ChevronDown size={14} strokeWidth={1.5} />
            )}
          </div>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {open && (
        <>
          <HR />
          <div style={{ padding: "16px 18px 18px" }}>
            {/* Items list */}
            <div
              style={{
                background: C.lift,
                borderRadius: 10,
                padding: "14px",
                marginBottom: 14,
              }}
            >
              <Lbl t="Items ordered" />
              {order.order_items?.map((item: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: `${i === 0 ? 0 : 8}px 0 8px`,
                    borderBottom:
                      i < order.order_items.length - 1
                        ? `1px solid ${C.line}`
                        : "none",
                  }}
                >
                  <span
                    style={{ fontSize: 15, color: C.body, fontWeight: 400 }}
                  >
                    <span
                      style={{ color: C.faint, marginRight: 6, fontSize: 13 }}
                    >
                      {item.quantity}×
                    </span>
                    {item.name}
                  </span>
                  {item.price && (
                    <span style={{ fontSize: 14, color: C.mid }}>
                      ₱{(item.price * item.quantity).toFixed(0)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Placed at timestamp */}
            <div style={{ fontSize: 13, color: C.faint, marginBottom: 8 }}>
              Placed at —{" "}
              <span style={{ color: C.mid, fontWeight: 500 }}>
                {new Date(order.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Payment method */}
            <div style={{ fontSize: 13, color: C.faint, marginBottom: 14 }}>
              Payment —{" "}
              <span style={{ color: C.mid, fontWeight: 500 }}>
                {order.payment_method === "gcash" ? "GCash" : "Pay at Counter"}
              </span>
            </div>

            {/* ── Action buttons by status ── */}

            {/* PENDING → Start Preparing + Cancel */}
            {status === "pending" && (
              <div style={{ display: "flex", gap: 8 }}>
                <Btn
                  onClick={() => onUpdateStatus(order.id, "preparing")}
                  sx={{ flex: 1, fontSize: 14 }}
                >
                  <ChefHat size={14} strokeWidth={1.5} /> Start Preparing
                </Btn>
                <Btn
                  v="ghost"
                  onClick={() => onUpdateStatus(order.id, "cancelled")}
                  sx={{
                    fontSize: 14,
                    padding: "11px 16px",
                    color: "#DC2626",
                    borderColor: "#FCA5A5",
                  }}
                >
                  <X size={14} strokeWidth={1.5} /> Cancel
                </Btn>
              </div>
            )}

            {/* PREPARING → Mark as Served */}
            {status === "preparing" && (
              <div style={{ display: "flex", gap: 8 }}>
                {order.receipt_url && (
                  <Btn
                    v="outline"
                    onClick={() => window.open(order.receipt_url, "_blank")}
                    sx={{ fontSize: 14, padding: "11px 14px" }}
                  >
                    <Receipt size={14} strokeWidth={1.5} /> Receipt
                  </Btn>
                )}
                <Btn
                  onClick={() => onUpdateStatus(order.id, "completed")}
                  sx={{ flex: 1, fontSize: 14 }}
                >
                  <Check size={14} strokeWidth={2} /> Mark as Served
                </Btn>
              </div>
            )}

            {/* COMPLETED */}
            {isCompleted && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 14,
                  color: C.faint,
                }}
              >
                <CheckCircle2 size={14} strokeWidth={1.5} /> Order completed
              </div>
            )}

            {/* CANCELLED */}
            {isCancelled && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 14,
                  color: "#DC2626",
                }}
              >
                <X size={14} strokeWidth={1.5} /> Order cancelled
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
