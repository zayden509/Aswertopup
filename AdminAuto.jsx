import React, { useEffect, useState } from "react";
import { Zap, RefreshCw, Loader2, Link2, Search, CheckCircle2, AlertTriangle, Webhook, Wallet, Crown, Trash2, ChevronRight } from "lucide-react";
import { backend, errorText } from "./backend.js";
import { Sheet, ErrorNote, formatPrice, formatDate } from "./ui.jsx";
import { Card, Chips, Empty, Field, Toggle, AdminButton, inputClass, normalize } from "./adminUi.jsx";
import { matchOffer } from "./fazerMatch.js";

const usd = (v) => `$${Number(v).toFixed(2)}`;

// Balans, plan ak webhook FazerCards la
function FazerStatus({ onToast }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setError("");
    try {
      setState(await backend.adminFazer("status"));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => { load(); }, []);

  const connect = async () => {
    setBusy(true);
    try {
      const res = await backend.adminFazer("setup-webhook");
      onToast(res.test?.ok ? "Webhook la konekte e li mache ✅" : `Webhook la anrejistre, men tès la pa pase (${res.test?.status || res.test?.error || "?"}).`);
      await load();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <Card
      title={<span className="flex items-center gap-2"><Zap className="h-5 w-5 text-violet-500" /> FazerCards</span>}
      action={
        <button type="button" onClick={load} aria-label="Rechaje" className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
        </button>
      }
    >
      {error ? (
        <div className="space-y-2">
          <ErrorNote>{error}</ErrorNote>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sèvè a bezwen 3 varyab nan Vercel (Settings → Environment Variables): <b>FAZER_API_KEY</b>, <b>BOT_EMAIL</b> ak <b>BOT_PASSWORD</b>.
          </p>
        </div>
      ) : !state ? (
        <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin text-sky-500" />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><Wallet className="h-3.5 w-3.5" /> Balans</p>
              <p className={`mt-1 text-xl font-extrabold ${Number(state.balance) < 5 ? "text-red-500" : "text-slate-900 dark:text-white"}`}>{usd(state.balance)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><Crown className="h-3.5 w-3.5" /> Plan</p>
              <p className="mt-1 text-xl font-extrabold capitalize text-slate-900 dark:text-white">{state.plan}</p>
              {state.plan_expires_at && <p className="text-xs text-slate-500 dark:text-slate-400">jiska {formatDate(state.plan_expires_at)}</p>}
            </div>
          </div>
          {Number(state.balance) < 5 && (
            <p className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 shrink-0" /> Balans lan ba. Mete kòb sou FazerCards (USDT oswa Binance Pay) pou kòmand yo pa bloke.
            </p>
          )}
          {!state.subscription_active && (
            <p className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 shrink-0" /> Abònman FazerCards la pa aktif: kòmand otomatik yo p ap pase.
            </p>
          )}
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
            <Webhook className={`h-5 w-5 shrink-0 ${state.webhook?.enabled ? "text-emerald-500" : "text-amber-500"}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{state.webhook?.enabled ? "Webhook konekte" : "Webhook poko konekte"}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {state.webhook?.enabled ? (state.webhook.failures ? `${state.webhook.failures} erè: ${state.webhook.last_failure_reason || ""}` : "FazerCards avèti sit la lè yon kòmand fini.") : "San li, peze Verifye sou chak kòmand."}
              </p>
            </div>
            <button type="button" onClick={connect} disabled={busy} className="shrink-0 rounded-xl bg-violet-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">
              {state.webhook?.enabled ? "Teste" : "Konekte"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

// Chwazi ki pwodwi FazerCards ki koresponn ak yon pake
function MappingSheet({ pkg, current, onClose, onToast }) {
  const [q, setQ] = useState(current?.category_name || pkg.product_name.split(" ").slice(0, 2).join(" "));
  const [categories, setCategories] = useState(null);
  const [category, setCategory] = useState(current ? { category_id: current.category_id, name: current.category_name } : null);
  const [offers, setOffers] = useState(null);
  const [offer, setOffer] = useState(current ? { offer_id: current.offer_id, name: current.offer_name, price_usd: current.price_usd } : null);
  const [fieldKey, setFieldKey] = useState(current?.field_key || null);
  const [fieldWarning, setFieldWarning] = useState("");
  const [auto, setAuto] = useState(current ? current.auto : true);
  const [rate, setRate] = useState("145");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    setBusy(true);
    setError("");
    try {
      setCategories((await backend.adminFazer("categories", { q })).items);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const pickCategory = async (c) => {
    setCategory(c);
    setOffer(null);
    setOffers(null);
    setBusy(true);
    setError("");
    try {
      const res = await backend.adminFazer("offers", { category_id: c.category_id });
      setOffers(res.offers);
      const text = res.fields.filter((f) => f.type === "text");
      setFieldKey(text[0]?.key || null);
      setFieldWarning(res.fields.length > 1 || res.fields.some((f) => f.type !== "text")
        ? `Jwèt sa a mande plizyè enfòmasyon (${res.fields.map((f) => f.label).join(", ")}). Sit la voye sèlman Player ID a: teste l byen anvan.`
        : "");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { if (!current) search(); }, []);

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await backend.adminSetSupplierMap(pkg.id, {
        category_id: category.category_id, category_name: category.name, offer_id: offer.offer_id, offer_name: offer.name,
        price_usd: String(offer.price_usd), field_key: fieldKey, auto,
      });
      onToast(auto ? `${pkg.label}: livrezon otomatik aktive ⚡` : `${pkg.label}: konekte, men an manyèl.`);
      onClose();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  const remove = async () => {
    await backend.adminDeleteSupplierMap(pkg.id).catch(() => {});
    onToast(`${pkg.label}: livrezon an manyèl kounye a.`);
    onClose();
  };

  const cost = offer ? Math.ceil(Number(offer.price_usd) * Number(rate || 0)) : 0;
  return (
    <Sheet
      open
      onClose={onClose}
      title="Livrezon otomatik"
      footer={
        <button type="button" onClick={save} disabled={busy || !offer} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-3.5 text-lg font-bold text-white disabled:opacity-50">
          {busy && <Loader2 className="h-5 w-5 animate-spin" />} Sove
        </button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pake sou sit ou</p>
          <p className="font-bold text-slate-900 dark:text-white">{pkg.product_name} · {pkg.label}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ou vann li {formatPrice(pkg.price)}</p>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">1. Jwèt la sou FazerCards</p>
          <form onSubmit={(e) => { e.preventDefault(); search(); }} className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Free Fire" className={inputClass} />
            <button type="submit" aria-label="Chèche" className="grid w-12 shrink-0 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              <Search className="h-5 w-5" />
            </button>
          </form>
          {categories && (
            <ul className="mt-2 space-y-1">
              {categories.length === 0 && <li className="text-sm text-slate-500">Anyen pa koresponn.</li>}
              {categories.map((c) => (
                <li key={c.category_id}>
                  <button type="button" onClick={() => pickCategory(c)} className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${category?.category_id === c.category_id ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30" : "bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"}`}>
                    {c.name} <span className="font-mono text-[11px] text-slate-400">{c.category_id}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {category && !categories && <p className="mt-2 text-sm font-semibold text-violet-600 dark:text-violet-300">{category.name}</p>}
        </div>

        {category && (
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">2. Pake FazerCards ki koresponn</p>
            {!offers && !offer && <Loader2 className="h-5 w-5 animate-spin text-violet-500" />}
            {!offers && offer && (
              <button type="button" onClick={() => pickCategory(category)} className="text-sm font-semibold text-violet-600 dark:text-violet-300">{offer.name} · {usd(offer.price_usd)} — chanje</button>
            )}
            {offers && (
              <ul className="space-y-1.5">
                {offers.map((o) => (
                  <li key={o.offer_id}>
                    <button type="button" onClick={() => setOffer(o)} className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left ${offer?.offer_id === o.offer_id ? "bg-violet-500 text-white" : "bg-slate-50 text-slate-800 dark:bg-slate-800/60 dark:text-slate-100"}`}>
                      <span className="font-semibold">{o.name}</span>
                      <span className="font-bold tabular-nums">{usd(o.price_usd)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {fieldWarning && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">{fieldWarning}</p>}
          </div>
        )}

        {offer && (
          <div className="space-y-3 rounded-2xl bg-violet-50/60 p-3 ring-1 ring-violet-100 dark:bg-violet-500/5 dark:ring-violet-500/20">
            <Field label="To dola a (HTG pou 1 $)">
              <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))} className={inputClass} />
            </Field>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Sa l koute w: <b>≈ {formatPrice(cost)}</b> · Ou vann li: <b>{formatPrice(pkg.price)}</b> ·{" "}
              <b className={pkg.price - cost >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>Benefis ≈ {formatPrice(pkg.price - cost)}</b>
            </p>
            <Toggle on={auto} onChange={setAuto} label={auto ? "Otomatik: voye l bay FazerCards touswit" : "Manyèl: ou trete l ou menm"} />
          </div>
        )}
        <ErrorNote>{error}</ErrorNote>
        {current && (
          <button type="button" onClick={remove} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
            <Trash2 className="h-4 w-4" /> Dekonekte pake sa a
          </button>
        )}
      </div>
    </Sheet>
  );
}

// Konekte tout pake Free Fire yo ak FazerCards an yon sèl kou (100 + BONUS 10 → 110 Diamonds…)
function AutoLink({ packages, supplierMap, onToast }) {
  const [regions, setRegions] = useState(null);
  const [region, setRegion] = useState(null);
  const [offers, setOffers] = useState(null);
  const [fieldKey, setFieldKey] = useState(null);
  const [skip, setSkip] = useState({}); // pake admin nan dekoche
  const [rate, setRate] = useState("145");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadRegion = async (c) => {
    setRegion(c);
    setOffers(null);
    setSkip({});
    const res = await backend.adminFazer("offers", { category_id: c.category_id });
    setOffers(res.offers || []);
    setFieldKey((res.fields || []).find((f) => f.type === "text")?.key || res.fields?.[0]?.key || null);
  };

  const run = async (task) => {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const start = () => run(async () => {
    const items = (await backend.adminFazer("categories", { q: "free fire" })).items || [];
    setRegions(items);
    const preferred = items.find((c) => /latam/i.test(c.name)) || items[0];
    if (preferred) await loadRegion(preferred);
  });

  const rows = offers ? packages.map((pkg) => {
    const offer = matchOffer(pkg, offers);
    const current = supplierMap[pkg.id];
    const same = current?.auto && current.offer_id === offer?.offer_id && current.category_id === region?.category_id;
    return { pkg, offer, same, checked: Boolean(offer) && !same && !skip[pkg.id] };
  }) : [];
  const chosen = rows.filter((r) => r.checked);

  const save = () => run(async () => {
    await Promise.all(chosen.map(({ pkg, offer }) => backend.adminSetSupplierMap(pkg.id, {
      category_id: region.category_id, category_name: region.name, offer_id: offer.offer_id, offer_name: offer.name,
      price_usd: String(offer.price_usd), field_key: fieldKey, auto: true,
    })));
    onToast(`${chosen.length} pake konekte ⚡ Kòmand yo ap ale kote FazerCards poukont yo.`);
  });

  const toHtg = (usdPrice) => Math.ceil(Number(usdPrice) * Number(rate || 0));

  return (
    <Card
      title={<span className="flex items-center gap-2"><Zap className="h-5 w-5 text-violet-500" /> Konekte Free Fire an yon sèl kou</span>}
      subtitle="Sit la jwenn pake FazerCards ki menm ak pa w yo (100 + BONUS 10 = 110 Diamonds…). Tcheke lis la, epi konfime."
    >
      {!regions ? (
        <AdminButton tone="primary" icon={Search} busy={busy} disabled={busy} onClick={start} className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500">
          Chèche pake FazerCards yo
        </AdminButton>
      ) : (
        <div className="space-y-3">
          {regions.length === 0 && <Empty>FazerCards pa jwenn Free Fire.</Empty>}
          {regions.length > 1 && (
            <Chips
              options={regions.map((c) => ({ id: c.category_id, label: c.name.replace(/^Free Fire\s*/i, "") || c.name }))}
              value={region?.category_id}
              onChange={(id) => run(() => loadRegion(regions.find((c) => c.category_id === id)))}
              label="Rejyon"
            />
          )}
          {region && !offers && <Loader2 className="h-5 w-5 animate-spin text-violet-500" />}
          {offers && (
            <>
              <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200 dark:divide-slate-800 dark:ring-slate-800">
                {rows.map(({ pkg, offer, same, checked }) => {
                  const cost = offer ? toHtg(offer.price_usd) : 0;
                  return (
                    <li key={pkg.id}>
                      <label className={`flex items-center gap-3 px-3 py-2.5 ${offer && !same ? "cursor-pointer" : ""}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!offer || same}
                          onChange={() => setSkip((s) => ({ ...s, [pkg.id]: !s[pkg.id] }))}
                          className="h-5 w-5 shrink-0 accent-violet-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{pkg.label} <span className="font-normal text-slate-500 dark:text-slate-400">· {formatPrice(pkg.price)}</span></span>
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                            {offer ? `→ ${offer.name} · ${usd(offer.price_usd)} (≈ ${formatPrice(cost)})` : "Pa jwenn pake ki koresponn: konekte l alamen anba a"}
                          </span>
                        </span>
                        {same ? (
                          <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">Deja konekte</span>
                        ) : offer ? (
                          <span className={`shrink-0 text-xs font-bold tabular-nums ${pkg.price - cost >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                            {pkg.price - cost >= 0 ? "+" : ""}{formatPrice(pkg.price - cost)}
                          </span>
                        ) : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <Field label="To dola a (HTG pou 1 $)">
                  <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))} className={`${inputClass} w-28`} />
                </Field>
                <AdminButton tone="primary" icon={Zap} busy={busy} disabled={busy || chosen.length === 0} onClick={save} className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500">
                  Konekte {chosen.length} pake
                </AdminButton>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Chif vèt la se benefis ou sou chak pake (pri ou − sa FazerCards koute). Si l wouj, monte pri a nan Pwodwi anvan.</p>
            </>
          )}
        </div>
      )}
      <div className="mt-3"><ErrorNote>{error}</ErrorNote></div>
    </Card>
  );
}

export default function AdminAuto({ account, supplierMap, onToast }) {
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState("");
  const q = normalize(search.trim());
  const packages = Object.values(account.prices)
    .filter((p) => !q || normalize(`${p.product_name} ${p.label}`).includes(q))
    .sort((a, b) => String(a.product_name).localeCompare(String(b.product_name)) || a.sort - b.sort);
  const open = openId ? account.prices[openId] : null;
  const autoCount = Object.values(supplierMap).filter((m) => m.auto).length;

  return (
    <div className="space-y-4">
      <FazerStatus onToast={onToast} />

      <AutoLink
        packages={Object.values(account.prices).filter((p) => /free fire/i.test(p.product_name)).sort((a, b) => a.price - b.price)}
        supplierMap={supplierMap}
        onToast={onToast}
      />

      <Card title={`Pake yo (${autoCount} otomatik)`}>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Peze yon pake pou w konekte l ak yon pwodwi FazerCards. Lè l <b>otomatik</b>, kòmand kliyan yo ale kote FazerCards touswit, epi yo make <b>Livré</b> poukont yo. Si FazerCards echwe, kliyan an ranbouse otomatikman.
        </p>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chèche yon pake" className={`${inputClass} mb-3`} />
        {packages.length === 0 ? (
          <Empty>Pa gen pake. Ajoute yo nan Pwodwi an premye.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {packages.map((p) => {
              const m = supplierMap[p.id];
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => setOpenId(p.id)} className="flex w-full items-center gap-3 py-3 text-left">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${m?.auto ? "bg-violet-500 text-white" : m ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                      {m?.auto ? <Zap className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-900 dark:text-white">{p.label}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {p.product_name} · {m ? `${m.offer_name} · ${usd(m.price_usd)}${m.auto ? "" : " · manyèl"}` : "Pa konekte"}
                      </span>
                    </span>
                    {m?.auto && <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-500" />}
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {open && <MappingSheet key={open.id} pkg={open} current={supplierMap[open.id]} onClose={() => setOpenId(null)} onToast={onToast} />}
    </div>
  );
}
