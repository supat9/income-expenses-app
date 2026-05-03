'use client';

import { useState } from 'react';
import { Modal, TextInput, Select, Btn } from './Primitives';
import { useTweaks } from '@/components/Providers';
import { I18N } from '@/lib/i18n';
import { formatTHB } from '@/lib/formatters';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (tx: any) => Promise<void> | void;
  categories: any[];
  editing?: any;
}

type FormState = {
  txType: "income" | "expense";
  date: string;
  amount: string;
  categoryId: string;
  note: string;
  account: string;
  error: string | null;
};

function defaultFormState(editing: AddTransactionModalProps['editing'], categories: AddTransactionModalProps['categories']): FormState {
  if (editing) return {
    txType: editing.amount >= 0 ? "income" : "expense",
    date: new Date(editing.date).toISOString().split('T')[0],
    amount: Math.abs(editing.amount).toString(),
    categoryId: editing.categoryId,
    note: editing.note ?? "",
    account: editing.account,
    error: null,
  };
  return {
    txType: "expense",
    date: new Date().toISOString().split('T')[0],
    amount: "",
    categoryId: categories.find(c => c.kind === "expense")?.id ?? "",
    note: "",
    account: "SCB Easy",
    error: null,
  };
}

export function AddTransactionModal({ open, onClose, onSubmit, categories, editing }: AddTransactionModalProps) {
  const { tweaks } = useTweaks();
  const locale = tweaks.locale;
  const t = I18N[locale];

  const [form, setForm] = useState<FormState>(() => defaultFormState(editing, categories));
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<FormState>) => setForm(prev => ({ ...prev, ...patch }));

  const filteredCategories = categories.filter(c => c.kind === form.txType);

  const handleTypeChange = (type: "income" | "expense") => {
    const cats = categories.filter(c => c.kind === type);
    update({ txType: type, categoryId: cats[0]?.id ?? "" });
  };

  const handleSubmit = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0 || !form.categoryId) return;
    setSaving(true);
    update({ error: null });
    try {
      await onSubmit({
        id: editing?.id,
        date: new Date(form.date).toISOString(),
        amount: form.txType === "expense" ? -amt : amt,
        categoryId: form.categoryId,
        note: form.note,
        account: form.account,
      });
      onClose();
    } catch {
      update({ error: locale === "th" ? "บันทึกไม่สำเร็จ กรุณาลองใหม่" : "Failed to save. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const preview = (() => {
    const amt = parseFloat(form.amount) || 0;
    if (!amt) return null;
    return formatTHB(form.txType === "expense" ? -amt : amt, { sign: true });
  })();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? (locale === "th" ? "แก้ไขรายการ" : "Edit transaction") : (locale === "th" ? "เพิ่มรายการ" : "Add transaction")}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>{t.common.cancel}</Btn>
          <Btn variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? (locale === "th" ? "กำลังบันทึก…" : "Saving…") : t.common.save}
          </Btn>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="form-grid">
        {form.error && (
          <div style={{ color: "var(--expense)", fontSize: 13, padding: "8px 10px", background: "color-mix(in oklab, var(--expense) 10%, transparent)", borderRadius: 8 }}>
            {form.error}
          </div>
        )}
        <div className="field">
          <label className="field-label">{locale === "th" ? "ประเภท" : "Type"}</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "10px 0",
                borderRadius: 10,
                border: form.txType === "income" ? "2px solid var(--income)" : "2px solid var(--line)",
                background: form.txType === "income" ? "color-mix(in oklab, var(--income) 10%, transparent)" : "transparent",
                color: form.txType === "income" ? "var(--income)" : "var(--ink-3)",
                fontWeight: form.txType === "income" ? 600 : 400,
                fontSize: 14,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              <ArrowUp size={15} strokeWidth={2.5} />
              {locale === "th" ? "รายรับ" : "Income"}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "10px 0",
                borderRadius: 10,
                border: form.txType === "expense" ? "2px solid var(--expense)" : "2px solid var(--line)",
                background: form.txType === "expense" ? "color-mix(in oklab, var(--expense) 10%, transparent)" : "transparent",
                color: form.txType === "expense" ? "var(--expense)" : "var(--ink-3)",
                fontWeight: form.txType === "expense" ? 600 : 400,
                fontSize: 14,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              <ArrowDown size={15} strokeWidth={2.5} />
              {locale === "th" ? "รายจ่าย" : "Expense"}
            </button>
          </div>
        </div>

        <div className="field">
          <label className="field-label">{t.common.date}</label>
          <input type="date" value={form.date} onChange={e => update({ date: e.target.value })} className="ti-input" />
        </div>

        <div className="field">
          <label className="field-label">{t.common.amount}{preview && <span style={{ marginLeft: 8, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>{preview}</span>}</label>
          <TextInput value={form.amount} onChange={v => update({ amount: v })} placeholder="0.00" type="number" />
        </div>

        <div className="field">
          <label className="field-label">{t.common.category}</label>
          <Select
            value={form.categoryId}
            onChange={v => update({ categoryId: v })}
            options={filteredCategories.map(c => ({ value: c.id, label: (locale === "th" ? c.th : c.en) }))}
          />
        </div>

        <div className="field">
          <label className="field-label">{t.common.note}</label>
          <TextInput value={form.note} onChange={v => update({ note: v })} placeholder={t.common.note} />
        </div>

        <div className="field">
          <label className="field-label">{t.common.account}</label>
          <Select
            value={form.account}
            onChange={v => update({ account: v })}
            options={[
              { value: "SCB Easy", label: "SCB Easy" },
              { value: "Kasikorn", label: "Kasikorn" },
              { value: "Cash", label: "Cash" },
            ]}
          />
        </div>
      </form>
    </Modal>
  );
}
