export function IllustrationSearch() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-border"
    >
      {/* Magnifying glass */}
      <circle cx="80" cy="80" r="35" stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M105 105 L135 135" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* Document icons */}
      <rect
        x="140"
        y="50"
        width="30"
        height="40"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        rx="2"
        opacity="0.5"
      />
      <path d="M145 60 L165 60 M145 70 L165 70 M145 80 L160 80" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />

      {/* Floating search terms */}
      <circle cx="50" cy="140" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="120" cy="155" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="160" cy="130" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  )
}
