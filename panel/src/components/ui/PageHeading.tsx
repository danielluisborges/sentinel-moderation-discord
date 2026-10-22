import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export function PageHeading({
  active,
  guildId,
  eyebrow,
  title,
  description,
  showLinks = true,
}: {
  active?: "members" | "banned" | "channels";
  guildId: string;
  eyebrow: string;
  title: string;
  description: string;
  showLinks?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-slate-500">
          {eyebrow}{" "}
          <ChevronRight size={13} className="mx-1 inline text-slate-700" />{" "}
          Administração
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">{description}</p>
      </div>
      {showLinks && (
        <div className="flex gap-2">
          <Link
            to={`/guild/${guildId}/members`}
            className={`rounded-lg border px-3 py-2 text-xs ${active === "members" ? "border-blue-400/20 bg-blue-500/10 text-blue-300" : "border-slate-700 bg-slate-900/70 text-slate-400 hover:text-slate-100"}`}
          >
            Membros
          </Link>
          <Link
            to={`/guild/${guildId}/banned`}
            className={`rounded-lg border px-3 py-2 text-xs ${active === "banned" ? "border-blue-400/20 bg-blue-500/10 text-blue-300" : "border-slate-700 bg-slate-900/70 text-slate-400 hover:text-slate-100"}`}
          >
            Banidos
          </Link>
          <Link
            to={`/guild/${guildId}/channels`}
            className={`rounded-lg border px-3 py-2 text-xs ${active === "channels" ? "border-blue-400/20 bg-blue-500/10 text-blue-300" : "border-slate-700 bg-slate-900/70 text-slate-400 hover:text-slate-100"}`}
          >
            Canais
          </Link>
        </div>
      )}
    </div>
  );
}
