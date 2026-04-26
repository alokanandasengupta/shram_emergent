// Shram's crystal/diamond mark — matched from shram.ai
export default function ShramLogo({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Shram"
    >
      <path
        d="M20 2 L37 16 L30 46 L10 46 L3 16 Z"
        fill="currentColor"
      />
      <path
        d="M20 2 L37 16 L20 22 Z"
        fill="currentColor"
        fillOpacity="0.78"
      />
      <path
        d="M20 2 L3 16 L20 22 Z"
        fill="currentColor"
        fillOpacity="0.55"
      />
    </svg>
  );
}
