interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeClass = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" };

export function Avatar({ name, src, size = "md" }: AvatarProps) {
  return src ? (
    <img className={`${sizeClass[size]} rounded-full object-cover`} src={src} alt="" />
  ) : (
    <span
      aria-hidden="true"
      className={`${sizeClass[size]} grid shrink-0 place-items-center rounded-full bg-slate-700 font-semibold text-slate-100`}
    >
      {name.trim().slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}
