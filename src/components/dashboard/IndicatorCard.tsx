"use client";

import { ReactNode } from "react";

interface IndicatorCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  color: "red" | "amber" | "emerald" | "blue";
  onClick?: () => void;
  isClickable?: boolean;
}

const colorSchemes = {
  red: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: "text-rose-600",
    text: "text-rose-900",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-600",
    text: "text-amber-900",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "text-emerald-600",
    text: "text-emerald-900",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-600",
    text: "text-blue-900",
  },
};

export default function IndicatorCard({
  label,
  value,
  icon,
  color,
  onClick,
  isClickable = false,
}: IndicatorCardProps) {
  const scheme = colorSchemes[color];

  return (
    <div
      onClick={onClick}
      className={`${scheme.bg} border-2 ${scheme.border} rounded-lg p-6 ${isClickable ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className={`text-sm font-medium ${scheme.text} opacity-75`}>
            {label}
          </p>
          <p className={`text-3xl font-bold ${scheme.text} mt-2`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${scheme.bg} border ${scheme.border}`}>
          <div className={scheme.icon}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
