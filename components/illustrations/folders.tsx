export function IllustrationFolders() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-border"
    >
      {/* Back folder */}
      <path
        d="M40 70 L45 65 L75 65 L80 70 L160 70 L160 130 L40 130 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />

      {/* Middle folder */}
      <path
        d="M50 80 L55 75 L85 75 L90 80 L150 80 L150 140 L50 140 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />

      {/* Front folder */}
      <path
        d="M60 90 L65 85 L95 85 L100 90 L140 90 L140 150 L60 150 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Label lines */}
      <path
        d="M70 110 L130 110 M70 120 L120 120 M70 130 L110 130"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  )
}
