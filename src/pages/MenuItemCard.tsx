import { Loader2, Upload, Pencil, Trash2, Check } from "lucide-react";
import { C } from "./constants";
import { Btn, Lbl, HR } from "./AdminPrimitives";

interface MenuCardProps {
  item: any;
  isEditing: boolean;
  editForm: any;
  setEditForm: (f: any) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onImgClick: () => void;
  uploading: boolean;
  categories?: string[];
}

export const MenuItemCard = ({
  item,
  isEditing,
  editForm,
  setEditForm,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onImgClick,
  uploading,
  categories = [],
}: MenuCardProps) => {
  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        className="a-fade"
        style={{
          background: C.surface,
          border: `2px solid ${C.ink}`,
          borderRadius: 16,
          overflow: "hidden",
          gridColumn: "1 / -1",
        }}
      >
        {/* Photo zone */}
        <div
          onClick={onImgClick}
          style={{
            position: "relative",
            height: 140,
            background: C.lift,
            cursor: "pointer",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {editForm.image && (
            <img
              src={editForm.image}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.22,
              }}
            />
          )}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 9,
              padding: "9px 16px",
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 14,
              color: C.mid,
            }}
          >
            {uploading ? (
              <>
                <Loader2
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                Uploading…
              </>
            ) : (
              <>
                <Upload size={14} strokeWidth={1.5} /> Change photo
              </>
            )}
          </div>
        </div>

        {/* Form fields */}
        <div
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div>
            <Lbl t="Item Name" />
            <input
              value={editForm.name ?? ""}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <Lbl t="Price (₱)" />
              <input
                type="number"
                value={editForm.price ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, price: e.target.value })
                }
              />
            </div>
            <div>
              <Lbl t="Category" />
              <select
                value={editForm.category ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Lbl t="Description" />
            <textarea
              style={
                { minHeight: 76, resize: "vertical" } as React.CSSProperties
              }
              value={editForm.description ?? ""}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />
          </div>

          <div style={{ display: "flex", gap: 10, paddingTop: 2 }}>
            <Btn v="ghost" onClick={onCancel} full sx={{ fontSize: 14 }}>
              Cancel
            </Btn>
            <Btn onClick={onSave} full sx={{ fontSize: 14 }}>
              <Check size={14} strokeWidth={2} /> Save changes
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  // ── View mode ──────────────────────────────────────────────────────────────
  return (
    <div
      className="a-fade"
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column", // ← makes card stretch full height
      }}
    >
      {/* Image */}
      <div
        style={{
          position: "relative",
          aspectRatio: "4/3",
          background: C.lift,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={item.image}
          alt={item.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)",
          }}
        />
        <div style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.75)",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            {item.category}
          </span>
        </div>
      </div>

      {/* Info + actions — flex: 1 pushes buttons to bottom */}
      <div
        style={{
          padding: "14px 14px 16px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "flex-start",
            marginBottom: 5,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: C.ink,
              lineHeight: 1.3,
              flex: 1,
            }}
          >
            {item.name}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: C.ink,
              flexShrink: 0,
              letterSpacing: "-0.01em",
            }}
          >
            ₱{item.price}
          </div>
        </div>

        <div
          style={{
            fontSize: 13,
            color: C.faint,
            lineHeight: 1.55,
            marginBottom: 14,
            flex: 1,
          }}
        >
          {item.description?.length > 30
            ? `${item.description.slice(0, 30)}…`
            : item.description}
        </div>

        {/* Buttons always at the bottom */}
        <div>
          <HR />
          <div style={{ display: "flex", gap: 8, paddingTop: 12 }}>
            <Btn
              v="outline"
              onClick={onEdit}
              sx={{ flex: 1, fontSize: 13, padding: "9px 12px" }}
            >
              <Pencil size={13} strokeWidth={1.5} /> Edit
            </Btn>
            <Btn v="ghost" onClick={onDelete} sx={{ padding: "9px 12px" }}>
              <Trash2 size={13} strokeWidth={1.5} color={C.faint} />
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
};
