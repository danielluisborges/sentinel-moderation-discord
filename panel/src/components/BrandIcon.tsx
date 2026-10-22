import logoUrl from "../../assets/img/logo.webp";

export function BrandIcon({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={logoUrl}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`shrink-0 rounded-xl object-contain ${className}`}
    />
  );
}
