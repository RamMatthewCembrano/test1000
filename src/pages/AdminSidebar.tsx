import {
  ClipboardList,
  LayoutGrid,
  History,
  LogOut,
  Images,
} from "lucide-react";
import { C } from "./constants";

type TabKey = "orders" | "inventory" | "history" | "carousel";

interface AdminSidebarProps {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  pending: number;
  onLogout: () => void;
}

const NAV: { key: TabKey; Icon: any; label: string }[] = [
  { key: "orders", Icon: ClipboardList, label: "Orders" },
  { key: "inventory", Icon: LayoutGrid, label: "Inventory" },
  { key: "history", Icon: History, label: "History" },
  { key: "carousel", Icon: Images, label: "Carousel" },
];

export const AdminSidebar = ({
  tab,
  setTab,
  pending,
  onLogout,
}: AdminSidebarProps) => (
  <aside
    className="adm-sidebar"
    style={{
      display: "none",
      width: 240,
      flexShrink: 0,
      background: "#000",
      borderRight: "1px solid #1A1A1A",
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 40,
      flexDirection: "column",
      padding: "28px 0",
    }}
  >
    {/* Logo + active count */}
    <div style={{ padding: "0 24px 28px", borderBottom: "1px solid #1A1A1A" }}>
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}
      >
        <img
          src="/PAPICHOLOS-LOGO.png"
          alt="Papicholo's CDO"
          style={{ height: 72, width: "auto", objectFit: "contain" }}
        />
      </div>
      {pending > 0 && (
        <div
          style={{
            background: "#1A1A1A",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <span style={{ color: C.white, fontWeight: 600 }}>{pending}</span>{" "}
          pending order{pending !== 1 ? "s" : ""}
        </div>
      )}
    </div>

    {/* Nav */}
    <nav style={{ padding: "16px 12px", flex: 1 }}>
      {NAV.map(({ key, Icon, label }) => {
        const active = tab === key;
        const badge = key === "orders" ? pending : 0;
        return (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 14px",
              borderRadius: 10,
              border: "none",
              marginBottom: 2,
              background: active ? C.white : "transparent",
              color: active ? "#000" : "rgba(255,255,255,0.5)",
              fontSize: 14,
              fontWeight: 500,
              textAlign: "left",
              transition: "all 0.15s",
              cursor: "pointer",
            }}
          >
            <Icon size={17} strokeWidth={1.5} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && (
              <span
                style={{
                  background: active ? "#000" : C.white,
                  color: active ? C.white : "#000",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>

    {/* Footer */}
    <div style={{ padding: "16px 12px", borderTop: "1px solid #1A1A1A" }}>
      <button
        onClick={() => (window.location.href = "/")}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 10,
          border: "none",
          background: "transparent",
          color: "rgba(255,255,255,0.4)",
          fontSize: 14,
          fontWeight: 400,
          marginBottom: 4,
          cursor: "pointer",
        }}
      >
        View Live Site
      </button>
      <button
        onClick={onLogout}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 10,
          border: "none",
          background: "transparent",
          color: "rgba(255,255,255,0.4)",
          fontSize: 14,
          fontWeight: 400,
          cursor: "pointer",
        }}
      >
        <LogOut size={15} strokeWidth={1.5} /> Logout
      </button>
    </div>
  </aside>
);
