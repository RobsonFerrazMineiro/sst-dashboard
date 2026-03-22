"use client";

import { type RiskScore } from "@/lib/risk-score";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import RiskScoreDetail from "./RiskScoreDetail";

interface RiskScoreHoverCardProps {
  riskScore: RiskScore;
  children: React.ReactNode;
}

/**
 * Wrapper customizado para exibir o detalhe do score de risco como overlay flutuante
 * Renderiza o card acima do element, ultrapassando containers com overflow
 */
export default function RiskScoreHoverCard({
  riskScore,
  children,
}: RiskScoreHoverCardProps) {
  const [showCard, setShowCard] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 16, // 16px acima
        left: rect.left + window.scrollX,
      });
      setShowCard(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowCard(false);
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {/* Portal overlay - renderizado no body, não afetado por overflow dos containers pais */}
      {showCard &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="pointer-events-auto bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
              <RiskScoreDetail riskScore={riskScore} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
