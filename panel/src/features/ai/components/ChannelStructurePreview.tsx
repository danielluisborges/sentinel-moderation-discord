import { Folder, Globe, LockKeyhole } from "lucide-react";
import type { ChannelStructureChannel, ChannelStructurePlan } from "../../../../../src/shared/dto.js";
import { channelIcons, channelTypeLabels } from "../../channels/lib/channelMeta.js";

export function ChannelStructurePreview({ plan }: { plan: ChannelStructurePlan }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/45">
      {plan.categories.map((category, index) => (
        <section key={`${category.name}-${index}`} className={index > 0 ? "border-t border-slate-800" : undefined}>
          <div className="flex items-center gap-2.5 bg-slate-900/70 px-4 py-3">
            <Folder size={17} className="shrink-0 text-amber-300" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">{category.name}</span>
            <VisibilityBadge visibility={category.visibility} />
          </div>
          {category.channels.length > 0 ? (
            <ul className="px-4 py-1">
              {category.channels.map((channel, channelIndex) => (
                <ChannelPreviewRow key={`${channel.name}-${channelIndex}`} channel={channel} />
              ))}
            </ul>
          ) : (
            <p className="px-10 py-2 text-xs text-slate-500">Nenhum canal nesta categoria</p>
          )}
        </section>
      ))}
      {plan.channels.length > 0 && (
        <section className={`${plan.categories.length ? "border-t border-slate-800" : ""} px-4 py-3`}>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sem categoria</p>
          <ul>{plan.channels.map((channel, index) => <ChannelPreviewRow key={`${channel.name}-${index}`} channel={channel} />)}</ul>
        </section>
      )}
    </div>
  );
}

function ChannelPreviewRow({ channel }: { channel: ChannelStructureChannel }) {
  const Icon = channelIcons[channel.type];
  return (
    <li className="flex min-h-9 items-center gap-2.5 border-t border-slate-800/60 first:border-t-0">
      <Icon size={15} className="shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{channel.name}</span>
      <span className="hidden text-xs text-slate-500 sm:inline">{channelTypeLabels[channel.type]}</span>
      <VisibilityBadge visibility={channel.visibility} />
    </li>
  );
}

function VisibilityBadge({ visibility }: { visibility: "public" | "moderators" }) {
  const isPrivate = visibility === "moderators";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${isPrivate ? "bg-amber-400/10 text-amber-200" : "bg-emerald-400/10 text-emerald-200"}`}>
      {isPrivate ? <LockKeyhole size={11} /> : <Globe size={11} />}
      {isPrivate ? "Moderadores" : "Público"}
    </span>
  );
}
