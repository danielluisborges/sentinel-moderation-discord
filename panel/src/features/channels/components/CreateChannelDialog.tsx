import type { ChannelTreeDTO } from "../../../../../src/shared/dto.js";
import { Field } from "../../../components/ui/Field.js";
import { Modal } from "../../../components/ui/Modal.js";
import { primaryButton, secondaryButton } from "../../../components/ui/formStyles.js";
import type { ChannelForm, CreateDialogKind } from "../lib/types.js";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-400";

export function CreateChannelDialog({
  kind,
  form,
  tree,
  pending,
  error,
  onChange,
  onClose,
  onCreate,
}: {
  kind: CreateDialogKind;
  form: ChannelForm;
  tree: ChannelTreeDTO;
  pending: boolean;
  error?: string;
  onChange: (form: ChannelForm) => void;
  onClose: () => void;
  onCreate: (form: ChannelForm) => void;
}) {
  return (
    <Modal
      onClose={onClose}
      role="dialog"
      labelledBy="channel-dialog-title"
      overlayClassName="fixed inset-0 z-30 grid place-items-center bg-black/70 p-4"
      className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111a28] p-5 shadow-2xl"
    >
      <h2 id="channel-dialog-title" className="text-lg font-semibold">
        Criar {kind === "category" ? "categoria" : "canal"}
      </h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onCreate({ ...form, type: kind === "category" ? "category" : form.type });
        }}
        className="mt-5 space-y-4"
      >
        <Field label="Nome">
          <input
            required
            minLength={1}
            maxLength={100}
            autoFocus
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            className={inputClass}
            placeholder={kind === "category" ? "Ex.: Suporte" : "Ex.: bate-papo"}
          />
        </Field>
        {kind === "channel" && (
          <>
            <Field label="Tipo">
              <select
                value={form.type}
                onChange={(event) =>
                  onChange({ ...form, type: event.target.value as ChannelForm["type"] })
                }
                className={inputClass}
              >
                <option value="text">Texto</option>
                <option value="voice">Voz</option>
                <option value="announcement">Anúncios</option>
                <option value="forum">Fórum</option>
              </select>
            </Field>
            <Field label="Categoria">
              <select
                value={form.parentId}
                onChange={(event) => onChange({ ...form, parentId: event.target.value })}
                className={inputClass}
              >
                <option value="">Sem categoria</option>
                {tree.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tópico (opcional)">
              <textarea
                maxLength={1024}
                rows={3}
                value={form.topic}
                onChange={(event) => onChange({ ...form, topic: event.target.value })}
                className={`${inputClass} resize-y`}
              />
            </Field>
          </>
        )}
        <Field label="Visibilidade">
          <select
            value={form.visibility}
            onChange={(event) =>
              onChange({ ...form, visibility: event.target.value as ChannelForm["visibility"] })
            }
            className={inputClass}
          >
            <option value="public">Público para o servidor</option>
            <option value="moderators">Privado — só moderadores</option>
          </select>
        </Field>
        {form.visibility === "moderators" && (
          <p className="text-xs leading-5 text-slate-400">
            O cargo definido em <code>/config cargo-mod</code> poderá ver o canal.
            Administradores também mantêm acesso.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancelar
          </button>
          <button disabled={pending} className={primaryButton}>
            {pending ? "Criando…" : "Criar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
