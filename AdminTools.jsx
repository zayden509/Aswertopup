import React, { useEffect, useState } from "react";
import { DatabaseBackup, FileSpreadsheet, Lock, BellRing, Send } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { ErrorNote, formatPrice, orderStatus, isPaidOrder, DEPOSIT_STATUS } from "./ui.jsx";
import { Card, AdminButton, inputClass } from "./adminUi.jsx";

// Backup ak rapò Excel pou pwopriyetè a

const LAST_BACKUP = "awens.lastBackup";

// Telechaje yon fichye ki fèt sou telefòn nan (san sèvè)
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Dat ak lè an Ayiti, nan yon fòm Excel konprann: 2026-10-29 14:05
const STAMP = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Port-au-Prince", dateStyle: "short", timeStyle: "short" });
const stamp = (value) => (value ? STAMP.format(new Date(value)) : "");

// CSV pou Excel (franse): ";" ant kolòn yo, BOM UTF-8 pou aksan yo
const cell = (value) => {
  const text = value == null ? "" : String(value);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const toCsv = (rows) => `﻿${rows.map((row) => row.map(cell).join(";")).join("\r\n")}`;

export function BackupCard({ owner, onToast }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [last, setLast] = useState(() => {
    try {
      return localStorage.getItem(LAST_BACKUP);
    } catch {
      return null;
    }
  });

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await backend.adminExportAll();
      const day = data.exported_at.slice(0, 10);
      download(`awens-backup-${day}.json`, JSON.stringify(data), "application/json");
      try {
        localStorage.setItem(LAST_BACKUP, data.exported_at);
      } catch {
        // navigatè a pa kenbe dat la: backup la fèt kanmenm
      }
      setLast(data.exported_at);
      const count = ["users", "orders", "deposits"].map((k) => `${data[k].length} ${k === "users" ? "kont" : k === "orders" ? "kòmand" : "depo"}`).join(", ");
      onToast(`Backup telechaje: ${count}.`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title={<span className="flex items-center gap-2"><DatabaseBackup className="h-5 w-5 text-sky-500" /> Backup done yo</span>}
      subtitle="Yon kopi tout kont, kòmand, depo ak pwodwi yo nan yon fichye. Fè l yon fwa pa semèn, epi kenbe fichye a yon kote ki an sekirite (Google Drive, imèl)."
    >
      {owner ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {last ? `Dènye backup sou aparèy sa a: ${stamp(last)}` : "Poko gen backup sou aparèy sa a."}
          </p>
          <AdminButton tone="primary" icon={DatabaseBackup} busy={busy} disabled={busy} onClick={save}>Telechaje backup la</AdminButton>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Lock className="h-4 w-4" /> Se pwopriyetè a sèlman ki ka telechaje backup la.</p>
      )}
      <ErrorNote>{error}</ErrorNote>
    </Card>
  );
}

const thisMonth = () => STAMP.format(new Date()).slice(0, 7);

// Premye jou mwa a ak premye jou mwa apre a, a minwi (lè Ayiti an ivè, UTC-5)
function monthRange(month) {
  const [y, m] = month.split("-").map(Number);
  const at = (year, mon) => new Date(`${year}-${String(mon).padStart(2, "0")}-01T00:00:00-05:00`);
  return [at(y, m), m === 12 ? at(y + 1, 1) : at(y, m + 1)];
}

export function ReportsCard({ profiles, onToast }) {
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const who = (uid) => profiles[uid] || {};

  const load = async () => {
    setBusy(true);
    setError("");
    try {
      const [from, to] = monthRange(month);
      setData({ month, ...(await backend.adminPeriodData(from, to)) });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const sales = data ? data.orders.filter(isPaidOrder) : [];
  const confirmed = data ? data.deposits.filter((d) => d.status === "completed") : [];
  const total = (list) => list.reduce((sum, x) => sum + Number(x.price ?? x.amount ?? 0), 0);

  const exportOrders = () => {
    const rows = [["Dat", "Kòd", "Kliyan", "Imèl", "Pwodwi", "Pake", "Player ID", "Pri (HTG)", "Estati", "FazerCards"]];
    data.orders.forEach((o) => rows.push([
      stamp(o.created_at), o.code, who(o.user_id).full_name, who(o.user_id).email, o.product_name, o.package_label,
      o.player_id, o.price, orderStatus(o).label, o.supplier?.status || "",
    ]));
    rows.push([], ["Total lavant (san sa ki refize)", "", "", "", "", "", "", total(sales)]);
    download(`awens-kommand-${data.month}.csv`, toCsv(rows), "text/csv;charset=utf-8");
    onToast("Rapò kòmand yo telechaje.");
  };

  const exportDeposits = () => {
    const rows = [["Dat", "Kliyan", "Imèl", "Mòd", "Kòd tranzaksyon", "Montan (HTG)", "Estati", "Nòt"]];
    data.deposits.forEach((d) => rows.push([
      stamp(d.created_at), who(d.user_id).full_name, who(d.user_id).email, d.method === "natcash" ? "NatCash" : "MonCash",
      d.reference, d.amount, DEPOSIT_STATUS[d.status]?.label || d.status, d.admin_note,
    ]));
    rows.push([], ["Total depo konfime", "", "", "", "", total(confirmed)]);
    download(`awens-depo-${data.month}.csv`, toCsv(rows), "text/csv;charset=utf-8");
    onToast("Rapò depo yo telechaje.");
  };

  const exportCustomers = () => {
    const rows = [["Non", "Imèl", "AWENS-ID", "Balans (HTG)", "Total depanse (HTG)", "Admin", "Kreye"]];
    Object.values(profiles)
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
      .forEach((p) => rows.push([p.full_name, p.email, p.wallet_code, p.balance, p.total_spent, p.is_admin ? "Wi" : "", stamp(p.created_at)]));
    download(`awens-kliyan-${thisMonth()}.csv`, toCsv(rows), "text/csv;charset=utf-8");
    onToast("Lis kliyan yo telechaje.");
  };

  return (
    <Card
      title={<span className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-emerald-500" /> Rapò Excel</span>}
      subtitle="Chwazi yon mwa, epi telechaje lavant ak depo yo pou kontablite (fichye CSV ki louvri nan Excel oswa Google Sheets)."
    >
      <div className="flex flex-wrap items-center gap-2">
        <input type="month" value={month} max={thisMonth()} onChange={(e) => { setMonth(e.target.value); setData(null); }} className={`${inputClass} w-44`} aria-label="Mwa a" />
        <AdminButton tone="primary" busy={busy} disabled={busy || !month} onClick={load}>Prepare rapò a</AdminButton>
        <AdminButton onClick={exportCustomers} icon={FileSpreadsheet}>Lis kliyan yo</AdminButton>
      </div>
      <ErrorNote>{error}</ErrorNote>
      {data && (
        <div className="mt-3 space-y-3" data-testid="report">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {data.orders.length} kòmand · lavant <b>{formatPrice(total(sales))}</b> · {data.deposits.length} depo · konfime <b>{formatPrice(total(confirmed))}</b>
          </p>
          <div className="flex flex-wrap gap-2">
            <AdminButton tone="success" icon={FileSpreadsheet} onClick={exportOrders}>Kòmand yo (Excel)</AdminButton>
            <AdminButton tone="success" icon={FileSpreadsheet} onClick={exportDeposits}>Depo yo (Excel)</AdminButton>
          </div>
        </div>
      )}
    </Card>
  );
}

// Alèt Telegram: pwopriyetè a resevwa yon mesaj lè yon bagay bezwen l
export function AlertsCard({ owner, onToast }) {
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => backend.subscribeAlerts(setSettings), []);

  const run = async (action) => {
    setBusy(action);
    setError("");
    const r = await backend.alertsAction(action);
    setBusy("");
    if (!r?.ok) return setError(r?.error || "Sa pa mache. Eseye ankò.");
    onToast(action === "connect" ? `Telegram konekte (${r.chat_name}). Gade mesaj tès la.` : "Mesaj tès la voye sou Telegram.");
  };

  const connected = Boolean(settings?.chat_id);
  return (
    <Card
      title={<span className="flex items-center gap-2"><BellRing className="h-5 w-5 text-amber-500" /> Alèt sou Telegram</span>}
      subtitle="Sit la voye yon mesaj ba ou lè: yon kòmand FazerCards echwe, balans FazerCards ap fini, telefòn httpSMS la pa voye SMS ankò, oswa yon gwo depo ap tann ou. Chak maten, yon rezime jounen an."
    >
      {connected ? (
        <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30" data-testid="alerts-status">
          ✅ Konekte ak {settings.chat_name}{settings.bot_name ? ` (bot @${settings.bot_name})` : ""}
        </p>
      ) : (
        <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300" data-testid="alerts-status">
          <li>Nan Telegram, louvri <b>@BotFather</b>, voye <b>/newbot</b>, epi chwazi yon non. Li ba ou yon <b>token</b>.</li>
          <li>Nan <b>Vercel → Settings → Environment Variables</b>, ajoute <b>TELEGRAM_BOT_TOKEN</b> = token an, epi fè <b>Redeploy</b>. Pa voye token an bay pèsonn.</li>
          <li>Louvri bot ou fèk kreye a nan Telegram, epi peze <b>Start</b>.</li>
          <li>Peze <b>Konekte Telegram</b> anba a.</li>
        </ol>
      )}
      {owner ? (
        <div className="flex flex-wrap gap-2">
          <AdminButton tone={connected ? "ghost" : "primary"} icon={BellRing} busy={busy === "connect"} disabled={Boolean(busy)} onClick={() => run("connect")}>
            {connected ? "Konekte ankò" : "Konekte Telegram"}
          </AdminButton>
          {connected && <AdminButton icon={Send} busy={busy === "test"} disabled={Boolean(busy)} onClick={() => run("test")}>Voye yon tès</AdminButton>}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Lock className="h-4 w-4" /> Se pwopriyetè a sèlman ki ka konekte alèt yo.</p>
      )}
      <ErrorNote>{error}</ErrorNote>
    </Card>
  );
}
