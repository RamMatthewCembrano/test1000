import { motion } from "framer-motion";

const Header = () => {
  return (
    <header className="relative bg-primary text-primary-foreground px-6 h-32 flex items-center justify-center text-center overflow-visible">
      {/* Background image — low opacity, covers full header */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: "url('/BACKGROUND.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.075,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10"
      >
        <div className="flex justify-center">
          <img
            src="/PAPICHOLOS-LOGO.png"
            alt="Papicholo's CDO"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-56 sm:h-80 w-auto object-contain"
          />
        </div>
      </motion.div>
    </header>
  );
};

export default Header;
