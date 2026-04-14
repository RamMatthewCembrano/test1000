import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import MenuCard from "./MenuCard";

const MenuGrid = () => {
  const [active, setActive] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [{ data: menuData, error: menuError }, { data: catData }] =
        await Promise.all([
          supabase
            .from("menu_items")
            .select("*")
            .order("name", { ascending: true }),
          supabase
            .from("categories")
            .select("name")
            .order("name", { ascending: true }),
        ]);

      if (menuError) {
        console.error("Error fetching menu:", menuError.message);
      } else if (menuData) {
        setItems(menuData);
      }

      if (catData) {
        setCategories(catData.map((c: any) => c.name));
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const dynamicCategories = ["All", ...categories];

  const filtered =
    active === "All" ? items : items.filter((i) => i.category === active);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Loading Papicholo's Menu...
      </div>
    );
  }

  return (
    <section className="px-4 py-6">
      {/* ── Mobile: dropdown (< sm) ── */}
      <div className="relative mb-5 sm:hidden">
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm"
        >
          <span>{active}</span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActive(cat);
                  setDropdownOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                  active === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop: pill tabs (≥ sm) ── */}
      <div className="mb-5 hidden gap-2 overflow-x-auto pb-2 scrollbar-hide sm:flex">
        {dynamicCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              active === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.length > 0 ? (
          filtered.map((item) => <MenuCard key={item.id} item={item} />)
        ) : (
          <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
            No items found in this category.
          </div>
        )}
      </div>
    </section>
  );
};

export default MenuGrid;
