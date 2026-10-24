import { useCallback, useEffect, useRef, useState } from "react";
import { backend } from "./backend.js";
import { setPaymentSettings } from "./payments.js";

// Dènye fwa vizitè a te louvri notifikasyon yo: mesaj pou tout moun ki pi nouvo yo "pa li"
const SEEN_KEY = "aswer-announcements-seen";
function loadSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) || "";
  } catch {
    return "";
  }
}

const MINUTE = 60000;
const DAY = 24 * 60 * MINUTE;
const SUPPLIER_DONE = ["completed", "failed", "refund"];

// Dènye pri ak katalòg nou te resevwa: boutik la parèt touswit nan pwochen vizit la,
// epi done an dirèk yo ranplase yo lè yo rive. Pri a toujou verifye sou sèvè a lè kliyan an achte.
const SHOP_KEY = "awens-shop-v1";
function loadShop() {
  try {
    const saved = JSON.parse(localStorage.getItem(SHOP_KEY));
    if (saved && typeof saved === "object") return saved;
  } catch {}
  return {};
}
function saveShop(part) {
  try {
    localStorage.setItem(SHOP_KEY, JSON.stringify({ ...loadShop(), ...part }));
  } catch {}
}
const savedShop = loadShop();
setPaymentSettings(savedShop.payments);

const asNotification = (a, seen) => ({
  ...a,
  id: `ann-${a.id}`,
  kind: "announcement",
  read_at: a.created_at <= seen ? a.created_at : null,
});

// Tout done kont kliyan an (pwofil, kòmand, depo, transfè, notifikasyon),
// ak mizajou an dirèk lè yon bagay chanje nan baz done a.
export function useAccount(onNotification) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!backend);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [prices, setPrices] = useState(() => savedShop.prices || {});
  // `ready` rete false jiskaske sèvè a reponn: to konvèsyon yo pa janm soti nan memwa a
  const [catalog, setCatalog] = useState(() => ({ products: [], hidden: [], exchange: {}, images: {}, ...savedShop.catalog, ready: false }));
  const [announcements, setAnnouncements] = useState([]);
  const [seen, setSeen] = useState(loadSeen);
  const [epoch, setEpoch] = useState(0); // chanje l pou rekòmanse koute done yo (bouton 🔄)
  const subscribedUser = useRef(null);
  const notifyRef = useRef(onNotification);
  notifyRef.current = onNotification;
  const userId = user?.id;

  // Pri yo, pwodwi yo ak mesaj pou tout moun yo piblik: menm moun ki pa konekte wè yo
  useEffect(() => backend?.subscribePrices((list) => {
    setPrices(list);
    saveShop({ prices: list });
  }), []);
  useEffect(() => backend?.subscribeCatalog((next) => {
    setCatalog(next);
    setPaymentSettings(next.payments);
    saveShop({ catalog: { products: next.products, hidden: next.hidden, images: next.images }, payments: next.payments });
  }), []);
  useEffect(() => backend?.subscribeAnnouncements((list, added) => {
    setAnnouncements(list);
    added.forEach((a) => notifyRef.current?.(asNotification(a, "")));
  }), []);

  useEffect(() => {
    if (!backend) return undefined;
    return backend.onAuth((u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    // Pa janm kite done yon ansyen kont parèt pandan nouvo a ap chaje
    // (bouton 🔄 la rekonekte san li pa efase sa ki sou ekran an)
    if (subscribedUser.current !== userId) {
      subscribedUser.current = userId;
      setProfile(null);
      setOrders([]);
      setDeposits([]);
      setTransfers([]);
      setNotifications([]);
    }
    if (!backend || !userId) return undefined;
    return backend.subscribeAccount(userId, {
      onProfile: setProfile,
      onOrders: setOrders,
      onDeposits: setDeposits,
      onTransfers: setTransfers,
      onNotifications: (list, added) => {
        setNotifications(list);
        added.forEach((n) => notifyRef.current?.(n));
      },
    });
  }, [userId, epoch]);

  // Kòmand ki peye ak Wallet men ki poko rive kote FazerCards (pa egzanp kliyan an te fèmen paj la
  // twò vit), oswa ki rete "an kou" twò lontan: sit la mande sèvè a voye l oswa verifye l ankò.
  // Sèvè a deside si pake a otomatik, epi li pa janm voye menm kòmand lan de fwa.
  const nudged = useRef(new Set());
  useEffect(() => {
    if (!backend || !userId) return;
    const now = Date.now();
    const age = (o) => now - Date.parse(o.updated_at || o.created_at);
    orders
      .filter((o) => {
        if (nudged.current.has(o.id) || o.kind === "exchange" || now - Date.parse(o.created_at) > 2 * DAY) return false;
        const s = o.supplier;
        if (o.status === "pending" && !s) return age(o) > MINUTE;
        return ["pending", "processing"].includes(o.status) && s?.order_id && !SUPPLIER_DONE.includes(s.status) && age(o) > 10 * MINUTE;
      })
      .slice(0, 5)
      .forEach((o) => {
        nudged.current.add(o.id);
        backend.requestAutoDelivery(o.id);
      });
  }, [orders, userId]);

  const reload = useCallback(async () => {
    setEpoch((e) => e + 1);
    await new Promise((resolve) => setTimeout(resolve, 600));
  }, []);

  // Done yo valab sèlman si yo pou kliyan ki konekte kounye a (pa gen yon randu kote
  // pwofil la toujou la men kliyan an fin dekonekte)
  const mine = Boolean(user && profile && profile.id === user.id);
  const feed = [...(mine ? notifications : []), ...announcements.map((a) => asNotification(a, seen))]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  const markRead = useCallback(async () => {
    const now = new Date().toISOString();
    setSeen(now);
    try {
      localStorage.setItem(SEEN_KEY, now);
    } catch {}
    const ids = mine ? notifications.filter((n) => !n.read_at).map((n) => n.id) : [];
    if (!backend || ids.length === 0) return;
    try {
      await backend.markNotificationsRead(ids);
    } catch (error) {
      console.error("markRead", error);
    }
  }, [mine, notifications]);

  const signOut = useCallback(() => backend?.signOut(), []);

  return {
    enabled: Boolean(backend),
    ready,
    user,
    profile: mine ? profile : null,
    // Foto pwofil la, oswa foto kont Google la si kliyan an poko mete youn
    photo: mine ? profile.photo || user.photoURL || null : null,
    orders: mine ? orders : [],
    deposits: mine ? deposits : [],
    transfers: mine ? transfers : [],
    notifications: feed,
    unread: feed.filter((n) => !n.read_at).length,
    prices,
    catalog,
    reload,
    markRead,
    signOut,
  };
}
