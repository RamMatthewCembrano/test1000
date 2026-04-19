import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// Add these imports for the dropdown
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageIcon, UploadCloud, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CheckoutDrawer = ({ open, onClose, onConfirm }: CheckoutDrawerProps) => {
  const { totalPrice, clearCart, items } = useCart();
  const [name, setName] = useState("");
  const [payment, setPayment] = useState("counter");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Read table number from URL ?table=X automatically ─────────────────────
  const urlTable =
    new URLSearchParams(window.location.search).get("table") ?? "";
  const [tableNumber, setTableNumber] = useState(urlTable);
  const tableFromUrl = !!urlTable;

  // Array for numbers 1 to 10 (fallback if no URL param)
  const tableOptions = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tableNumber) {
      toast.error("Please select a table number.");
      return;
    }

    if (payment === "online" && !receipt) {
      toast.error("Please upload your GCash receipt to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      let receiptUrl = "";

      if (payment === "online" && receipt) {
        const fileExt = receipt.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("menu-items")
          .upload(filePath, receipt);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("menu-items")
          .getPublicUrl(filePath);

        receiptUrl = urlData.publicUrl;
      }

      const { error: orderError } = await supabase.from("orders").insert([
        {
          customer_name: name,
          table_number: tableNumber,
          total_price: totalPrice,
          payment_method: payment,
          receipt_url: receiptUrl,
          status: "pending",
          order_items: items,
        },
      ]);

      if (orderError) throw orderError;

      toast.success("Order placed successfully!");
      clearCart();
      onConfirm();
    } catch (error: any) {
      toast.error("Error: " + error.message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && !isSubmitting && onClose()}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader>
          <DrawerTitle className="text-center">Confirm Your Order</DrawerTitle>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 space-y-6"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Juan D."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="rounded-xl border-black/10 focus:border-black"
                />
              </div>

              {/* ── Table number — auto from QR or manual select ── */}
              <div className="space-y-2">
                <Label htmlFor="table">Table #</Label>
                {tableFromUrl ? (
                  // Locked — came from QR code scan
                  <div className="flex items-center gap-2 rounded-xl border border-black bg-black text-white px-4 py-2.5 text-sm font-semibold">
                    <span>Table {tableNumber}</span>
                    <span className="ml-auto text-xs font-normal opacity-60">
                      via QR
                    </span>
                  </div>
                ) : (
                  // Manual select — no QR used
                  <Select
                    value={tableNumber}
                    onValueChange={setTableNumber}
                    disabled={isSubmitting}
                    required
                  >
                    <SelectTrigger className="rounded-xl border-black/10 focus:border-black">
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tableOptions.map((num) => (
                        <SelectItem key={num} value={num}>
                          Table {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-black">
                Payment Method
              </Label>
              <RadioGroup
                value={payment}
                onValueChange={setPayment}
                disabled={isSubmitting}
                className="grid grid-cols-1 gap-2"
              >
                <div
                  className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${payment === "counter" ? "border-black bg-black/5" : "border-gray-200"}`}
                >
                  <RadioGroupItem value="counter" id="counter" />
                  <Label
                    htmlFor="counter"
                    className="cursor-pointer flex-1 font-medium text-black"
                  >
                    Pay at Counter
                  </Label>
                </div>
                <div
                  className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${payment === "online" ? "border-black bg-black/5" : "border-gray-200"}`}
                >
                  <RadioGroupItem value="online" id="online" />
                  <Label
                    htmlFor="online"
                    className="cursor-pointer flex-1 font-medium text-blue-600"
                  >
                    GCash / Online
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {payment === "online" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4 rounded-2xl bg-gray-50 p-4 border border-dashed border-gray-300 text-black">
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Scan to Pay via GCash
                  </p>
                  <div className="mx-auto w-40 h-40 bg-white border-2 border-black rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src="/gcash-qr.jpg"
                      alt="GCash QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-sm font-semibold">Papicholo's CDO</p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="receipt"
                    className="text-xs font-bold uppercase text-gray-500"
                  >
                    Attach Receipt
                  </Label>
                  <div className="relative">
                    <input
                      type="file"
                      id="receipt"
                      accept="image/*"
                      onChange={(e) =>
                        setReceipt(e.target.files ? e.target.files[0] : null)
                      }
                      className="hidden"
                      required={payment === "online"}
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor="receipt"
                      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 hover:bg-gray-50 transition-colors"
                    >
                      {receipt ? (
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                          <ImageIcon size={20} />
                          <span className="text-sm truncate max-w-[200px]">
                            {receipt.name}
                          </span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="text-gray-400" />
                          <span className="text-sm text-gray-500">
                            Click to upload screenshot
                          </span>
                        </>
                      )}
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DrawerFooter className="px-0 pb-10">
            <div className="flex items-center justify-between mb-4 border-t pt-4">
              <span className="text-sm font-medium text-muted-foreground">
                Amount to Pay
              </span>
              <span className="text-2xl font-black text-black">
                ₱{totalPrice.toFixed(2)}
              </span>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full rounded-xl text-md font-bold py-7 bg-black hover:bg-zinc-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Processing...
                </>
              ) : payment === "online" ? (
                "Submit Receipt & Order"
              ) : (
                "Place Order"
              )}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default CheckoutDrawer;
