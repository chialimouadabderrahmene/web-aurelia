"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function TiltCard({
  children,
  className = "",
  max = 10,
  sheen = true,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  sheen?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(springY, [0, 1], [max, -max]);
  const rotateY = useTransform(springX, [0, 1], [-max, max]);
  const sheenX = useTransform(springX, [0, 1], ["-20%", "120%"]);
  const sheenOpacity = useTransform(springY, [0, 0.5, 1], [0.35, 0.12, 0.35]);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={`relative ${className}`}
    >
      {children}
      {sheen && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            opacity: sheenOpacity,
            background: useTransform(
              sheenX,
              (v) =>
                `linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.65) ${v}, transparent 70%)`
            ),
          }}
        />
      )}
    </motion.div>
  );
}
