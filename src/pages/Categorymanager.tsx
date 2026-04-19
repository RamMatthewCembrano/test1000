import { useState } from "react";
import { X, Plus, Trash2, Tag, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { C } from "./constants";
import { Btn, Lbl } from "./AdminPrimitives";

interface CategoryManagerProps {
  categories: string[];
  onClose: () => void;
  onCategoriesChange: (cats: string[]) => void;
}

export const CategoryManager = ({
  categories,
  onClose,
  onCategoriesChange,
}: CategoryManagerProps) => {
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const addCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    if (categories.map((c) => c.toLowerCase()).includes(name.toLowerCase())) {
      toast.error("Category already exists");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("categories").insert([{ name }]);
    if (error) {
      toast.error("Failed to add category");
    } else {
      const updated = [...categories, name];
      onCategoriesChange(updated);
      setNewCat("");
      toast.success(`"${name}" added`);
    }
    setSaving(false);
  };

  const deleteCategory = async (name: string) => {
    // Check if any menu items use this category
    const { data: usedBy } = await supabase
      .from("menu_items")
      .select("id")
      .eq("category", name)
      .limit(1);

    if (usedBy && usedBy.length > 0) {
      toast.error(`"${name}" is used by menu items. Reassign them first.`);
      return;
    }

    if (!window.confirm(`Delete "${name}"?`)) return;
    setDeleting(name);
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("name", name);
    if (error) {
      toast.error("Failed to delete category");
    } else {
      onCategoriesChange(categories.filter((c) => c !== name));
      toast.success(`"${name}" removed`);
    }
    setDeleting(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          background: "rgba(0,0,0,0.4)",
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
          maxWidth: 440,
          background: C.surface,
          borderRadius: 20,
          border: `1.5px solid ${C.border}`,
          boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 22px",
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Tag size={17} strokeWidth={1.5} color={C.mid} />
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: C.ink,
                letterSpacing: "-0.01em",
              }}
            >
              Manage Categories
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: C.lift,
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.mid,
            }}
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{ padding: "20px 22px", maxHeight: "60vh", overflowY: "auto" }}
        >
          {/* Add new */}
          <div style={{ marginBottom: 24 }}>
            <Lbl t="New Category" />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="e.g. Appetizers"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                style={{ flex: 1 }}
              />
              <Btn
                onClick={addCategory}
                disabled={saving || !newCat.trim()}
                sx={{ padding: "11px 16px", flexShrink: 0 }}
              >
                {saving ? (
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <>
                    <Plus size={14} strokeWidth={1.5} /> Add
                  </>
                )}
              </Btn>
            </div>
          </div>

          {/* Existing categories */}
          <Lbl t={`Categories (${categories.length})`} />
          {categories.length === 0 ? (
            <div
              style={{
                fontSize: 14,
                color: C.faint,
                padding: "20px 0",
                textAlign: "center",
              }}
            >
              No categories yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {categories.map((cat) => (
                <div
                  key={cat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: C.lift,
                    borderRadius: 10,
                    padding: "11px 14px",
                    gap: 10,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: C.faint,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{ fontSize: 14, fontWeight: 500, color: C.body }}
                    >
                      {cat}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteCategory(cat)}
                    disabled={deleting === cat}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: C.faint,
                      display: "flex",
                      alignItems: "center",
                      padding: 4,
                      borderRadius: 6,
                      transition: "color 0.15s",
                    }}
                  >
                    {deleting === cat ? (
                      <Loader2
                        size={14}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <Trash2 size={14} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 12, color: C.faint, lineHeight: 1.5 }}>
            Categories sync live to your menu page. Deleting a category in use
            by menu items is blocked.
          </div>
        </div>
      </div>
    </>
  );
};
