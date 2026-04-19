import { useState, useRef } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Images,
  ToggleLeft,
  ToggleRight,
  Gauge,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { C } from "./constants";
import { Btn } from "./AdminPrimitives";

interface CarouselImage {
  id: string;
  url: string;
  label?: string;
}

interface CarouselManagerProps {
  images: CarouselImage[];
  enabled: boolean;
  speed: number;
  onImagesChange: (imgs: CarouselImage[]) => void;
  onEnabledChange: (v: boolean) => void;
  onSpeedChange: (v: number) => void;
}

const SPEEDS = [
  { label: "Slow", value: 0.3 },
  { label: "Medium", value: 0.8 },
  { label: "Fast", value: 1.5 },
  { label: "Ultra Fast", value: 2.0 },
];

export const CarouselManager = ({
  images,
  enabled,
  speed,
  onImagesChange,
  onEnabledChange,
  onSpeedChange,
}: CarouselManagerProps) => {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  // selectedSpeed drives the black highlight — always in sync
  const [selectedSpeed, setSelectedSpeed] = useState<number>(speed);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Toggle on/off ──────────────────────────────────────────────────────
  const toggleEnabled = async () => {
    setTogglingEnabled(true);
    const next = !enabled;
    const { error } = await supabase
      .from("carousel_settings")
      .update({ enabled: next })
      .eq("id", 1);
    if (error) toast.error("Failed to update setting");
    else {
      onEnabledChange(next);
      toast.success(next ? "Carousel enabled" : "Carousel hidden");
    }
    setTogglingEnabled(false);
  };

  // ── Set speed — instant UI, fire-and-forget save ───────────────────────
  const handleSpeedClick = (val: number) => {
    // Update highlight and carousel immediately — no waiting
    setSelectedSpeed(val);
    onSpeedChange(val);

    // Save to Supabase in background — no spinner, no blocking
    supabase
      .from("carousel_settings")
      .update({ speed: val })
      .eq("id", 1)
      .then(({ error }) => {
        if (error) toast.error("Failed to save speed");
        else
          toast.success(`Speed: ${SPEEDS.find((s) => s.value === val)?.label}`);
      });
  };

  // ── Upload image ───────────────────────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const path = `carousel/${Date.now()}.${file.name.split(".").pop()}`;
    const { error: uploadErr } = await supabase.storage
      .from("menu-items")
      .upload(path, file);
    if (uploadErr) {
      toast.error("Upload failed: " + uploadErr.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("menu-items")
      .getPublicUrl(path);
    const newImg = { url: urlData.publicUrl, label: file.name };
    const { data, error: insertErr } = await supabase
      .from("carousel_images")
      .insert([newImg])
      .select();

    if (insertErr || !data) toast.error("Failed to save image");
    else {
      onImagesChange([...images, data[0]]);
      toast.success("Image added");
    }

    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
  };

  // ── Delete image ───────────────────────────────────────────────────────
  const deleteImage = async (img: CarouselImage) => {
    if (!window.confirm("Remove this image from the carousel?")) return;
    setDeletingId(img.id);
    const { error } = await supabase
      .from("carousel_images")
      .delete()
      .eq("id", img.id);
    if (error) toast.error("Failed to remove image");
    else {
      onImagesChange(images.filter((i) => i.id !== img.id));
      toast.success("Image removed");
    }
    setDeletingId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Enable / disable ── */}
      <div
        style={{
          background: C.surface,
          border: `1.5px solid ${C.border}`,
          borderRadius: 14,
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: C.ink,
              marginBottom: 3,
            }}
          >
            Show Carousel
          </div>
          <div style={{ fontSize: 13, color: C.faint }}>
            {enabled ? "Visible on the menu page" : "Hidden from customers"}
          </div>
        </div>
        <button
          onClick={toggleEnabled}
          disabled={togglingEnabled}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: enabled ? C.ink : C.faint,
            padding: 0,
          }}
        >
          {togglingEnabled ? (
            <Loader2
              size={32}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : enabled ? (
            <ToggleRight size={44} strokeWidth={1.5} />
          ) : (
            <ToggleLeft size={44} strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* ── Speed selector ── */}
      <div
        style={{
          background: C.surface,
          border: `1.5px solid ${C.border}`,
          borderRadius: 14,
          padding: "18px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Gauge size={16} strokeWidth={1.5} color={C.mid} />
          <div style={{ fontSize: 15, fontWeight: 500, color: C.ink }}>
            Carousel Speed
          </div>
        </div>
        <div style={{ fontSize: 13, color: C.faint, marginBottom: 14 }}>
          Controls how fast images scroll across the footer.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          {SPEEDS.map((s) => {
            const active = selectedSpeed === s.value;
            return (
              <button
                key={s.value}
                onClick={() => handleSpeedClick(s.value)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 99,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  background: active ? "#000" : "#f0f0f0",
                  color: active ? "#fff" : "#555",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Upload ── */}
      <div
        style={{
          background: C.surface,
          border: `1.5px solid ${C.border}`,
          borderRadius: 14,
          padding: "18px 20px",
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: C.ink,
            marginBottom: 4,
          }}
        >
          Add Image
        </div>
        <div style={{ fontSize: 13, color: C.faint, marginBottom: 14 }}>
          Upload a photo or logo to display in the carousel.
        </div>
        <input
          type="file"
          ref={fileRef}
          accept="image/*"
          onChange={handleUpload}
          style={{ display: "none" }}
        />
        <Btn
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          sx={{ fontSize: 14, padding: "11px 18px" }}
        >
          {uploading ? (
            <>
              <Loader2
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />{" "}
              Uploading...
            </>
          ) : (
            <>
              <Plus size={14} strokeWidth={1.5} /> Upload Image
            </>
          )}
        </Btn>
      </div>

      {/* ── Image list ── */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: C.faint,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Carousel Images ({images.length})
      </div>

      {images.length === 0 ? (
        <div
          style={{
            background: C.surface,
            border: `1.5px dashed ${C.border}`,
            borderRadius: 14,
            padding: "40px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Images size={28} strokeWidth={1} color={C.faint} />
          <div style={{ fontSize: 14, color: C.faint }}>
            No images yet. Upload one above.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {images.map((img) => (
            <div
              key={img.id}
              style={{
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 8,
                  overflow: "hidden",
                  flexShrink: 0,
                  background: C.lift,
                }}
              >
                <img
                  src={img.url}
                  alt={img.label ?? "carousel"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: C.body,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {img.label ?? "Carousel image"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.faint,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {img.url}
                </div>
              </div>
              <button
                onClick={() => deleteImage(img)}
                disabled={deletingId === img.id}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: C.faint,
                  padding: 6,
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                {deletingId === img.id ? (
                  <Loader2
                    size={15}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <Trash2 size={15} strokeWidth={1.5} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};