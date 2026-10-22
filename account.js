import { useCallback, useEffect, useRef, useState } from "react";
import { backend } from "./backend.js";

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
  const [prices, setPrices] = useState({});
  const [epoch, setEpoch] = useState(0); // chanje l pou rekòmanse koute done yo (bouton 🔄)
  const subscribedUser = useRef(null);
  const notifyRef = useRef(onNotification);
  notifyRef.current = onNotification;
  const userId = user?.id;

  // Pri yo piblik: menm moun ki pa konekte wè yo
  useEffect(() => backend?.subscribePrices(setPrices), []);

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

  const reload = useCallback(async () => {
    setEpoch((e) => e + 1);
    await new Promise((resolve) => setTimeout(resolve, 600));
  }, []);

  const markRead = useCallback(async () => {
    const ids = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (!backend || ids.length === 0) return;
    try {
      await backend.markNotificationsRead(ids);
    } catch (error) {
      console.error("markRead", error);
    }
  }, [notifications]);

  const signOut = useCallback(() => backend?.signOut(), []);

  // Done yo valab sèlman si yo pou kliyan ki konekte kounye a (pa gen yon randu kote
  // pwofil la toujou la men kliyan an fin dekonekte)
  const mine = Boolean(user && profile && profile.id === user.id);
  return {
    enabled: Boolean(backend),
    ready,
    user,
    profile: mine ? profile : null,
    orders: mine ? orders : [],
    deposits: mine ? deposits : [],
    transfers: mine ? transfers : [],
    notifications: mine ? notifications : [],
    unread: mine ? notifications.filter((n) => !n.read_at).length : 0,
    prices,
    reload,
    markRead,
    signOut,
  };
}
