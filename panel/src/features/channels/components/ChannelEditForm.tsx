import { primaryButton, secondaryButton } from "../../../components/ui/formStyles.js";
import { Field } from "../../../components/ui/Field.js";
import type { ChannelDTO } from "../../../../../src/shared/dto.js";
import type { ChannelForm } from "../lib/types.js";
import { supportsTopic } from "../lib/channelMeta.js";

export function ChannelEditForm({
  channel,
  form,
  pending,
  error,
  onChange,
  onCancel,
  onSubmit,
}: {
  channel: ChannelDTO;
  form: ChannelForm;
  pending: boolean;
  error?: string;
  onChange: (form: ChannelForm) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <Field label="Nome do canal">
        <input
          required
          minLength={1}
          maxLength={100}
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          className={inputClass}
        />
      </Field>
      {supportsTopic(channel.type) && (
        <Field label="Tópico">
          <textarea
            maxLength={1024}
            rows={4}
            value={form.topic}
            onChange={(event) => onChange({ ...form, topic: event.target.value })}
            className={`${inputClass} resize-y`}
          />
        </Field>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Cancelar
        </button>
        <button disabled={pending} className={primaryButton}>
          {pending ? "Salvando…" : "Salvar canal"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-400";
