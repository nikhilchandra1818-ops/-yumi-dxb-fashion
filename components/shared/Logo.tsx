import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light" | "colored";
  size?: "sm" | "md" | "lg";
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  variant = "colored",
  size = "md",
}) => {
  const isDark = variant === "dark";
  const isLight = variant === "light";
  const isColored = variant === "colored";

  const sizeClasses = {
    sm: "w-24 h-16",
    md: "w-32 h-20",
    lg: "w-44 h-28",
  };

  // Color mappings
  const hangerColor = isLight ? "#F7F3EE" : "#1A1A1A";
  const yumiColor = isColored ? "#C97B7B" : isLight ? "#F7F3EE" : "#1A1A1A";
  const dxbColor = isLight ? "rgba(247,243,238,0.7)" : "rgba(26,26,26,0.7)";

  return (
    <Link href="/" className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses[size]} transition-all duration-300`}
      >
        {/* Hanger Hook (Question mark style) */}
        <path
          d="M93.5 35 C93.5 29, 98 25, 103.5 25 C109 25, 113.5 29, 113.5 34 C113.5 38, 110.5 40, 106.5 42"
          stroke={hangerColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Hanger Hook Spacers (Dash lines) */}
        <line
          x1="99"
          y1="46"
          x2="108"
          y2="46"
          stroke={hangerColor}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <line
          x1="99"
          y1="51.5"
          x2="108"
          y2="51.5"
          stroke={hangerColor}
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Hanger Shoulder Curved Line */}
        <path
          d="M60 62 C70 54, 85 55, 96 55 C98 55, 102 55, 104 55 C115 55, 130 54, 140 62"
          stroke={hangerColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Hanger Loop Left */}
        <path
          d="M61.5 62 C59.5 62.5, 56.5 61, 57.5 59"
          stroke={hangerColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Hanger Loop Right */}
        <path
          d="M138.5 62 C140.5 62.5, 143.5 61, 142.5 59"
          stroke={hangerColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* "YUMI" Branding Text */}
        {/* 'Y' Calligraphy/Cursive */}
        <text
          x="65"
          y="85"
          fill={yumiColor}
          fontFamily="Georgia, serif"
          fontSize="32"
          fontStyle="italic"
          fontWeight="300"
          letterSpacing="-1"
        >
          Y
        </text>
        {/* 'UMI' Serif Bold */}
        <text
          x="88"
          y="84"
          fill={yumiColor}
          fontFamily="Georgia, serif"
          fontSize="24"
          fontWeight="600"
          letterSpacing="1"
        >
          UMI
        </text>

        {/* "DXB FASHION" Subtitle */}
        <text
          x="100"
          y="102"
          fill={dxbColor}
          fontFamily="system-ui, sans-serif"
          fontSize="8.5"
          fontWeight="500"
          letterSpacing="7"
          textAnchor="middle"
        >
          DXB FASHION
        </text>
      </svg>
    </Link>
  );
};
