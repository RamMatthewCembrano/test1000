import { useState, useRef } from "react";
import {
  Clock,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Receipt,
  CalendarDays,
  CalendarSearch,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { C, HISTORY_FILTERS } from "./constants";
import { Pill, Lbl, HR } from "./AdminPrimitives";

// ── Helpers ───────────────────────────────────────────────────────────────────
const toDateKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const todayKey = () => toDateKey(new Date().toISOString());

const fmtDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// ── Order list ────────────────────────────────────────────────────────────────
const OrderList = ({ orders, filter }: { orders: any[]; filter: string }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const shown =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (shown.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 0",
          fontSize: 14,
          color: C.faint,
        }}
      >
        No {filter === "all" ? "" : filter} orders for this day.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {shown.map((order) => {
        const isOpen = openId === order.id;
        const isCompleted = order.status === "completed";
        const isCancelled = order.status === "cancelled";

        return (
          <div
            key={order.id}
            className="a-fade"
            style={{
              background: C.surface,
              borderRadius: 14,
              overflow: "hidden",
              border: `1.5px solid ${isCancelled ? "#FCA5A5" : C.border}`,
              opacity: isCancelled ? 0.7 : 1,
            }}
          >
            {/* Header row */}
            <div
              onClick={() =>
                setOpenId((v) => (v === order.id ? null : order.id))
              }
              style={{
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: C.lift,
                  color: C.mid,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                {order.table_number}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: C.ink,
                    marginBottom: 5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {order.customer_name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Pill status={order.status} />
                  <span
                    style={{
                      fontSize: 12,
                      color: C.faint,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Clock size={11} strokeWidth={1.5} />
                    {new Date(order.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 400,
                    color: isCancelled ? C.faint : C.ink,
                    letterSpacing: "-0.02em",
                    marginBottom: 4,
                    textDecoration: isCancelled ? "line-through" : "none",
                  }}
                >
                  ₱{Number(order.total_price).toFixed(0)}
                </div>
                <div style={{ color: C.faint }}>
                  {isOpen ? (
                    <ChevronUp size={14} strokeWidth={1.5} />
                  ) : (
                    <ChevronDown size={14} strokeWidth={1.5} />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded */}
            {isOpen && (
              <>
                <HR />
                <div style={{ padding: "14px 18px 16px" }}>
                  <div
                    style={{
                      background: C.lift,
                      borderRadius: 10,
                      padding: "12px",
                      marginBottom: 12,
                    }}
                  >
                    <Lbl t="Items ordered" />
                    {order.order_items?.map((item: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: `${i === 0 ? 0 : 7}px 0 7px`,
                          borderBottom:
                            i < order.order_items.length - 1
                              ? `1px solid ${C.line}`
                              : "none",
                        }}
                      >
                        <span style={{ fontSize: 14, color: C.body }}>
                          <span
                            style={{
                              color: C.faint,
                              marginRight: 6,
                              fontSize: 12,
                            }}
                          >
                            {item.quantity}×
                          </span>
                          {item.name}
                        </span>
                        {item.price && (
                          <span style={{ fontSize: 13, color: C.mid }}>
                            ₱{(item.price * item.quantity).toFixed(0)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div
                    style={{ fontSize: 13, color: C.faint, marginBottom: 12 }}
                  >
                    Payment —{" "}
                    <span style={{ color: C.mid, fontWeight: 500 }}>
                      {order.payment_method === "gcash"
                        ? "GCash"
                        : "Pay at Counter"}
                    </span>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {order.receipt_url && (
                      <button
                        onClick={() => window.open(order.receipt_url, "_blank")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "9px 14px",
                          borderRadius: 9,
                          fontSize: 13,
                          fontWeight: 500,
                          background: C.surface,
                          border: `1.5px solid ${C.border}`,
                          color: C.mid,
                          cursor: "pointer",
                        }}
                      >
                        <Receipt size={13} strokeWidth={1.5} /> Receipt
                      </button>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: isCompleted ? C.mid : "#DC2626",
                      }}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 size={13} strokeWidth={1.5} /> Completed
                          successfully
                        </>
                      ) : (
                        <>
                          <X size={13} strokeWidth={1.5} /> Order was cancelled
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Summary strip ─────────────────────────────────────────────────────────────
const SummaryStrip = ({ orders }: { orders: any[] }) => {
  const revenue = orders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + Number(o.total_price), 0);

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
      {[
        {
          label: "Revenue",
          value: `₱${revenue.toLocaleString()}`,
          color: C.ink,
        },
        {
          label: "Completed",
          value: orders.filter((o) => o.status === "completed").length,
          color: C.ink,
        },
        {
          label: "Cancelled",
          value: orders.filter((o) => o.status === "cancelled").length,
          color: "#DC2626",
        },
      ].map((s) => (
        <div
          key={s.label}
          style={{
            flex: 1,
            background: C.surface,
            border: `1.5px solid ${C.border}`,
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: C.faint,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 6,
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 300,
              color: s.color,
              letterSpacing: "-0.02em",
            }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export const HistoryPanel = ({
  orders,
  onOrdersChange,
}: {
  orders: any[];
  onOrdersChange: (updated: any[]) => void;
}) => {
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [mode, setMode] = useState<"today" | "lookup">("today");
  const [showConfirm, setShowConfirm] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const maxDate = todayKey();
  const displayDate = mode === "today" ? todayKey() : selectedDate;
  const dayOrders = orders.filter(
    (o) => toDateKey(o.created_at) === displayDate,
  );
  const isToday = displayDate === todayKey();

  // Count how many orders are older than 60 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const oldCount = orders.filter(
    (o) =>
      new Date(o.created_at) < cutoff &&
      (o.status === "completed" || o.status === "cancelled"),
  ).length;

  const openDatePicker = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch {
        dateInputRef.current.click();
      }
    }
  };

  const browseLabel =
    mode === "lookup"
      ? new Date(
          Number(selectedDate.split("-")[0]),
          Number(selectedDate.split("-")[1]) - 1,
          Number(selectedDate.split("-")[2]),
        ).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Browse by Date";

  // ── Delete old orders ──────────────────────────────────────────────────────
  const clearOldHistory = async () => {
    setCleaning(true);
    const { error } = await supabase
      .from("orders")
      .delete()
      .lt("created_at", cutoff.toISOString())
      .in("status", ["completed", "cancelled"]);

    if (error) {
      toast.error("Failed to clear history: " + error.message);
    } else {
      // Remove deleted orders from local state immediately
      onOrdersChange(
        orders.filter(
          (o) =>
            !(
              new Date(o.created_at) < cutoff &&
              (o.status === "completed" || o.status === "cancelled")
            ),
        ),
      );
      toast.success(
        `Cleared ${oldCount} old order${oldCount !== 1 ? "s" : ""}`,
      );
    }
    setCleaning(false);
    setShowConfirm(false);
  };

  return (
    <div>
      {/* ── Confirm delete modal ── */}
      {showConfirm && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => !cleaning && setShowConfirm(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 60,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
          />
          {/* Modal */}
          <div
            style={{
              position: "fixed",
              zIndex: 70,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100% - 36px)",
              maxWidth: 400,
              background: C.surface,
              borderRadius: 20,
              border: `1.5px solid ${C.border}`,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
              padding: "28px 24px",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={22} strokeWidth={1.5} color="#DC2626" />
            </div>

            <div
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: C.ink,
                marginBottom: 8,
                letterSpacing: "-0.01em",
              }}
            >
              Clear Old History?
            </div>
            <div
              style={{
                fontSize: 14,
                color: C.mid,
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              This will permanently delete{" "}
              <span style={{ fontWeight: 600, color: C.ink }}>
                {oldCount} order{oldCount !== 1 ? "s" : ""}
              </span>{" "}
              older than 60 days. This cannot be undone.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={cleaning}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: `1.5px solid ${C.border}`,
                  background: C.surface,
                  color: C.mid,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={clearOldHistory}
                disabled={cleaning}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#DC2626",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: cleaning ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  opacity: cleaning ? 0.7 : 1,
                }}
              >
                {cleaning ? (
                  <>
                    <Loader2
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} strokeWidth={1.5} />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Top row: mode toggle + clear button ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {/* Today button */}
        <button
          onClick={() => setMode("today")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 18px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 500,
            border: `1.5px solid ${mode === "today" ? C.ink : C.border}`,
            background: mode === "today" ? C.ink : C.surface,
            color: mode === "today" ? C.white : C.mid,
            cursor: "pointer",
            transition: "all 0.15s",
            flexShrink: 0,
          }}
        >
          <CalendarDays size={14} strokeWidth={1.5} />
          Today
        </button>

        {/* Browse by Date */}
        <button
          onClick={openDatePicker}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 18px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 500,
            border: `1.5px solid ${mode === "lookup" ? C.ink : C.border}`,
            background: mode === "lookup" ? C.ink : C.surface,
            color: mode === "lookup" ? C.white : C.mid,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <CalendarSearch size={14} strokeWidth={1.5} />
          {browseLabel}
        </button>

        {/* Hidden date input */}
        <input
          ref={dateInputRef}
          type="date"
          max={maxDate}
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) {
              setSelectedDate(e.target.value);
              setMode("lookup");
            }
          }}
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        />

        {/* Clear old history button — always visible */}
        <button
          onClick={() => {
            if (oldCount === 0) {
              toast("No old history", {
                description:
                  "There are no orders older than 2 months to delete.",
              });
              return;
            }
            setShowConfirm(true);
          }}
          title="Delete orders older than 2 months"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 14px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 500,
            border: `1.5px solid ${oldCount > 0 ? "#FECACA" : C.border}`,
            background: oldCount > 0 ? "#FEF2F2" : C.surface,
            color: oldCount > 0 ? "#DC2626" : C.faint,
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Date heading ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>
          {isToday ? "Today — " : ""}
          {fmtDate(displayDate)}
        </div>
        {isToday && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: C.ink,
              color: C.white,
              padding: "3px 8px",
              borderRadius: 99,
            }}
          >
            Live
          </span>
        )}
      </div>

      {/* ── Summary strip ── */}
      <SummaryStrip orders={dayOrders} />

      {/* ── Filter pills ── */}
      <div
        style={{
          display: "flex",
          gap: 7,
          marginBottom: 16,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {HISTORY_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flexShrink: 0,
              padding: "8px 16px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
              border: `1.5px solid ${filter === f ? C.ink : C.border}`,
              background: filter === f ? C.ink : C.surface,
              color: filter === f ? C.white : C.mid,
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Order list ── */}
      <OrderList orders={dayOrders} filter={filter} />
    </div>
  );
};