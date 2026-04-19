// ── Inter font injection ───────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("adm-inter")) {
  const l = document.createElement("link");
  l.id = "adm-inter";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap";
  document.head.appendChild(l);
}

// ── Color tokens ──────────────────────────────────────────────────────────────
export const C = {
  bg:      "#F7F7F7",
  surface: "#FFFFFF",
  lift:    "#F2F2F2",
  border:  "#E8E8E8",
  line:    "#F0F0F0",
  ink:     "#0A0A0A",
  body:    "#1A1A1A",
  mid:     "#5A5A5A",
  faint:   "#AAAAAA",
  white:   "#FFFFFF",
};

export const f = "'Inter', system-ui, -apple-system, sans-serif";

// ── Global CSS ─────────────────────────────────────────────────────────────────
export const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; margin: 0; padding: 0; }
  html { font-family: ${f}; background: ${C.bg}; -webkit-text-size-adjust: 100%; }
  body { overscroll-behavior-y: none; }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 25%,75%{transform:translateX(-7px)} 50%{transform:translateX(7px)} }
  .a-shake { animation: shake 0.38s ease; }
  .a-fade  { animation: fadeUp 0.22s ease both; }
  input, select, textarea {
    font-family: ${f}; font-size: 15px; font-weight: 400; color: ${C.body};
    background: ${C.lift}; border: 1.5px solid ${C.border}; border-radius: 10px;
    padding: 12px 14px; width: 100%; outline: none;
    -webkit-appearance: none; appearance: none;
    transition: border-color 0.15s, box-shadow 0.15s; line-height: 1.5;
  }
  input:focus, select:focus, textarea:focus {
    border-color: ${C.ink}; box-shadow: 0 0 0 3px rgba(10,10,10,0.07);
  }
  input::placeholder, textarea::placeholder { color: ${C.faint}; }
  ::-webkit-scrollbar { width: 0; height: 0; }
  button { font-family: ${f}; cursor: pointer; }

  @media (min-width: 768px) {
    .adm-layout     { display: flex !important; flex-direction: row !important; }
    .adm-sidebar    { display: flex !important; }
    .adm-bottomnav  { display: none !important; }
    .adm-topbar     { padding: 0 32px !important; }
    .adm-main       { margin-left: 240px; }
    .adm-content    { padding: 36px 40px 40px !important; max-width: 800px; }
    .adm-stats      { grid-template-columns: repeat(5, 1fr) !important; }
    .adm-menu-grid  { grid-template-columns: repeat(3, 1fr) !important; }
    .adm-filter-row { flex-wrap: nowrap !important; }
  }
  @media (min-width: 1200px) {
    .adm-menu-grid  { grid-template-columns: repeat(4, 1fr) !important; }
  }
`;

// ── Status map ────────────────────────────────────────────────────────────────
export const ST: Record<string, { label: string; fg: string; bg: string }> = {
  pending:   { label: "Pending",   fg: "#5A5A5A", bg: "#EBEBEB" },
  preparing: { label: "Preparing", fg: "#92400E", bg: "#FEF3C7" },
  completed: { label: "Completed", fg: "#FFF",    bg: "#16A34A"    },
  cancelled: { label: "Cancelled", fg: "#FFF",    bg: "#DC2626" },
};
export const getSt = (s: string) => ST[s] ?? ST.pending;

// ── Menu categories ───────────────────────────────────────────────────────────
export const CATS = ["Tacos", "Burritos", "Sides", "Drinks", "Desserts"];

// ── Order filter options ──────────────────────────────────────────────────────
export const ORDER_FILTERS    = ["all", "pending", "preparing"];
export const HISTORY_FILTERS  = ["all", "completed", "cancelled"];