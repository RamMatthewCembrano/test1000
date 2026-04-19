import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const FACEBOOK_URL = "https://www.facebook.com/gianandrei.gelay/";
const INSTAGRAM_URL = "https://www.instagram.com/papicholos_cdo/";

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const IMG_W = 60;
const GAP = 10;
const STEP = IMG_W + GAP;
const SPEED_DEFAULT = 0.8;

const InfiniteCarousel = ({
  images,
  speed,
}: {
  images: { id: string; url: string }[];
  speed: number;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const rafRef = useRef(0);
  const speedRef = useRef(speed);

  // Keep speedRef in sync if speed prop changes
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const repeated = Array.from({ length: 20 }, () => images).flat();
  const setW = images.length * STEP;

  useEffect(() => {
    if (!trackRef.current || images.length === 0) return;
    xRef.current = 0;

    const tick = () => {
      xRef.current -= speedRef.current;
      if (xRef.current <= -setW) xRef.current += setW;
      if (trackRef.current)
        trackRef.current.style.transform = `translateX(${xRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [images, setW]);

  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
      {/* Smooth fade on left edge */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 100,
          zIndex: 2,
          background: "linear-gradient(to right, #000 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Smooth fade on right edge */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 100,
          zIndex: 2,
          background: "linear-gradient(to left, #000 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        ref={trackRef}
        style={{
          display: "flex",
          gap: GAP,
          width: "max-content",
          willChange: "transform",
        }}
      >
        {repeated.map((img, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              width: IMG_W,
              height: IMG_W,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <img
              src={img.url}
              alt="carousel"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const Footer = () => {
  const [carouselImages, setCarouselImages] = useState<any[]>([]);
  const [carouselEnabled, setCarouselEnabled] = useState(true);
  const [carouselSpeed, setCarouselSpeed] = useState(SPEED_DEFAULT);

  useEffect(() => {
    const fetchCarousel = async () => {
      const [{ data: imgs }, { data: settings }] = await Promise.all([
        supabase
          .from("carousel_images")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase.from("carousel_settings").select("*").eq("id", 1).single(),
      ]);
      if (imgs) setCarouselImages(imgs);
      if (settings) {
        setCarouselEnabled(settings.enabled ?? true);
        setCarouselSpeed(settings.speed ?? SPEED_DEFAULT);
      }
    };
    fetchCarousel();
  }, []);

  return (
    <footer
      style={{
        position: "relative",
        background: "#000",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {/* Background image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/BACKGROUND.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.075,
          pointerEvents: "none",
        }}
      />

      {/* Carousel strip */}
      {carouselEnabled && carouselImages.length > 0 && (
        <>
          <div style={{ position: "relative", zIndex: 1 }}>
            <InfiniteCarousel images={carouselImages} speed={carouselSpeed} />
          </div>
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.1)",
              margin: "0 24px",
              position: "relative",
              zIndex: 1,
            }}
          />
        </>
      )}

      {/* Footer body */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "28px 24px 40px",
          gap: 16,
          overflow: "hidden",
          maxHeight: 400,
          marginTop: -110,
        }}
      >
        <img
          src="/PAPICHOLOS-LOGO.png"
          alt="Papicholo's CDO"
          style={{ height: 300, width: "auto", objectFit: "contain" }}
        />

        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.05em",
            textAlign: "center",
            maxWidth: 240,
            lineHeight: 1.6,
            marginTop: -100,
          }}
        >
          Authentic flavors in the heart of Cagayan de Oro.
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          {[
            { href: FACEBOOK_URL, Icon: FacebookIcon, label: "Facebook" },
            { href: INSTAGRAM_URL, Icon: InstagramIcon, label: "Instagram" },
          ].map(({ href, Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Papicholo's ${label}`}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
              }
            >
              <Icon />
            </a>
          ))}
        </div>

        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.04em",
          }}
        >
          © {new Date().getFullYear()} Papicholo's CDO. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
