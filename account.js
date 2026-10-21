import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase.js";

// Tout done kont kliyan an (pwofil, kòmand, depo, transfè, notifikasyon),
// ak mizajou an dirèk lè yon bagay chanje nan baz done a.
export function useAccount(onNotification) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!supabase);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [prices, setPrices] = useState({});
  const [recovery, setRecovery] = useState(false); // kliyan an sot peze lyen "modpas bliye" a
  const notifyRef = useRef(onNotification);
  notifyRef.current = onNotification;
  const userId = session?.user?.id;

  // Pri yo piblik: menm moun ki pa konekte wè yo
  useEffect(() => {
    if (!supabase) return;
    supabase.from("packages").select("id, price, available").then(({ data }) => {
      if (data) setPrices(Object.fromEntries(data.map((p) => [p.id, { price: Number(p.price), available: p.available }])));
    });
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const reload = useCallback(async () => {
    if (!supabase || !userId) return;
    const recent = (q) => q.order("created_at", { ascending: false }).limit(100);
    const [p, o, d, t, n] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      recent(supabase.from("orders").select("*").eq("user_id", userId)),
      recent(supabase.from("deposits").select("*").eq("user_id", userId)),
      recent(supabase.from("transfers").select("*").or(`from_user.eq.${userId},to_user.eq.${userId}`)),
      recent(supabase.from("notifications").select("*").eq("user_id", userId)),
    ]);
    if (p.data) setProfile(p.data);
    if (o.data) setOrders(o.data);
    if (d.data) setDeposits(d.data);
    if (t.data) setTransfers(t.data);
    if (n.data) setNotifications(n.data);
  }, [userId]);

  useEffect(() => {
    if (!supabase || !userId) {
      setProfile(null);
      setOrders([]);
      setDeposits([]);
      setTransfers([]);
      setNotifications([]);
      return;
    }
    reload();

    // Chak kòmand, depo oswa transfè ki chanje kreye yon notifikasyon:
    // lè youn rive, nou montre l epi nou rechaje rès done yo.
    const channel = supabase
      .channel(`account-${userId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` }, (payload) =>
        setProfile((old) => ({ ...old, ...payload.new }))
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        setNotifications((list) => (list.some((n) => n.id === payload.new.id) ? list : [payload.new, ...list]));
        notifyRef.current?.(payload.new);
        reload();
      })
      .subscribe();

    // Si telefòn nan te an veye, nou rechaje lè kliyan an tounen sou sit la
    const onVisible = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, reload]);

  const markRead = useCallback(async () => {
    if (!supabase || !notifications.some((n) => !n.read_at)) return;
    const now = new Date().toISOString();
    setNotifications((list) => list.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await supabase.rpc("mark_notifications_read");
  }, [notifications]);

  const signOut = useCallback(() => supabase?.auth.signOut(), []);

  return {
    enabled: Boolean(supabase),
    ready,
    user: session?.user || null,
    profile,
    orders,
    deposits,
    transfers,
    notifications,
    unread: notifications.filter((n) => !n.read_at).length,
    prices,
    recovery,
    endRecovery: () => setRecovery(false),
    reload,
    markRead,
    signOut,
  };
}
