import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, UploadCloud, ImageIcon, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function SettingsManager() {
  const [uploading, setUploading] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [checkoutFee, setCheckoutFee] = useState<string>("0");
  const [savingFee, setSavingFee] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch the checkout fee
    const fetchFee = async () => {
      try {
        const { data, error } = await supabase.storage.from("menu-items").download("settings/checkout-fee.json");
        if (error) {
           // File might not exist yet, which is fine
           return;
        }
        const text = await data.text();
        const json = JSON.parse(text);
        if (json.fee !== undefined) {
           setCheckoutFee(json.fee.toString());
        }
      } catch (err) {
        console.error("Failed to load checkout fee:", err);
      }
    };
    fetchFee();
  }, []);

  const handleSaveFee = async () => {
    setSavingFee(true);
    try {
      const blob = new Blob([JSON.stringify({ fee: parseFloat(checkoutFee) || 0 })], { type: 'application/json' });
      const { error } = await supabase.storage
        .from("menu-items")
        .upload("settings/checkout-fee.json", blob, { upsert: true, cacheControl: '0' });
      
      if (error) throw error;
      toast.success("Checkout fee saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save fee");
    } finally {
      setSavingFee(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const path = `settings/gcash-qr.jpg`;

    try {
      const { error } = await supabase.storage
        .from("menu-items")
        .upload(path, file, { upsert: true, cacheControl: '0' });

      if (error) throw error;
      
      toast.success("QR Code updated successfully!");
      setTimestamp(Date.now()); // cache bust
    } catch (err: any) {
      toast.error(err.message || "Failed to upload QR Code");
    } finally {
      setUploading(false);
    }
  };

  const qrUrl = supabase.storage.from("menu-items").getPublicUrl("settings/gcash-qr.jpg").data.publicUrl;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">GCash QR Code</h2>
        <p className="text-sm text-gray-500 mb-6">Manage the GCash QR code displayed during checkout.</p>
        
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-gray-900">Current QR Code</Label>
          
          <div className="max-w-sm mx-auto aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative group">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : (
              <>
                <img 
                  src={`${qrUrl}?t=${timestamp}`} 
                  alt="GCash QR" 
                  className="w-full h-full object-contain p-4"
                  onError={(e) => {
                    // Fallback to local default if not uploaded yet
                    e.currentTarget.src = "/gcash-qr.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => fileRef.current?.click()}
                    className="bg-white text-black px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-50"
                  >
                    <UploadCloud size={16} />
                    Change QR
                  </button>
                </div>
              </>
            )}
          </div>

          <input 
            type="file" 
            ref={fileRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handleUpload} 
          />
          
          <button 
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
            {uploading ? "Uploading..." : "Upload New QR Code"}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Checkout Fee</h2>
        <p className="text-sm text-gray-500 mb-6">Set an additional fee to be added during checkout.</p>
        
        <div className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="checkoutFee">Extra Fee Amount (₱)</Label>
            <div className="flex gap-3">
              <Input 
                id="checkoutFee"
                type="number" 
                min="0"
                step="0.01"
                value={checkoutFee} 
                onChange={(e) => setCheckoutFee(e.target.value)} 
                className="flex-1"
                placeholder="0.00"
              />
              <Button 
                onClick={handleSaveFee} 
                disabled={savingFee}
                className="bg-black hover:bg-zinc-800 text-white"
              >
                {savingFee ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                Save
              </Button>
            </div>
            <p className="text-xs text-gray-500">This fee will be automatically added to the customer's total.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
