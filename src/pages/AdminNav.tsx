import {
  LogOut,
  ClipboardList,
  LayoutGrid,
  History,
  Images,
  Settings,
} from "lucide-react";
import { C } from "./constants";

type TabKey = "orders" | "inventory" | "history" | "carousel" | "settings";

// ── Top bar ───────────────────────────────────────────────────────────────────
interface TopBarProps {
  pending: number;
  onLogout: () => void;
}

export const AdminTopBar = ({ pending, onLogout }: TopBarProps) => (
  <header
    className="adm-topbar"
    style={{
      position: "sticky",
      top: 0,
      zIndex: 30,
      background: "rgba(247,247,247,0.92)",
      backdropFilter: "blur(10px)",
      borderBottom: `1px solid ${C.border}`,
      padding: "0 18px",
      height: 80,
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
    }}
  >
    <div />
    <img
      src="/PAPICHOLOS-LOGO.png"
      alt="Papicholo's CDO"
      style={{
        height: 64,
        width: "auto",
        objectFit: "contain",
        display: "block",
      }}
    />
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        justifyContent: "flex-end",
      }}
    >
      {pending > 0 && (
        <span
          style={{
            background: C.ink,
            color: C.white,
            fontSize: 12,
            fontWeight: 500,
            padding: "4px 11px",
            borderRadius: 99,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {pending} pending
        </span>
      )}
      <button
        onClick={onLogout}
        style={{
          background: C.surface,
          border: `1.5px solid ${C.border}`,
          borderRadius: 9,
          padding: "7px 12px",
          fontSize: 13,
          fontWeight: 400,
          color: C.mid,
          display: "flex",
          alignItems: "center",
          gap: 5,
          cursor: "pointer",
        }}
      >
        <LogOut size={13} strokeWidth={1.5} /> Logout
      </button>
    </div>
  </header>
);

// ── Mobile bottom nav ─────────────────────────────────────────────────────────
interface BottomNavProps {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  pending: number;
}

const NAV: { key: TabKey; Icon: any; label: string }[] = [
  { key: "orders", Icon: ClipboardList, label: "Orders" },
  { key: "inventory", Icon: LayoutGrid, label: "Inventory" },
  { key: "history", Icon: History, label: "History" },
  { key: "carousel", Icon: Images, label: "Carousel" },
  { key: "settings", Icon: Settings, label: "Checkout Settings" },
];

export const AdminBottomNav = ({ tab, setTab, pending }: BottomNavProps) => (
  <nav
    className="adm-bottomnav"
    style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: "rgba(255,255,255,0.96)",
      backdropFilter: "blur(10px)",
      borderTop: `1px solid ${C.border}`,
      display: "flex",
      padding: "10px 12px",
      paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
      gap: 8,
    }}
  >
    {NAV.map(({ key, Icon, label }) => {
      const active = tab === key;
      const badge = key === "orders" ? pending : 0;
      return (
        <button
          key={key}
          onClick={() => setTab(key)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            padding: "10px 8px",
            border: "none",
            borderRadius: 99,
            background: active ? C.ink : "transparent",
            color: active ? C.white : C.faint,
            fontSize: 12,
            fontWeight: 500,
            transition: "all 0.15s",
            position: "relative",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon size={17} strokeWidth={active ? 1.75 : 1.5} />
            {badge > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -5,
                  right: -8,
                  background: active ? C.white : C.ink,
                  color: active ? C.ink : C.white,
                  borderRadius: "50%",
                  width: 15,
                  height: 15,
                  fontSize: 9,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {badge}
              </span>
            )}
          </div>
          <span>{label}</span>
        </button>
      );
    })}
  </nav>
);
