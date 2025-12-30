export function IllustrationEmptyShelf() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-border"
    >
      {/* Shelf */}
      <path d="M20 120 L180 120 M20 125 L180 125" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* Empty books leaning */}
      <path
        d="M50 90 L60 120 M55 90 L65 120 M70 85 L75 120 M75 85 L80 120"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Bookmark icon */}
      <path
        d="M110 70 L110 110 L120 105 L130 110 L130 70 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />

      {/* Decorative plant */}
      <circle cx="150" cy="115" r="3" fill="currentColor" opacity="0.3" />
      <path
        d="M150 115 Q145 100 148 90 M150 115 Q155 105 152 95"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
      />
    </svg>
  )
}
