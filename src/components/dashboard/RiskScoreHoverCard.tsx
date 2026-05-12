"use client";

import { type RiskScore } from "@/lib/risk-score";
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
  const cardRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const cardWidth = cardRef.current?.offsetWidth ?? 280;
    const cardHeight = cardRef.current?.offsetHeight ?? 220;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const gap = 8;

    let left = rect.left;
    let top = rect.bottom + gap;

    if (left + cardWidth > viewportW - gap) {
      left = Math.max(gap, viewportW - cardWidth - gap);
    }
    if (top + cardHeight > viewportH - gap) {
      top = Math.max(gap, rect.top - cardHeight - gap);
    }

    setPosition({ top, left });
  }, []);

  const openCard = useCallback(() => {
    updatePosition();
    setShowCard(true);
  }, [updatePosition]);

  const handleMouseEnter = useCallback(() => {
    if (window.matchMedia("(hover: hover)").matches) {
      openCard();
    }
  }, [openCard]);

  const handleMouseLeave = useCallback(() => {
    if (window.matchMedia("(hover: hover)").matches) {
      setShowCard(false);
    }
  }, []);

  const handleTriggerClick = useCallback(
    (event: ReactMouseEvent) => {
      // Em mobile/touch abre/fecha por click; no desktop mantém hover.
      if (!window.matchMedia("(hover: hover)").matches) {
        event.preventDefault();
        if (showCard) {
          setShowCard(false);
        } else {
          openCard();
        }
      }
    },
    [openCard, showCard],
  );

  useEffect(() => {
    if (!showCard) return;

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedCard = cardRef.current?.contains(target);
      if (!clickedTrigger && !clickedCard) {
        setShowCard(false);
      }
    };

    const handleViewportChange = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside, { passive: true });
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [showCard, updatePosition]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleTriggerClick}
      >
        {children}
      </div>

      {/* Portal overlay - renderizado no body, não afetado por overflow dos containers pais */}
      {showCard &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={cardRef}
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
