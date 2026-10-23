import React, { useMemo, useRef, useState } from "react";
import { Search, Plus, Loader2, PackagePlus, Trash2, Pencil, ImagePlus, X, EyeOff, Eye, ChevronRight } from "lucide-react";
import { PRODUCTS, CATEGORIES } from "./data.js";
import { backend, errorText } from "./backend.js";
import { allProducts } from "./catalog.js";
import { Sheet, ProductArt, ErrorNote, formatPrice, minPrice, packageName } from "./ui.jsx";
import { Chips, Empty, Field, Toggle, inputClass, normalize } from "./adminUi.jsx";
import { squarePhoto } from "./image.js";
import { quote } from "./exchange.js";

const rateFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

const PRODUCT_CATEGORIES = CATEGORIES.filter((c) => c !== "Tout");

// Tout pake ki nan data.js, jan yo dwe ye nan baz done a
const BUILT_IN_PACKAGES = PRODUCTS.flatMap((product) =>
  (product.groups || []).flatMap((group) => group.items.map((item) => ({ product, item }))),
)
  .filter(({ item }, index, all) => all.findIndex((x) => x.item.id === item.id) === index)
  .map(({ product, item }, sort) => ({
    id: item.id,
    product_name: product.name,
    label: packageName(item),
    price: item.price,
    needs_id: Boolean(item.needsId),
    sort,
  }));

function PriceRow({ pkg, onToast, onDelete }) {
  const [price, setPrice] = useState(String(Number(pkg.price)));
  const [available, setAvailable] = useState(pkg.available);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = Number(price) !== Number(pkg.price) || available !== pkg.available;

  const save = async () => {
    setBusy(true);
    try {
      await backend.adminSetPackage(pkg.id, price, available);
      onToast(`${pkg.label}: ${formatPrice(Number(price))}${available ? "" : " (kache)"}.`);
    } catch (error) {
      onToast(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await onDelete();
      onToast(`${pkg.label} retire.`);
    } catch (error) {
      onToast(errorText(error));
      setBusy(false);
    }
  };

  return (
    <li className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 [overflow-wrap:anywhere] dark:text-white">{pkg.label}</p>
          {pkg.needs_id && <p className="text-xs text-slate-500 dark:text-slate-400">Mande Player ID</p>}
        </div>
        <label className="flex items-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-2 focus-within:border-sky-400 dark:border-slate-700 dark:bg-slate-950">
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-label={`Pri ${pkg.label}`}
            className="w-20 bg-transparent py-2 text-right font-bold tabular-nums focus:outline-none"
          />
          <span className="text-xs font-semibold text-slate-400">HTG</span>
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Toggle on={available} onChange={setAvailable} label={available ? "Vizib" : "Kache"} />
        {onDelete && (
          confirmDelete ? (
            <button type="button" disabled={busy} onClick={remove} className="ml-auto rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">Konfime</button>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} aria-label={`Retire ${pkg.label}`} className="ml-auto grid h-9 w-9 place-items-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
              <Trash2 className="h-4 w-4" />
            </button>
          )
        )}
        <button type="button" disabled={!dirty || busy} onClick={save} className={`${onDelete ? "" : "ml-auto"} rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700`}>
          {busy && !confirmDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sove"}
        </button>
      </div>
    </li>
  );
}

function AddPackageForm({ product, groups, nextSort, onToast }) {
  const [group, setGroup] = useState(groups[0] || "Offres");
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [needsId, setNeedsId] = useState(Boolean(product.playerId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await backend.adminAddPackage({ productId: product.id, productName: product.name, group, label, price, needsId, sort: nextSort });
      onToast(`${label.trim()} ajoute sou ${product.name}.`);
      setLabel("");
      setPrice("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={add} className="space-y-3 rounded-2xl bg-sky-50/70 p-4 ring-1 ring-sky-100 dark:bg-sky-500/5 dark:ring-sky-500/20">
      <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><PackagePlus className="h-5 w-5 text-sky-500" /> Ajoute yon pake</h3>
      <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
        <Field label="Non pake a">
          <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="Egzanp: 1 mwa, 500 dyaman" className={inputClass} />
        </Field>
        <Field label="Pri (HTG)">
          <input type="number" inputMode="numeric" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" className={inputClass} />
        </Field>
      </div>
      <Field label="Seksyon" hint="Pake ki gen menm seksyon parèt ansanm sou paj pwodwi a.">
        <input value={group} onChange={(e) => setGroup(e.target.value)} maxLength={40} list={`groups-${product.id}`} className={inputClass} />
        <datalist id={`groups-${product.id}`}>
          {[...new Set([...groups, "Offres"])].map((g) => <option key={g} value={g} />)}
        </datalist>
      </Field>
      <Toggle on={needsId} onChange={setNeedsId} label="Mande Player ID (UID) kliyan an" />
      <ErrorNote>{error}</ErrorNote>
      <button type="submit" disabled={busy || !label.trim() || !price} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-bold text-white disabled:opacity-50">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />} Ajoute pake a
      </button>
    </form>
  );
}

// Kreye oswa modifye yon pwodwi admin nan te ajoute
function ProductForm({ product, nextSort, packageIds, onClose, onSaved, onToast }) {
  const raw = product?.raw;
  const [name, setName] = useState(raw?.name || "");
  const [category, setCategory] = useState(raw?.category || "Jwèt");
  const [image, setImage] = useState(raw?.image || "");
  const [link, setLink] = useState(raw?.image?.startsWith("https://") ? raw.image : "");
  const [playerId, setPlayerId] = useState(raw?.player_id ?? true);
  const [isNew, setIsNew] = useState(raw?.is_new ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      setImage(await squarePhoto(file));
      setLink("");
    } catch (err) {
      setError(err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const url = link.trim();
    if (url && !/^https:\/\/\S+$/.test(url)) {
      setError("Lyen foto a dwe kòmanse ak https://");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const id = await backend.adminSaveProduct(
        { id: raw?.id, name, category, image: url || image || null, is_new: isNew, player_id: playerId, sort: raw?.sort ?? nextSort },
        packageIds,
      );
      onToast(raw ? "Pwodwi a modifye." : `${name.trim()} kreye. Ajoute pake li yo kounye a.`);
      onSaved(id);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  const preview = link.trim() || image;
  return (
    <Sheet
      open
      onClose={onClose}
      title={raw ? "Modifye pwodwi a" : "Nouvo pwodwi"}
      footer={
        <button type="submit" form="product-form" disabled={busy || name.trim().length < 2} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3.5 text-lg font-bold text-white disabled:opacity-50">
          {busy && <Loader2 className="h-5 w-5 animate-spin" />} {raw ? "Sove" : "Kreye pwodwi a"}
        </button>
      }
    >
      <form id="product-form" onSubmit={save} className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-slate-400 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
            aria-label="Chwazi yon foto"
          >
            {preview ? <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <ImagePlus className="h-8 w-8" />}
          </button>
          <div className="min-w-0 space-y-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-900">
              {preview ? "Chanje foto a" : "Chwazi yon foto"}
            </button>
            {preview && (
              <button type="button" onClick={() => { setImage(""); setLink(""); }} className="flex items-center gap-1 text-sm font-semibold text-red-500">
                <X className="h-4 w-4" /> Retire foto a
              </button>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">Yon foto kare parèt pi byen.</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
        </div>
        <Field label="Oswa kole lyen yon foto" hint="Si w kole yon lyen, li ranplase foto ou chwazi a.">
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" inputMode="url" className={inputClass} />
        </Field>
        <Field label="Non pwodwi a">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Egzanp: Fortnite" className={inputClass} />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Kategori</p>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${c === category ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Toggle on={playerId} onChange={setPlayerId} label="Mande Player ID (UID) kliyan an" />
          <Toggle on={isNew} onChange={setIsNew} label="Mete badge NOUVEAU" />
        </div>
        <ErrorNote>{error}</ErrorNote>
      </form>
    </Sheet>
  );
}

// To, limit ak frè palye yon pwodwi Finans (Meru, PayPal…). San dokiman nan baz done a,
// fòm nan ranpli ak valè pa defo ki nan data.js, epi pwodwi a pa disponib pou kliyan yo.
function ExchangeEditor({ product, live, onToast }) {
  const base = { ...product.exchange, ...live };
  const [rate, setRate] = useState(String(base.rate));
  const [currency, setCurrency] = useState(base.currency);
  const [min, setMin] = useState(String(base.min));
  const [max, setMax] = useState(String(base.max));
  const [tiers, setTiers] = useState(base.tiers.map((t) => ({ max: String(t.max), fee: String(t.fee) })));
  const [available, setAvailable] = useState(live ? live.available : true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setTier = (i, field, value) => setTiers((list) => list.map((t, j) => (j === i ? { ...t, [field]: value.replace(/[^\d]/g, "") } : t)));
  const preview = (() => {
    const config = { rate: Number(rate), min: Number(min), max: Number(max), tiers: tiers.map((t) => ({ max: Number(t.max), fee: Number(t.fee) })).sort((a, b) => a.max - b.max) };
    if (!(config.rate > 0) || config.tiers.some((t) => !t.max)) return null;
    return [10, 25, 100].map((a) => ({ a, ...quote(config, a) }));
  })();

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await backend.adminSetExchange(product.id, { productName: product.name, currency, rate: rate.replace(",", "."), min, max, tiers, available });
      onToast(available ? `${product.name}: 1 ${currency.toUpperCase()} = ${rate} HTG.` : `${product.name} dezaktive.`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const small = "w-full rounded-xl border-2 border-slate-200 bg-white px-2.5 py-2 text-right font-bold tabular-nums focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950";
  return (
    <section className="space-y-4">
      {!live && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
          Konvèsyon an poko aktive: kliyan yo wè pwodwi a men yo pa ka achte. Verifye to a ak frè yo, epi peze <b>Sove</b>.
        </p>
      )}
      <Toggle on={available} onChange={setAvailable} label={available ? "Kliyan yo ka achte" : "Pa disponib"} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={`To: HTG pou 1 ${currency || "?"}`}>
          <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))} className={inputClass} />
        </Field>
        <Field label="Lajan">
          <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 10))} className={inputClass} />
        </Field>
        <Field label="Minimòm">
          <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} className={inputClass} />
        </Field>
        <Field label="Maksimòm">
          <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} className={inputClass} />
        </Field>
      </div>

      <div>
        <div className="mb-2 grid grid-cols-[1fr_1fr_2.25rem] gap-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <span>Jiska ({currency})</span><span>Frè ({currency})</span><span />
        </div>
        <ul className="space-y-2">
          {tiers.map((t, i) => (
            <li key={i} className="grid grid-cols-[1fr_1fr_2.25rem] items-center gap-2">
              <input inputMode="numeric" aria-label={`Palye ${i + 1}: jiska`} value={t.max} onChange={(e) => setTier(i, "max", e.target.value)} className={small} />
              <input inputMode="numeric" aria-label={`Palye ${i + 1}: frè`} value={t.fee} onChange={(e) => setTier(i, "fee", e.target.value)} className={small} />
              <button type="button" onClick={() => setTiers((list) => list.filter((_, j) => j !== i))} disabled={tiers.length === 1} aria-label={`Retire palye ${i + 1}`} className="grid h-9 w-9 place-items-center rounded-xl text-red-500 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setTiers((list) => [...list, { max: "", fee: "" }])} className="mt-2 flex items-center gap-1.5 text-sm font-bold text-sky-600 dark:text-sky-400">
          <Plus className="h-4 w-4" /> Ajoute yon palye
        </button>
      </div>

      {preview && (
        <div className="rounded-2xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
          <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">Egzanp</p>
          {preview.map((p) => (
            <p key={p.a} className="tabular-nums text-slate-600 dark:text-slate-300">{p.a} {currency} + {p.fee} frè → <b className="text-slate-900 dark:text-white">{formatPrice(p.price)}</b></p>
          ))}
        </div>
      )}
      <ErrorNote>{error}</ErrorNote>
      <button type="button" onClick={save} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-bold text-white disabled:opacity-60">
        {busy && <Loader2 className="h-5 w-5 animate-spin" />} Sove
      </button>
    </section>
  );
}

function ProductSheet({ product, prices, exchange, hidden, nextSort, onEdit, onClose, onToast }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const builtInIds = (PRODUCTS.find((p) => p.id === product.id)?.groups || []).flatMap((g) => g.items.map((i) => i.id));
  const added = (product.groups || []).filter((g) => g.style === "offer").flatMap((g) => g.items.map((i) => i.id));
  const groupTitles = [...new Set((product.groups || []).map((g) => g.title))];
  const notInDb = builtInIds.filter((id) => !prices[id]);

  const setVisible = async (visible) => {
    try {
      await backend.adminSetHidden(visible ? hidden.filter((id) => id !== product.id) : [...hidden, product.id]);
      onToast(visible ? `${product.name} parèt sou sit la.` : `${product.name} kache.`);
    } catch (error) {
      onToast(errorText(error));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await backend.adminDeleteProduct(product.id, added);
      onToast(`${product.name} efase.`);
      onClose();
    } catch (error) {
      onToast(errorText(error));
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={product.name}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <ProductArt product={product} className="relative h-20 w-20 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">{product.category}{product.custom ? " · Pwodwi ou kreye" : ""}</p>
            <Toggle on={!product.hidden} onChange={setVisible} label={product.hidden ? "Kache sou sit la" : "Vizib sou sit la"} />
          </div>
        </div>
        {product.custom && (
          <button type="button" onClick={onEdit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Pencil className="h-4 w-4" /> Modifye non, foto, kategori
          </button>
        )}

        {product.exchange ? (
          <>
            <h3 className="font-bold text-slate-900 dark:text-white">To ak frè</h3>
            <ExchangeEditor key={JSON.stringify(exchange[product.id] || null)} product={product} live={exchange[product.id]} onToast={onToast} />
          </>
        ) : (
          <>
            <section>
              <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Pake ak pri</h3>
              {notInDb.length > 0 && (
                <p className="mb-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
                  {notInDb.length} pake poko nan baz done a. Peze <b>Ajoute yo ak pri ki nan sit la</b> nan lis pwodwi yo.
                </p>
              )}
              {builtInIds.length + added.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Pwodwi sa a poko gen pake. Kliyan yo wè yon bouton pou mande pri sou WhatsApp.</p>
              ) : (
                <ul className="space-y-2">
                  {[...builtInIds, ...added].filter((id) => prices[id]).map((id) => {
                    const pkg = prices[id];
                    return (
                      <PriceRow
                        key={`${id}-${pkg.price}-${pkg.available}`}
                        pkg={pkg}
                        onToast={onToast}
                        onDelete={added.includes(id) ? () => backend.adminDeletePackage(id) : undefined}
                      />
                    );
                  })}
                </ul>
              )}
            </section>

            <AddPackageForm product={product} groups={groupTitles} nextSort={nextSort} onToast={onToast} />
          </>
        )}

        {product.custom && (
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            {confirmDelete ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-300">Efase {product.name} ak tout pake li yo? Kòmand ki deja fèt yo pa chanje.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-xl bg-slate-100 py-2.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Anile</button>
                  <button type="button" disabled={busy} onClick={remove} className="flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 font-bold text-white disabled:opacity-60">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} Efase
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" /> Efase pwodwi a
              </button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}

const FILTERS = [{ id: "Tout", label: "Tout" }, ...PRODUCT_CATEGORIES.map((c) => ({ id: c, label: c })), { id: "hidden", label: "Kache" }];

export default function AdminCatalog({ account, onToast }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tout");
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null); // { product } pou modifye, {} pou kreye
  const [adding, setAdding] = useState(false);
  const prices = account.prices;
  const products = useMemo(() => allProducts(prices, account.catalog), [prices, account.catalog]);
  const hidden = account.catalog.hidden;
  const open = products.find((p) => p.id === openId) || null;
  const nextSort = Math.max(0, ...Object.values(prices).map((p) => p.sort || 0)) + 1;
  const nextProductSort = Math.max(0, ...account.catalog.products.map((p) => p.sort || 0)) + 1;

  const missing = BUILT_IN_PACKAGES.filter((c) => !prices[c.id]);
  const exchange = account.catalog.exchange || {};
  const inactive = PRODUCTS.filter((p) => p.exchange && !exchange[p.id]);
  const addMissing = async () => {
    setAdding(true);
    try {
      await backend.adminAddPackages(missing);
      onToast(`${missing.length} pake ajoute nan baz done a.`);
    } catch (error) {
      onToast(errorText(error));
    } finally {
      setAdding(false);
    }
  };

  const q = normalize(search.trim());
  const list = products
    .filter((p) => (filter === "hidden" ? p.hidden : filter === "Tout" || p.category === filter))
    .filter((p) => !q || normalize(p.name).includes(q));

  return (
    <div className="space-y-4">
      {missing.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <b>{missing.length} pake</b> nan sit la poko nan baz done a, kidonk kliyan yo pa ka achte yo ankò.
          </p>
          <button type="button" onClick={addMissing} disabled={adding} className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />} Ajoute yo ak pri ki nan sit la
          </button>
        </div>
      )}

      {inactive.length > 0 && (
        <p className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/20">
          <b>{inactive.map((p) => p.name).join(", ")}</b> poko aktive. Louvri yo youn pa youn (kategori <b>Finans</b>), verifye to a ak frè yo, epi peze <b>Sove</b>.
        </p>
      )}

      <button type="button" onClick={() => setForm({})} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3.5 font-bold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600">
        <Plus className="h-5 w-5" /> Nouvo pwodwi
      </button>

      <label className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 focus-within:border-sky-400 dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-5 w-5 shrink-0 text-slate-400" />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chèche yon pwodwi" className="w-full bg-transparent focus:outline-none" />
      </label>
      <Chips options={FILTERS} value={filter} onChange={setFilter} label="Kategori" />

      {list.length === 0 ? (
        <Empty>{filter === "hidden" ? "Pa gen pwodwi ki kache." : "Pa gen pwodwi ki koresponn."}</Empty>
      ) : (
        <ul className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          {list.map((p) => {
            const count = (p.groups || []).reduce((n, g) => n + g.items.filter((i) => prices[i.id]?.available).length, 0);
            const from = minPrice(p, prices);
            const ex = p.exchange && exchange[p.id];
            return (
              <li key={p.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <button type="button" onClick={() => setOpenId(p.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <ProductArt product={p} className={`relative h-12 w-12 shrink-0 rounded-xl ${p.hidden ? "opacity-40" : ""}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-semibold text-slate-900 dark:text-white">{p.name}</span>
                      {p.hidden && <EyeOff className="h-4 w-4 shrink-0 text-slate-400" aria-label="Kache" />}
                    </span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      {p.category} · {p.exchange
                        ? ex?.available ? `1 ${ex.currency} = ${rateFormat.format(ex.rate)} HTG` : "Konvèsyon poko aktive"
                        : count ? `${count} pake · Dès ${formatPrice(from)}` : "Pa gen pri"}
                    </span>
                  </span>
                  {p.custom && <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">OU KREYE L</span>}
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="flex items-center gap-1.5 px-1 text-xs text-slate-400"><Eye className="h-3.5 w-3.5" /> Yon pwodwi kache pa parèt sou sit la, men ou ka remete l nenpòt lè.</p>

      {open && !form && (
        <ProductSheet product={open} prices={prices} exchange={exchange} hidden={hidden} nextSort={nextSort} onEdit={() => setForm({ product: open })} onClose={() => setOpenId(null)} onToast={onToast} />
      )}
      {form && (
        <ProductForm
          product={form.product}
          nextSort={nextProductSort}
          packageIds={(form.product?.groups || []).filter((g) => g.style === "offer").flatMap((g) => g.items.map((i) => i.id))}
          onClose={() => setForm(null)}
          onSaved={(id) => { setForm(null); setOpenId(id); }}
          onToast={onToast}
        />
      )}
    </div>
  );
}
