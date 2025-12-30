export function IllustrationCollaboration() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-border"
    >
      {/* People icons */}
      <circle cx="70" cy="70" r="15" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M50 110 Q70 90 90 110" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      <circle cx="130" cy="70" r="15" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M110 110 Q130 90 150 110" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

      <circle cx="100" cy="120" r="12" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M85 155 Q100 140 115 155" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

      {/* Connection lines */}
      <path
        d="M85 75 L115 75 M85 120 L85 85 M115 120 L115 85"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
        strokeDasharray="3 3"
      />
    </svg>
  )
}
