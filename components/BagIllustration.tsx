type Props = {
  hex?: string;
  variant?: "tote" | "shoulder" | "clutch" | "crossbody";
  className?: string;
};

export default function BagIllustration({
  hex = "#F3EEE6",
  variant = "shoulder",
  className = "",
}: Props) {
  const dark = shadeOf(hex);

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`bg-${hex}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8F6F2" />
        </linearGradient>
        <linearGradient id={`body-${hex}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={hex} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#bg-${hex})`} />
      {variant === "tote" && (
        <g>
          <path
            d="M120 150 C120 100 280 100 280 150 L280 155 L120 155 Z"
            fill="none"
            stroke={dark}
            strokeWidth="6"
          />
          <rect
            x="90"
            y="150"
            width="220"
            height="180"
            rx="20"
            fill={`url(#body-${hex})`}
          />
        </g>
      )}
      {variant === "shoulder" && (
        <g>
          <path
            d="M150 90 C150 40 250 40 250 90 L250 140"
            fill="none"
            stroke={dark}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M150 90 L150 140"
            fill="none"
            stroke={dark}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <rect
            x="95"
            y="140"
            width="210"
            height="150"
            rx="24"
            fill={`url(#body-${hex})`}
          />
          <circle cx="150" cy="165" r="4" fill={dark} />
          <circle cx="250" cy="165" r="4" fill={dark} />
        </g>
      )}
      {variant === "clutch" && (
        <g>
          <rect
            x="100"
            y="180"
            width="200"
            height="110"
            rx="18"
            fill={`url(#body-${hex})`}
          />
          <path
            d="M110 180 Q200 140 290 180"
            fill="none"
            stroke={dark}
            strokeWidth="6"
          />
        </g>
      )}
      {variant === "crossbody" && (
        <g>
          <path
            d="M130 100 L270 300"
            fill="none"
            stroke={dark}
            strokeWidth="6"
          />
          <rect
            x="130"
            y="180"
            width="150"
            height="120"
            rx="20"
            fill={`url(#body-${hex})`}
          />
        </g>
      )}
    </svg>
  );
}

function shadeOf(hex: string): string {
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  const r = Math.max(0, (num >> 16) - 35);
  const g = Math.max(0, ((num >> 8) & 0xff) - 35);
  const b = Math.max(0, (num & 0xff) - 35);
  return `rgb(${r}, ${g}, ${b})`;
}
