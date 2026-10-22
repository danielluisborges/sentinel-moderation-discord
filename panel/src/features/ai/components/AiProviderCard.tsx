import { Sparkles } from "lucide-react";
import type { GuildSettingsDTO } from "../../../../../src/shared/dto.js";

export function AiProviderCard({ settings }: { settings: GuildSettingsDTO }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#0e1521] p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
          <Sparkles size={19} />
        </span>
        <div>
          <h2 className="font-semibold text-slate-100">
            {settings.aiProvider === "gemini" ? "Gemini" : "DeepSeek"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {settings.aiConfigured
              ? "Provedor principal configurado no ambiente do Sentinel."
              : "A chave do provedor principal não está disponível no ambiente atual do Sentinel."}
          </p>
          {settings.aiFallbackConfigured && (
            <p className="mt-1 text-xs text-emerald-300">
              DeepSeek configurado como fallback para falhas temporárias.
            </p>
          )}
        </div>
      </div>
      {!settings.aiConfigured && (
        <p className="mt-4 rounded-lg border border-amber-700/30 bg-amber-500/5 p-3 text-sm text-amber-200">
          Você pode ativar o comando agora. Para receber respostas, configure {settings.aiProvider === "gemini" ? "GEMINI_API_KEY" : "AI_FALLBACK_KEY"} no ambiente em que o backend roda e reinicie o Sentinel. A chave nunca é exibida nem salva nas configurações do servidor.
        </p>
      )}
    </section>
  );
}
