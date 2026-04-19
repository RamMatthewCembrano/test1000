// ── PASTE THIS into Admin.tsx ─────────────────────────────────────────────────
// Replace the entire existing useEffect (lines ~51–103) with this block.
// Also add this import at the top of Admin.tsx:
//   import { useOrderAlert } from "./useOrderAlert";
// And add this line inside the Admin component right after the orders state:
//   useOrderAlert(orders);
// ─────────────────────────────────────────────────────────────────────────────

useEffect(() => {
  if (!authed) return;

  // ── Initial data fetch ──────────────────────────────────────────────────
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

  // ── Realtime subscription ───────────────────────────────────────────────
  // Listens for new orders AND status updates so the board
  // reflects changes without any page refresh.
  const ch = supabase
    .channel("papi-admin-v2")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      async (payload) => {
        // Re-fetch the full order row so order_items jsonb is included
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("id", payload.new.id)
          .single();

        if (data) {
          setOrders((prev) => {
            // Avoid duplicates if the initial fetch already caught it
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
        // Keep local state in sync when status is changed from another device
        setOrders((prev) =>
          prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o)),
        );
      },
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[Realtime] Connected to orders channel");
      }
      if (status === "CHANNEL_ERROR") {
        console.warn("[Realtime] Channel error — orders may not update live");
      }
    });

  return () => {
    supabase.removeChannel(ch);
  };
}, [authed]);