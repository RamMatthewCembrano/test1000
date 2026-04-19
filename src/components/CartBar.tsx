import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface CartBarProps {
  onOpen: () => void;
}

const CartBar = ({ onOpen }: CartBarProps) => {
  const { totalItems, totalPrice } = useCart();

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed inset-x-0 bottom-0 z-40 p-4"
        >
          <button
            onClick={onOpen}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-bold text-primary">
                  {totalItems}
                </span>
              </div>
              <span className="text-sm font-medium">View Cart</span>
            </div>
            <span className="text-sm font-bold">₱{totalPrice.toFixed(2)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartBar;
