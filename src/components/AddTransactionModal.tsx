'use client';

import React, { useState, useEffect } from 'react';
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

export function AddTransactionModal({ open, onClose, onSubmit, categories, editing }: AddTransactionModalProps) {
  const { tweaks } = useTweaks();
  const locale = tweaks.locale;
  const t = I18N[locale];

  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [account, setAccount] = useState("SCB Easy");
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter(c => c.kind === txType);

  useEffect(() => {
    if (open) {
      if (editing) {
        const type = editing.amount >= 0 ? "income" : "expense";
        setTxType(type);
        setDate(new Date(editing.date).toISOString().split('T')[0]);
        setAmount(Math.abs(editing.amount).toString());
        setCategoryId(editing.categoryId);
        setNote(editing.note);
        setAccount(editing.account);
      } else {
        setTxType("expense");
        setDate(new Date().toISOString().split('T')[0]);
        setAmount("");
        const expenseCats = categories.filter(c => c.kind === "expense");
        setCategoryId(expenseCats[0]?.id ?? "");
        setNote("");
        setAccount("SCB Easy");
      }
    }
  }, [editing, open]);

  const handleTypeChange = (type: "income" | "expense") => {
    setTxType(type);
    const cats = categories.filter(c => c.kind === type);
    setCategoryId(cats[0]?.id ?? "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || !categoryId) return;
    setSaving(true);
    try {
      await onSubmit({
        id: editing?.id,
        date: new Date(date).toISOString(),
        amount: txType === "expense" ? -amt : amt,
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
    const amt = parseFloat(amount) || 0;
    if (!amt) return null;
    return formatTHB(txType === "expense" ? -amt : amt, { sign: true });
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
                border: txType === "income" ? "2px solid var(--income)" : "2px solid var(--line)",
                background: txType === "income" ? "color-mix(in oklab, var(--income) 10%, transparent)" : "transparent",
                color: txType === "income" ? "var(--income)" : "var(--ink-3)",
                fontWeight: txType === "income" ? 600 : 400,
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
                border: txType === "expense" ? "2px solid var(--expense)" : "2px solid var(--line)",
                background: txType === "expense" ? "color-mix(in oklab, var(--expense) 10%, transparent)" : "transparent",
                color: txType === "expense" ? "var(--expense)" : "var(--ink-3)",
                fontWeight: txType === "expense" ? 600 : 400,
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
            options={filteredCategories.map(c => ({ value: c.id, label: (locale === "th" ? c.th : c.en) }))}
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
