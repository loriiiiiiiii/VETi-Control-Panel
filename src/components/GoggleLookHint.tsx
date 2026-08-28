/**
 * Looping "look into the goggle" instruction for the session page's live run
 * view: the goggle rests at 45° facing up while the patient bows down to look
 * into it, holds, and straightens back up. Hand-drawn in the lucide idiom
 * (round caps, sparse strokes, currentColor) so it inherits the theme with no
 * animation dependency. Keyframes live in index.css (`goggle-hint-*`);
 * reduced-motion users get the static looking-in pose.
 */
export function GoggleLookHint({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 150"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Table surface */}
      <line x1="30" y1="128" x2="196" y2="128" opacity="0.35" />

      {/* Goggle resting on its corner, aperture facing up-left at 45° */}
      <g transform="translate(152 106) rotate(-45)">
        <rect x="-19" y="-12" width="38" height="24" rx="6" />
        {/* Faceplate seam hinting at the eyecup side */}
        <line x1="-11" y1="-5" x2="11" y2="-5" opacity="0.5" />
        {/* Headstrap draped off the back face onto the table */}
        <path d="M-8 12 C-16 26 -2 34 8 26" opacity="0.7" />
      </g>

      {/* Patient profile: bows toward the goggle around the base point */}
      <g className="goggle-hint-person">
        <path d="M58 128 C58 100 62 76 72 62" />
        <circle cx="81" cy="51" r="12" />
        <circle cx="88.5" cy="49" r="2.2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
