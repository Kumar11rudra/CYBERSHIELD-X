import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const COLOR_MAP = {
  blue: { rgb: "0,191,255", hex: "#00bfff", rgba30: "rgba(0,191,255,0.3)" },
  green: { rgb: "0,255,136", hex: "#00ff88", rgba30: "rgba(0,255,136,0.3)" },
  orange: { rgb: "255,140,0", hex: "#ff8c00", rgba30: "rgba(255,140,0,0.3)" },
  red: { rgb: "255,34,68", hex: "#ff2244", rgba30: "rgba(255,34,68,0.3)" },
  purple: { rgb: "180,0,255", hex: "#b400ff", rgba30: "rgba(180,0,255,0.3)" },
};

export default function ModuleCard({
  icon,
  title,
  desc,
  tag,
  color,
  delay,
  onClick,
  locked,
  engine,
  intelCount,
}) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  const c = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: hovered
          ? `rgba(${c.rgb},0.08)`
          : "rgba(10,18,35,0.85)",
        border: `1px solid ${
          hovered ? c.hex : "rgba(0,191,255,0.15)"
        }`,
        borderRadius: 14,
        padding: "24px 20px",
        cursor: locked ? "default" : "pointer",
        transition: "all 0.15s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-10px) scale(1.03)" : "none",
        boxShadow: hovered
          ? `0 20px 40px rgba(${c.rgb},0.25)`
          : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at center, ${c.hex}, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.span
          animate={hovered ? { scale: 1.2, rotate: [0, -10, 10, 0] } : {}}
          style={{ fontSize: 28 }}
        >
          {icon}
        </motion.span>

        <span
          style={{
            fontSize: 9,
            letterSpacing: 1.5,
            fontWeight: 800,
            padding: "4px 10px",
            borderRadius: 4,
            background: `rgba(${c.rgb},0.15)`,
            color: c.hex,
            border: `1px solid ${c.rgba30}`,
            textTransform: "uppercase",
          }}
        >
          {tag}
        </span>
      </div>

      <h3
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: "#e0e6ff",
          margin: "0 0 10px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 12,
          color: "#5a7fa8",
          lineHeight: 1.6,
          margin: "0 0 16px",
        }}
      >
        {desc}
      </p>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              color: c.hex,
              fontWeight: 800,
            }}
          >
            ENGINE
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#e0e6ff",
              fontFamily: "monospace",
            }}
          >
            {engine}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 9,
              color: "#00ff88",
              fontWeight: 800,
            }}
          >
            INTEL
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#00ff88",
              fontFamily: "monospace",
            }}
          >
            {intelCount}
          </div>
        </div>
      </div>

      {locked && (
        <div
          style={{
            marginTop: 12,
            fontSize: 10,
            color: "#ff2244",
            fontWeight: 700,
          }}
        >
          {t("home.modules.loginRequired")}
        </div>
      )}
    </motion.div>
  );
}