'use client';

import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Select, Btn } from './Primitives';
import { useTweaks } from '@/components/Providers';
import { I18N } from '@/lib/i18n';
import { formatTHB } from '@/lib/formatters';

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (tx: any) => Promise<void> | void;
  categories: any[];
  editing?: any;
}

export function AddTransactionModal({ open, onClose, onSubmit, categories, editing }: AddTransactionModalProps) {
  const { tweaks } = useTweaks();
  const locale = tweaks.locale;
  const t = I18N[locale];

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [account, setAccount] = useState("SCB Easy");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setDate(new Date(editing.date).toISOString().split('T')[0]);
        setAmount(Math.abs(editing.amount).toString());
        setCategoryId(editing.categoryId);
        setNote(editing.note);
        setAccount(editing.account);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setAmount("");
        setCategoryId(categories[0]?.id ?? "");
        setNote("");
        setAccount("SCB Easy");
      }
    }
  }, [editing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find(c => c.id === categoryId);
    const amt = parseFloat(amount);
    if (!amt || !categoryId) return;
    setSaving(true);
    try {
      await onSubmit({
        id: editing?.id,
        date: new Date(date).toISOString(),
        amount: cat?.kind === "expense" ? -amt : amt,
        categoryId,
        note,
        account,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const preview = (() => {
    const cat = categories.find(c => c.id === categoryId);
    const amt = parseFloat(amount) || 0;
    if (!amt) return null;
    return formatTHB(cat?.kind === "expense" ? -amt : amt, { sign: true });
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
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="field">
          <label className="field-label">{t.common.date}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="ti-input" />
        </div>

        <div className="field">
          <label className="field-label">{t.common.amount}{preview && <span style={{ marginLeft: 8, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>{preview}</span>}</label>
          <TextInput value={amount} onChange={setAmount} placeholder="0.00" type="number" />
        </div>

        <div className="field">
          <label className="field-label">{t.common.category}</label>
          <Select
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map(c => ({ value: c.id, label: (locale === "th" ? c.th : c.en) }))}
          />
        </div>

        <div className="field">
          <label className="field-label">{t.common.note}</label>
          <TextInput value={note} onChange={setNote} placeholder={t.common.note} />
        </div>

        <div className="field">
          <label className="field-label">{t.common.account}</label>
          <Select
            value={account}
            onChange={setAccount}
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
