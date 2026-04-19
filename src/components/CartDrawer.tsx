import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const CartDrawer = ({ open, onClose, onCheckout }: CartDrawerProps) => {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Your Order</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Your cart is empty</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-sm font-bold text-muted-foreground">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <DrawerFooter>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total</span>
              <span className="text-lg font-bold">₱{totalPrice.toFixed(2)}</span>
            </div>
            <Button onClick={onCheckout} size="lg" className="w-full rounded-xl text-sm">
              Proceed to Checkout
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default CartDrawer;
