import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";

import { C, GLOBAL_CSS, ORDER_FILTERS } from "./constants";
import { Btn } from "./AdminPrimitives";
import { LoginGate } from "./LoginGate";
import { StatCards } from "./StatCards";
import { OrderCard } from "./OrderCard";
import { HistoryPanel } from "./Historypanel";
import { MenuItemCard } from "./MenuItemCard";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar, AdminBottomNav } from "./AdminNav";
import { CategoryManager } from "./Categorymanager";
import { CarouselManager } from "./Carouselmanager";
import { SettingsManager } from "./SettingsManager";

type TabKey = "orders" | "inventory" | "history" | "carousel" | "settings";

// ── Inlined sound alert ────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;
const _getCtx = () => {
  if (_audioCtx && _audioCtx.state !== "closed") return _audioCtx;
  try {
    _audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
  } catch {
    /* not supported */
  }
  return _audioCtx;
};
const _unlock = () => {
  const c = _getCtx();
  if (c?.state === "suspended") c.resume();
};
if (typeof window !== "undefined") {
  window.addEventListener("click", _unlock);
  window.addEventListener("touchstart", _unlock);
}
const _playDing = () => {
  const ctx = _getCtx();
  if (!ctx) return;
  const beep = (freq: number, start: number, dur: number) => {
    try {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(freq, ctx.currentTime + start);
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(0.35, ctx.currentTime + start + 0.02);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.05);
    } catch {
      /* ignore */
    }
  };
  const play = () => {
    beep(784, 0, 0.18);
    beep(988, 0.22, 0.3);
  };
  ctx.state === "suspended"
    ? ctx
      .resume()
      .then(play)
      .catch(() => { })
    : play();
};
const _useOrderAlert = (
  orders: any[],
  seenRef: React.MutableRefObject<Set<string>>,
  initRef: React.MutableRefObject<boolean>,
) => {
  useEffect(() => {
    if (!initRef.current) {
      orders.forEach((o) => seenRef.current.add(o.id));
      initRef.current = true;
      return;
    }
    let hasNew = false;
    orders.forEach((o) => {
      if (!seenRef.current.has(o.id)) {
        seenRef.current.add(o.id);
        hasNew = true;
      }
    });
    if (hasNew) _playDing();
  }, [orders]); // eslint-disable-line react-hooks/exhaustive-deps
};

export default function Admin() {
  const [authed, setAuthed] = useState(false);

  // ── Check existing Supabase session on mount ───────────────────────────────
  useEffect(() => {
    // Check if a session already exists (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });

    // Listen for auth state changes (login / logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);
  const [tab, setTab] = useState<TabKey>("orders");
  const [filter, setFilter] = useState("all");
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [carouselImages, setCarouselImages] = useState<any[]>([]);
  const [carouselEnabled, setCarouselEnabled] = useState(true);
  const [carouselSpeed, setCarouselSpeed] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isNewItem, setIsNewItem] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCatMgr, setShowCatMgr] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const seenOrderIds = useRef<Set<string>>(new Set());
  const alertInitialised = useRef(false);

  // ── Sound alert on new orders ──────────────────────────────────────────────
  _useOrderAlert(orders, seenOrderIds, alertInitialised);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      supabase.auth.signOut();
      toast("Session expired", {
        description: "You were logged out after 30 minutes of inactivity.",
      });
    }, INACTIVITY_MS);
  };

  // Start/reset timer on any user activity
  useEffect(() => {
    if (!authed) return;

    // Kick off the timer immediately on login
    resetInactivityTimer();

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach((e) =>
        window.removeEventListener(e, resetInactivityTimer),
      );
    };
  }, [authed]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = () => {
    // Session is handled by Supabase Auth — onAuthStateChange fires setAuthed(true)
    toast.success("Welcome back, Admin!");
  };
  const logout = async () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    await supabase.auth.signOut();
    // onAuthStateChange will fire setAuthed(false) automatically
  };

  // ── Data fetching + realtime ───────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;

    // Initial data fetch
    (async () => {
      setLoading(true);
      const [
        { data: m },
        { data: o },
        { data: cats },
        { data: cImgs },
        { data: cSettings },
      ] = await Promise.all([
        supabase.from("menu_items").select("*").order("name"),
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("name").order("name"),
        supabase
          .from("carousel_images")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase.from("carousel_settings").select("*").eq("id", 1).single(),
      ]);
      if (m) setItems(m);
      if (o) setOrders(o);
      if (cats) setCategories(cats.map((c: any) => c.name));
      if (cImgs) setCarouselImages(cImgs);
      if (cSettings) {
        setCarouselEnabled(cSettings.enabled ?? true);
        setCarouselSpeed(cSettings.speed ?? 0.8);
      }
      setLoading(false);
    })();

    // Realtime subscription — listens for INSERT and UPDATE
    const ch = supabase
      .channel("papi-admin-v2")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          // Re-fetch full row so order_items jsonb is always complete
          const { data } = await supabase
            .from("orders")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setOrders((prev) => {
              // Guard against duplicates if initial fetch already caught it
              if (prev.find((o) => o.id === data.id)) return prev;
              return [data, ...prev];
            });
            toast.success(`New order — Table ${data.table_number}`, {
              description: data.customer_name,
              duration: 5000,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          // Keep state in sync if status is changed from another device
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? { ...o, ...payload.new } : o,
            ),
          );
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("[Realtime] Channel error — orders may not update live");
        }
      });

    return () => {
      supabase.removeChannel(ch);
    };
  }, [authed]);

  // ── Order actions ──────────────────────────────────────────────────────────
  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (!error) {
      setOrders((p) => p.map((o) => (o.id === id ? { ...o, status } : o)));
      if (status === "preparing") toast.success("Order is now being prepared");
      if (status === "completed") toast.success("Order marked as served ✓");
      if (status === "cancelled")
        toast("Order cancelled", { description: "Moved to history" });
    }
  };

  // ── Menu actions ───────────────────────────────────────────────────────────
  const uploadImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const path = `menu/${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage
      .from("menu-items")
      .upload(path, file);

    if (e.target) e.target.value = "";

    if (!error) {
      const { data } = supabase.storage.from("menu-items").getPublicUrl(path);
      setEditForm((p: any) => ({ ...p, image: data.publicUrl }));
      toast.success("Photo updated");
    } else {
      console.error("Upload error:", error);
      toast.error(`Photo upload failed: ${error.message}`);
    }
    setUploading(false);
  };

  const saveItem = async () => {
    if (!editForm.name?.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (
      editForm.price === "" ||
      editForm.price === null ||
      editForm.price === undefined
    ) {
      toast.error("Price is required");
      return;
    }

    const sanitized = {
      name: editForm.name.trim(),
      description: editForm.description?.trim() ?? "",
      price: parseFloat(editForm.price) || 0,
      image: editForm.image ?? "/placeholder.svg",
      category: editForm.category ?? "",
    };

    if (isNewItem) {
      const { data, error } = await supabase
        .from("menu_items")
        .insert([sanitized])
        .select();
      if (!error && data) {
        setItems((p) => p.map((i) => (i.id === editId ? data[0] : i)));
        setEditId(null);
        setIsNewItem(false);
        toast.success("Item created");
      } else {
        toast.error(error?.message ?? "Failed to save item");
      }
    } else {
      const { error } = await supabase
        .from("menu_items")
        .update(sanitized)
        .eq("id", editId);
      if (!error) {
        setItems((p) =>
          p.map((i) => (i.id === editId ? { ...i, ...sanitized } : i)),
        );
        setEditId(null);
        toast.success("Saved");
      } else {
        toast.error(error?.message ?? "Failed to update item");
      }
    }
  };

  const cancelEdit = () => {
    if (isNewItem) {
      setItems((p) => p.filter((i) => i.id !== editId));
      setIsNewItem(false);
    }
    setEditId(null);
    setEditForm({});
  };

  const addItem = () => {
    const defaultCat = categories[0] ?? "Uncategorized";
    const tempId = `new-${Date.now()}`;
    const draft = {
      id: tempId,
      name: "",
      description: "",
      price: "",
      image: "/placeholder.svg",
      category: defaultCat,
    };
    setItems((p) => [draft, ...p]);
    setEditId(tempId);
    setEditForm(draft);
    setIsNewItem(true);
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm("Remove this item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (!error) {
      setItems((p) => p.filter((i) => i.id !== id));
      toast.success("Removed");
    }
  };

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!authed) return <LoginGate onLogin={login} />;

  // Active orders = pending + preparing only
  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing",
  );
  const historyOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "cancelled",
  );
  const pending = orders.filter((o) => o.status === "pending").length;
  const shown =
    filter === "all"
      ? activeOrders
      : activeOrders.filter((o) => o.status === filter);

  return (
    <div
      className="adm-layout"
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* Desktop sidebar */}
      <AdminSidebar
        tab={tab}
        setTab={setTab}
        pending={pending}
        onLogout={logout}
      />

      {/* Main content area */}
      <div
        className="adm-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <AdminTopBar pending={pending} onLogout={logout} />

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 80,
          }}
        >
          <div
            className="adm-content"
            style={{ maxWidth: 720, margin: "0 auto", padding: "24px 18px" }}
          >
            {/* ── Page heading — unique per tab ── */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: 28,
                      fontWeight: 500,
                      color: C.ink,
                      letterSpacing: "-0.025em",
                      lineHeight: 1.15,
                      marginBottom: 5,
                    }}
                  >
                    {tab === "orders"
                      ? "Orders"
                      : tab === "inventory"
                        ? "Inventory"
                        : tab === "history"
                          ? "Order History"
                          : tab === "settings"
                            ? "Checkout Settings"
                            : "Carousel"}
                  </h1>
                  <p style={{ fontSize: 14, color: C.faint, fontWeight: 400 }}>
                    {tab === "orders"
                      ? `${activeOrders.length} active · ${pending} pending`
                      : tab === "inventory"
                        ? `${items.length} item${items.length !== 1 ? "s" : ""} on the menu`
                        : tab === "history"
                          ? new Date().toLocaleDateString("en-PH", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "Manage your menu carousel"}
                  </p>
                </div>

                {/* Inventory action buttons — in the header */}
                {tab === "inventory" && (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <Btn
                      v="outline"
                      onClick={() => setShowCatMgr(true)}
                      sx={{ fontSize: 13, padding: "10px 14px" }}
                    >
                      <Tag size={13} strokeWidth={1.5} /> Categories
                    </Btn>
                    <Btn
                      onClick={addItem}
                      sx={{ fontSize: 13, padding: "10px 14px" }}
                    >
                      <Plus size={14} strokeWidth={1.5} /> Add item
                    </Btn>
                  </div>
                )}
              </div>
            </div>

            {/* Stats — orders and inventory tabs only */}
            {(tab === "orders" || tab === "inventory") && (
              <StatCards orders={orders} menuCount={items.length} />
            )}

            {/* Filter pills — orders tab only */}
            {tab === "orders" && (
              <div
                className="adm-filter-row"
                style={{
                  display: "flex",
                  gap: 7,
                  overflowX: "auto",
                  WebkitOverflowScrolling: "touch",
                  marginBottom: 18,
                  paddingBottom: 2,
                  flexWrap: "wrap",
                }}
              >
                {ORDER_FILTERS.map((fl) => (
                  <button
                    key={fl}
                    onClick={() => setFilter(fl)}
                    style={{
                      flexShrink: 0,
                      padding: "8px 16px",
                      borderRadius: 99,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      border: `1.5px solid ${filter === fl ? C.ink : C.border}`,
                      background: filter === fl ? C.ink : C.surface,
                      color: filter === fl ? C.white : C.mid,
                    }}
                  >
                    {fl.charAt(0).toUpperCase() + fl.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 0",
                  color: C.faint,
                }}
              >
                <Loader2
                  size={22}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              </div>
            )}

            {/* ── Orders tab ── */}
            {!loading && tab === "orders" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {shown.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "80px 0",
                      fontSize: 15,
                      color: C.faint,
                    }}
                  >
                    No active orders.
                  </div>
                ) : (
                  shown.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      onUpdateStatus={updateOrderStatus}
                    />
                  ))
                )}
              </div>
            )}

            {/* ── Inventory tab ── */}
            {!loading && tab === "inventory" && (
              <>
                <input
                  type="file"
                  ref={fileRef}
                  accept="image/*"
                  onChange={uploadImg}
                  style={{ display: "none" }}
                />
                <div
                  className="adm-menu-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 12,
                  }}
                >
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      isEditing={editId === item.id}
                      editForm={editForm}
                      setEditForm={setEditForm}
                      onEdit={() => {
                        setEditId(item.id);
                        setEditForm(item);
                        setIsNewItem(false);
                      }}
                      onCancel={cancelEdit}
                      onSave={saveItem}
                      onDelete={() => deleteItem(item.id)}
                      onImgClick={() => fileRef.current?.click()}
                      uploading={uploading}
                      categories={categories}
                    />
                  ))}
                </div>
              </>
            )}

            {/* ── History tab ── */}
            {!loading && tab === "history" && (
              <HistoryPanel
                orders={historyOrders}
                onOrdersChange={(updated) =>
                  setOrders((prev) =>
                    prev.filter(
                      (o) =>
                        o.status === "pending" ||
                        o.status === "preparing" ||
                        updated.find((u: any) => u.id === o.id),
                    ),
                  )
                }
              />
            )}

            {/* ── Carousel tab ── */}
            {!loading && tab === "carousel" && carouselSpeed !== null && (
              <CarouselManager
                images={carouselImages}
                enabled={carouselEnabled}
                speed={carouselSpeed}
                onImagesChange={setCarouselImages}
                onEnabledChange={setCarouselEnabled}
                onSpeedChange={(v) => setCarouselSpeed(v)}
              />
            )}

            {/* ── Settings tab ── */}
            {!loading && tab === "settings" && <SettingsManager />}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <AdminBottomNav tab={tab} setTab={setTab} pending={pending} />

      {/* Category manager modal */}
      {showCatMgr && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCatMgr(false)}
          onCategoriesChange={setCategories}
        />
      )}
    </div>
  );
}
