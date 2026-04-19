import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderConfirmationProps {
  onBack: () => void;
}

const OrderConfirmation = ({ onBack }: OrderConfirmationProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="mx-auto h-20 w-20 text-green-500" strokeWidth={1.5} />
        </motion.div>
        <h2 className="mt-6 text-2xl font-bold text-foreground">Order Received!</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Your order has been received. Please wait while we prepare your food.
        </p>
        <Button onClick={onBack} className="mt-8 rounded-xl px-8" size="lg">
          Back to Menu
        </Button>
      </motion.div>
    </div>
  );
};

export default OrderConfirmation;
