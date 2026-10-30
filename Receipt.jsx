import React, { useState } from "react";
import { ReceiptText, Loader2 } from "lucide-react";
import { SITE_URL, WHATSAPP_NUMBER } from "./data.js";

// Resi (foto PNG) yon achte, yon depo oswa yon transfè, desine sou telefòn nan:
// kliyan an ka telechaje l oswa voye l sou WhatsApp. Kòd kat kado yo pa janm ladan l.

const W = 720;
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const STAMP = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });
const htg = (n) => `${new Intl.NumberFormat("fr-FR").format(Math.abs(n))} HTG`;
const phone = WHATSAPP_NUMBER.replace(/^509(\d{2})(\d{2})(\d{4})$/, "+509 $1 $2 $3");

function diamond(ctx, x, y, s) {
  const g = ctx.createLinearGradient(x, y, x + s, y + s);
  g.addColorStop(0, "#22d3ee");
  g.addColorStop(1, "#6366f1");
  ctx.fillStyle = g;
  ctx.beginPath();
  const p = (px, py) => [x + (px / 64) * s, y + (py / 64) * s];
  [[18, 8], [46, 8], [60, 24], [32, 58], [4, 24]].forEach(([px, py], i) => (i ? ctx.lineTo(...p(px, py)) : ctx.moveTo(...p(px, py))));
  ctx.closePath();
  ctx.fill();
}

// Koupe yon tèks long an plizyè liy pou l antre nan lajè a
function wrap(ctx, text, width) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// { title, amount (+/-), status, rows: [[etikèt, valè]], customer, date }
export function drawReceipt({ title, amount, status, rows, customer, date }) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const lineHeight = 46;
  ctx.font = `500 26px ${FONT}`;
  const wrapped = rows.map(([label, value]) => [label, wrap(ctx, value, 400)]);
  ctx.font = `700 30px ${FONT}`;
  const titleLines = wrap(ctx, title, W - 96).slice(0, 2);
  const shift = (titleLines.length - 1) * 38;
  const height = 470 + shift + wrapped.reduce((h, [, lines]) => h + lineHeight + (lines.length - 1) * 32, 0) + 150;
  canvas.width = W;
  canvas.height = height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, height);
  // Antèt
  const head = ctx.createLinearGradient(0, 0, W, 180);
  head.addColorStop(0, "#020617");
  head.addColorStop(1, "#0c4a6e");
  ctx.fillStyle = head;
  ctx.fillRect(0, 0, W, 170);
  diamond(ctx, 48, 48, 64);
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 44px ${FONT}`;
  ctx.fillText("AWENS", 128, 98);
  const awens = ctx.measureText("AWENS").width;
  ctx.fillStyle = "#38bdf8";
  ctx.font = `800 20px ${FONT}`;
  ctx.fillText("T O P U P", 140 + awens, 98);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText("Resi", 128, 132);

  // Tit, montan, estati
  ctx.fillStyle = "#0f172a";
  ctx.font = `700 30px ${FONT}`;
  titleLines.forEach((line, i) => ctx.fillText(line, 48, 230 + i * 38));
  ctx.fillStyle = amount < 0 ? "#ea580c" : "#059669";
  ctx.font = `900 56px ${FONT}`;
  ctx.fillText(`${amount < 0 ? "−" : "+"}${htg(amount)}`, 48, 300 + shift);
  ctx.font = `700 22px ${FONT}`;
  const pill = ctx.measureText(status).width + 36;
  ctx.fillStyle = "#f1f5f9";
  ctx.beginPath();
  ctx.roundRect(48, 330 + shift, pill, 44, 22);
  ctx.fill();
  ctx.fillStyle = "#334155";
  ctx.fillText(status, 66, 360 + shift);

  // Detay yo
  let y = 430 + shift;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  for (const [label, lines] of wrapped) {
    ctx.beginPath();
    ctx.moveTo(48, y - 34);
    ctx.lineTo(W - 48, y - 34);
    ctx.stroke();
    ctx.fillStyle = "#64748b";
    ctx.font = `500 24px ${FONT}`;
    ctx.fillText(label, 48, y);
    ctx.fillStyle = "#0f172a";
    ctx.font = `600 26px ${FONT}`;
    ctx.textAlign = "right";
    lines.forEach((line, i) => ctx.fillText(line, W - 48, y + i * 32));
    ctx.textAlign = "left";
    y += lineHeight + (lines.length - 1) * 32;
  }

  // Pye paj la
  y = height - 110;
  ctx.fillStyle = "#64748b";
  ctx.font = `500 22px ${FONT}`;
  if (customer) ctx.fillText(customer, 48, y);
  ctx.fillText(`Resi fèt ${STAMP.format(date || new Date())}`, 48, y + 34);
  ctx.fillStyle = "#0284c7";
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText(`${SITE_URL.replace(/^https?:\/\//, "")} · WhatsApp ${phone}`, 48, y + 70);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

// Pataje resi a (WhatsApp…) si telefòn nan kapab, sinon telechaje l
export async function shareReceipt(blob, name) {
  const file = new File([blob], name, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Resi Awens Topup" });
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return "downloaded";
}

export function ReceiptButton({ receipt, name, onToast, className = "" }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const result = await shareReceipt(await drawReceipt(receipt()), name);
      if (result === "downloaded") onToast?.("Resi a telechaje.");
    } catch {
      onToast?.("Resi a pa ka fèt sou telefòn sa a.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-50 py-3 font-bold text-sky-700 ring-1 ring-sky-100 hover:bg-sky-100 disabled:opacity-60 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20 ${className}`}
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ReceiptText className="h-5 w-5" />} Telechaje / pataje resi a
    </button>
  );
}
