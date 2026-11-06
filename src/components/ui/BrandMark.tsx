interface BrandMarkProps {
  className?: string;
}

/**
 * The lembrion mark, as the app icon draws it: a ribbon marker, the lowercase l, hanging just
 * under the top edge of a Stamp Violet square. A one-colour cut-out would read as a "u" beside
 * the wordmark, so the ribbon stays the white figure. Source of the icon rasters:
 * .impeccable/build/brand/icon.html.
 */
export default function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" focusable="false" className={className}>
      <rect width="512" height="512" rx="48" className="fill-primary" />
      <path d="M210 32H302V372L256 326L210 372Z" className="fill-primary-ink" />
    </svg>
  );
}
