// Tout koneksyon ak Firebase (kont, Wallet, kòmand, notifikasyon) pase isit la.
// Règ sekirite ki pwoteje kòb la nan firebase/firestore.rules.
// Sit la chaje fichye sa a sèlman lè Firebase konfigire (gade backend.js).
import { initializeApp } from "firebase/app";
import {
  getAuth, connectAuthEmulator, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail, signOut, GoogleAuthProvider, signInWithPopup,
} from "firebase/auth";
import {
  getFirestore, connectFirestoreEmulator, doc, collection, query, where, orderBy, limit, onSnapshot,
  getDoc, getDocs, setDoc, addDoc, deleteDoc, runTransaction, writeBatch, updateDoc, increment, serverTimestamp, documentId,
} from "firebase/firestore";
import { UserError } from "./errors.js";
import { dayKey } from "./days.js";
import { quote } from "./exchange.js";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // san 0/O/1/I pou kliyan yo pa konfonn yo
const METHOD_NAMES = { moncash: "MonCash", natcash: "NatCash" };

function randomCode(length) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => CODE_CHARS[v % CODE_CHARS.length]).join("");
}

const formatHtg = (n) => `${new Intl.NumberFormat("fr-FR").format(n)} HTG`;

// Non ki parèt bay lòt kliyan lè yo voye kòb (non an, oswa debi imèl la)
function publicName(fullName, email) {
  return (fullName || "").trim().slice(0, 60) || `${(email || "").split("@")[0].slice(0, 2)}***`;
}

// Dokiman Firestore -> objè senp, ak dat yo an tèks ISO
function toPlain(snap) {
  const out = { id: snap.id };
  for (const [key, value] of Object.entries(snap.data({ serverTimestamps: "estimate" }))) {
    out[key] = value && typeof value.toDate === "function" ? value.toDate().toISOString() : value;
  }
  return out;
}

const newestFirst = (list) => list.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

const notification = (kind, title, body, ref) => ({
  kind, title, body: body ?? null, ref: ref ?? null, read_at: null, created_at: serverTimestamp(),
});

// Tit ak tèks yon mesaj admin, netwaye
function messageText(title, body) {
  const t = String(title || "").trim().slice(0, 120);
  if (!t) throw new UserError("Mete yon tit pou mesaj la.");
  return [t, String(body || "").trim().slice(0, 1000) || null];
}

const CATEGORY_NAMES = ["Jwèt", "Abònman", "Gift Card", "Finans"];

export function createBackend(config, options = {}) {
  const app = initializeApp(config, options.appName);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (options.emulatorHost) {
    connectAuthEmulator(auth, `http://${options.emulatorHost}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, options.emulatorHost, 8080);
  }

  const userRef = (uid) => doc(db, "users", uid);
  const newNotificationRef = (uid) => doc(collection(db, "users", uid, "notifications"));
  const currentUid = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new UserError("Konekte anvan ou kontinye.");
    return uid;
  };
  let signupInFlight = null;

  // Kreye pwofil kliyan an (ak AWENS-ID li) premye fwa li konekte
  async function ensureProfile(user, fullName) {
    const ref = userRef(user.uid);
    if ((await getDoc(ref)).exists()) return;
    const name = (fullName ?? user.displayName ?? "").trim().slice(0, 60) || null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode(8);
      const codeRef = doc(db, "walletCodes", code);
      const result = await runTransaction(db, async (tx) => {
        if ((await tx.get(ref)).exists()) return "exists";
        if ((await tx.get(codeRef)).exists()) return "taken"; // kòd la pran deja: eseye yon lòt
        tx.set(ref, {
          email: user.email, full_name: name, wallet_code: code, balance: 0, total_spent: 0, is_admin: false,
          created_at: serverTimestamp(), last_op: null, last_credit: null, last_admin_op: null,
        });
        tx.set(codeRef, { uid: user.uid, name: publicName(name, user.email) });
        tx.set(newNotificationRef(user.uid), notification("info", "Byenvini sou Awens Topup 🎉",
          "Ajoute kòb nan Wallet ou ak MonCash oswa NatCash, epi achte an kèk segonn."));
        return "created";
      });
      // Kont Google: foto kont lan vin foto pwofil la
      if (result === "created" && user.photoURL) await updateDoc(ref, { photo: user.photoURL }).catch(() => {});
      if (result !== "taken") return;
    }
    throw new UserError("Nou pa rive kreye kont ou. Eseye ankò.");
  }

  return {
    /* ---------- Kont ---------- */
    onAuth(callback) {
      return onAuthStateChanged(auth, async (user) => {
        if (user) {
          if (signupInFlight) await signupInFlight.catch(() => {});
          try {
            await ensureProfile(user);
          } catch (error) {
            console.error("ensureProfile", error);
          }
        }
        callback(user ? { id: user.uid, email: user.email, photoURL: user.photoURL || null } : null);
      });
    },

    signIn: (email, password) => signInWithEmailAndPassword(auth, email.trim(), password),

    async signUp(name, email, password) {
      signupInFlight = (async () => {
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(user, { displayName: name.trim() });
        await ensureProfile(user, name);
      })();
      try {
        await signupInFlight;
      } finally {
        signupInFlight = null;
      }
    },

    resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),

    // Non ak foto pwofil kliyan an (foto a deja redimansyone an yon ti imaj)
    async saveProfile({ fullName, photo }) {
      const uid = currentUid();
      const changes = {};
      if (fullName !== undefined) changes.full_name = String(fullName).trim().slice(0, 60) || null;
      if (photo !== undefined) changes.photo = photo || null;
      if (changes.photo && changes.photo.length > 60000) throw new UserError("Foto a twò lou. Chwazi yon lòt.");
      await updateDoc(userRef(uid), changes);
    },
    googleSignIn() {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      return signInWithPopup(auth, provider);
    },
    signOut: () => signOut(auth),

    /* ---------- Katalòg ak vizit (tout moun) ---------- */
    // Tout pake yo: pri, disponiblite, ak pake admin nan ajoute sou yon pwodwi (product_id)
    subscribePrices(callback) {
      return onSnapshot(collection(db, "packages"), (snap) => {
        callback(Object.fromEntries(snap.docs.map((d) => [d.id, toPlain(d)])));
      }, (error) => console.error("packages", error));
    },

    // Pwodwi admin nan kreye, lis pwodwi ki kache yo, ak to/frè konvèsyon pwodwi Finans yo
    subscribeCatalog(callback) {
      let products = [];
      let hidden = [];
      let exchange = {};
      // Nou voye katalòg la sèlman lè 3 pati yo rive (pou yon pwodwi kache pa parèt yon ti moman),
      // epi `ready` di to yo fin chaje (pou paj Finans yo pa di "pa disponib" pandan chajman an)
      const arrived = new Set();
      const emit = (part) => {
        arrived.add(part);
        if (arrived.size === 3) callback({ products, hidden, exchange, ready: true });
      };
      const failed = (part) => (error) => {
        console.error(part, error);
        emit(part);
      };
      const stops = [
        onSnapshot(collection(db, "products"), (snap) => {
          products = snap.docs.map(toPlain).sort((a, b) => a.sort - b.sort);
          emit("products");
        }, failed("products")),
        onSnapshot(doc(db, "settings", "catalog"), (snap) => {
          hidden = snap.data()?.hidden || [];
          emit("catalog");
        }, failed("catalog")),
        onSnapshot(collection(db, "exchange"), (snap) => {
          exchange = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
          emit("exchange");
        }, failed("exchange")),
      ];
      return () => stops.forEach((stop) => stop());
    },

    // Mesaj admin nan voye bay tout moun (premye lis la pa konte kòm "nouvo")
    subscribeAnnouncements(callback) {
      let first = true;
      return onSnapshot(query(collection(db, "announcements"), orderBy("created_at", "desc"), limit(10)), (snap) => {
        const added = first ? [] : snap.docChanges().filter((c) => c.type === "added").map((c) => toPlain(c.doc));
        first = false;
        callback(snap.docs.map(toPlain), added);
      }, (error) => console.error("announcements", error));
    },

    // Konte vizitè a yon sèl fwa pa jou (navigatè sa a)
    async trackVisit() {
      const day = dayKey(Date.now());
      try {
        if (localStorage.getItem("aswer-visit") === day) return;
      } catch {}
      await setDoc(doc(db, "visits", day), { count: increment(1) }, { merge: true });
      try {
        localStorage.setItem("aswer-visit", day);
      } catch {}
    },

    /* ---------- Done kliyan an, an dirèk ---------- */

    subscribeAccount(uid, handlers) {
      const report = (name) => (error) => console.error(name, error);
      const unsubscribers = [];
      unsubscribers.push(onSnapshot(userRef(uid), (snap) => {
        if (snap.exists()) handlers.onProfile(toPlain(snap));
      }, report("profile")));
      unsubscribers.push(onSnapshot(query(collection(db, "orders"), where("user_id", "==", uid)), (snap) => {
        handlers.onOrders(newestFirst(snap.docs.map(toPlain)));
      }, report("orders")));
      unsubscribers.push(onSnapshot(query(collection(db, "deposits"), where("user_id", "==", uid)), (snap) => {
        handlers.onDeposits(newestFirst(snap.docs.map(toPlain)));
      }, report("deposits")));

      // Transfè voye ak transfè resevwa se de rechèch apa
      let sent = [];
      let received = [];
      const emitTransfers = () => handlers.onTransfers(newestFirst([...sent, ...received]));
      unsubscribers.push(onSnapshot(query(collection(db, "transfers"), where("from_user", "==", uid)), (snap) => {
        sent = snap.docs.map(toPlain);
        emitTransfers();
      }, report("transfers sent")));
      unsubscribers.push(onSnapshot(query(collection(db, "transfers"), where("to_user", "==", uid)), (snap) => {
        received = snap.docs.map(toPlain);
        emitTransfers();
      }, report("transfers received")));

      // Premye lis la pa konte kòm "nouvo": sèlman sa ki rive apre
      let first = true;
      unsubscribers.push(onSnapshot(
        query(collection(db, "users", uid, "notifications"), orderBy("created_at", "desc"), limit(50)),
        (snap) => {
          const added = first ? [] : snap.docChanges().filter((c) => c.type === "added").map((c) => toPlain(c.doc));
          first = false;
          handlers.onNotifications(snap.docs.map(toPlain), added);
        },
        report("notifications"),
      ));
      return () => unsubscribers.forEach((stop) => stop());
    },

    async markNotificationsRead(ids) {
      if (ids.length === 0) return;
      const uid = currentUid();
      const batch = writeBatch(db);
      ids.slice(0, 450).forEach((id) => batch.update(doc(db, "users", uid, "notifications", id), { read_at: serverTimestamp() }));
      await batch.commit();
    },

    /* ---------- Aksyon kliyan yo ---------- */
    async placeOrder(packageId, playerId) {
      const uid = currentUid();
      const pid = String(playerId || "").trim() || null;
      if (pid && !/^\d{6,15}$/.test(pid)) throw new UserError("Player ID a dwe gen ant 6 ak 15 chif.");
      const orderRef = doc(collection(db, "orders"));
      const code = `AS-${randomCode(6)}`;
      return runTransaction(db, async (tx) => {
        const pkgSnap = await tx.get(doc(db, "packages", packageId));
        const pkg = pkgSnap.data();
        if (!pkgSnap.exists() || !pkg.available) throw new UserError("Pake sa a pa disponib.");
        if (pkg.needs_id && !pid) throw new UserError("Mete Player ID ou pou pake sa a.");
        const me = (await tx.get(userRef(uid))).data();
        if (!me) throw new UserError("Konekte anvan ou achte.");
        if (me.balance < pkg.price) throw new UserError("Solde ou pa ase. Ajoute kòb nan Wallet ou.");

        const order = {
          code, user_id: uid, package_id: packageId, product_name: pkg.product_name, package_label: pkg.label,
          price: pkg.price, player_id: pid, status: "pending", delivery_code: null, admin_note: null,
          created_at: serverTimestamp(), updated_at: serverTimestamp(),
        };
        tx.update(userRef(uid), {
          balance: me.balance - pkg.price, total_spent: me.total_spent + pkg.price, last_op: { kind: "order", id: orderRef.id },
        });
        tx.set(orderRef, order);
        tx.set(newNotificationRef(uid), notification("order", `Kòmand ${code} resevwa`,
          `${pkg.product_name} · ${pkg.label} (${formatHtg(pkg.price)}). N ap trete l kounye a.`, code));
        return { ...order, id: orderRef.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      });
    },

    // Kliyan an peye dirèkteman ak MonCash/NatCash: kòmand lan tann admin nan konfime peman an
    // (solde Wallet la pa chanje). Nimewo tranzaksyon an ka sèvi yon sèl fwa.
    async placeDirectOrder(packageId, playerId, { method, reference, senderPhone }) {
      const uid = currentUid();
      const pid = String(playerId || "").trim() || null;
      if (pid && !/^\d{6,15}$/.test(pid)) throw new UserError("Player ID a dwe gen ant 6 ak 15 chif.");
      if (!METHOD_NAMES[method]) throw new UserError("Chwazi MonCash oswa NatCash.");
      const ref = String(reference || "").toUpperCase().replace(/\s+/g, "");
      if (!/^[A-Z0-9-]{4,40}$/.test(ref)) throw new UserError("Mete ID tranzaksyon an (sèlman lèt ak chif, omwen 4).");
      const phone = String(senderPhone || "").trim().slice(0, 20) || null;
      const refDoc = doc(db, "depositRefs", `${method}_${ref}`);
      const orderRef = doc(collection(db, "orders"));
      const code = `AS-${randomCode(6)}`;
      return runTransaction(db, async (tx) => {
        const pkgSnap = await tx.get(doc(db, "packages", packageId));
        const pkg = pkgSnap.data();
        if (!pkgSnap.exists() || !pkg.available) throw new UserError("Pake sa a pa disponib.");
        if (pkg.needs_id && !pid) throw new UserError("Mete Player ID ou pou pake sa a.");
        if ((await tx.get(refDoc)).exists()) throw new UserError("Nimewo tranzaksyon sa a deja itilize.");

        const payment = { method, reference: ref, sender_phone: phone };
        const order = {
          code, user_id: uid, package_id: packageId, product_name: pkg.product_name, package_label: pkg.label,
          price: pkg.price, player_id: pid, status: "unpaid", delivery_code: null, admin_note: null,
          created_at: serverTimestamp(), updated_at: serverTimestamp(), payment,
        };
        tx.set(orderRef, order);
        tx.set(refDoc, { order_id: orderRef.id, user_id: uid });
        tx.set(newNotificationRef(uid), notification("order", `Kòmand ${code} resevwa`,
          `${pkg.product_name} · ${pkg.label} (${formatHtg(pkg.price)}). N ap verifye peman ${METHOD_NAMES[method]} ou a (${ref}).`, code));
        return { ...order, id: orderRef.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      });
    },

    // Konvèsyon (Meru, PayPal…): règ yo verifye frè a ak pri a menm jan ak exchange.js
    async placeExchangeOrder(productId, amount, recipient) {
      const uid = currentUid();
      const value = Number(amount);
      const account = String(recipient?.account || "").trim().slice(0, 120);
      const name = String(recipient?.name || "").trim().slice(0, 80);
      if (account.length < 3) throw new UserError("Mete kont kote pou n voye kòb la.");
      if (name.length < 2) throw new UserError("Mete non ki sou kont lan.");
      const orderRef = doc(collection(db, "orders"));
      const code = `AS-${randomCode(6)}`;
      return runTransaction(db, async (tx) => {
        const exSnap = await tx.get(doc(db, "exchange", productId));
        const ex = exSnap.data();
        if (!exSnap.exists() || !ex.available) throw new UserError("Sèvis sa a pa disponib kounye a.");
        if (!Number.isInteger(value) || value < ex.min || value > ex.max) {
          throw new UserError(`Montan an dwe yon chif san vigil ant ${ex.min} ak ${ex.max} ${ex.currency}.`);
        }
        const q = quote(ex, value);
        const me = (await tx.get(userRef(uid))).data();
        if (!me) throw new UserError("Konekte anvan ou achte.");
        if (me.balance < q.price) throw new UserError("Solde ou pa ase. Ajoute kòb nan Wallet ou.");

        const label = `${value} ${ex.currency}`;
        const order = {
          code, user_id: uid, package_id: productId, product_name: ex.product_name, package_label: label,
          price: q.price, player_id: null, status: "pending", delivery_code: null, admin_note: null,
          created_at: serverTimestamp(), updated_at: serverTimestamp(),
          kind: "exchange", amount: value, fee: q.fee, tier: q.tier, rate: ex.rate, currency: ex.currency,
          recipient: { account, name },
        };
        tx.update(userRef(uid), {
          balance: me.balance - q.price, total_spent: me.total_spent + q.price, last_op: { kind: "order", id: orderRef.id },
        });
        tx.set(orderRef, order);
        tx.set(newNotificationRef(uid), notification("order", `Kòmand ${code} resevwa`,
          `${ex.product_name} · ${label} (${formatHtg(q.price)}). N ap voye l sou ${account}.`, code));
        return { ...order, id: orderRef.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      });
    },

    async requestDeposit({ amount, method, reference, senderPhone }) {
      const uid = currentUid();
      const value = Number(amount);
      if (!Number.isInteger(value)) throw new UserError("Mete montan an san vigil (egzanp 1000).");
      if (value < 50 || value > 100000) throw new UserError("Montan an dwe ant 50 ak 100 000 HTG.");
      if (!METHOD_NAMES[method]) throw new UserError("Mòd peman sa a pa egziste.");
      const ref = String(reference || "").toUpperCase().replace(/\s+/g, "");
      if (!/^[A-Z0-9-]{4,40}$/.test(ref)) throw new UserError("Mete ID tranzaksyon an (sèlman lèt ak chif, omwen 4).");
      const phone = String(senderPhone || "").trim().slice(0, 20) || null;

      const refDoc = doc(db, "depositRefs", `${method}_${ref}`);
      if ((await getDoc(refDoc)).exists()) throw new UserError("Nimewo tranzaksyon sa a deja itilize.");
      const depositRef = doc(collection(db, "deposits"));
      const deposit = {
        user_id: uid, amount: value, method, reference: ref, sender_phone: phone, status: "pending", admin_note: null,
        created_at: serverTimestamp(), updated_at: serverTimestamp(),
      };
      const batch = writeBatch(db);
      batch.set(depositRef, deposit);
      batch.set(refDoc, { deposit_id: depositRef.id, user_id: uid });
      batch.set(newNotificationRef(uid), notification("deposit", `Depo ${formatHtg(value)} an atant`,
        `N ap verifye peman ${METHOD_NAMES[method]} ou a (${ref}).`, depositRef.id));
      await batch.commit();
      return { ...deposit, id: depositRef.id };
    },

    async lookupWallet(code) {
      const snap = await getDoc(doc(db, "walletCodes", String(code).toUpperCase()));
      return snap.exists() ? snap.data().name : null;
    },

    async transferFunds(code, amount) {
      const uid = currentUid();
      const value = Number(amount);
      if (!Number.isInteger(value)) throw new UserError("Mete montan an san vigil (egzanp 500).");
      if (value < 10) throw new UserError("Montan minimòm lan se 10 HTG.");
      const toCode = String(code).toUpperCase();
      const codeSnap = await getDoc(doc(db, "walletCodes", toCode));
      if (!codeSnap.exists()) throw new UserError("Nou pa jwenn AWENS-ID sa a.");
      const { uid: to, name: toName } = codeSnap.data();
      if (to === uid) throw new UserError("Ou pa ka voye kòb ba tèt ou.");

      const transferRef = doc(collection(db, "transfers"));
      return runTransaction(db, async (tx) => {
        const me = (await tx.get(userRef(uid))).data();
        if (me.balance < value) throw new UserError("Solde ou pa ase.");
        const myName = publicName(me.full_name, me.email);
        tx.update(userRef(uid), { balance: me.balance - value, last_op: { kind: "transfer", id: transferRef.id } });
        tx.update(userRef(to), { balance: increment(value), last_credit: transferRef.id });
        tx.set(transferRef, { from_user: uid, to_user: to, from_code: me.wallet_code, to_code: toCode, amount: value, created_at: serverTimestamp() });
        tx.set(newNotificationRef(uid), notification("transfer", `Ou voye ${formatHtg(value)}`, `Bay ${toName} (${toCode}).`, transferRef.id));
        tx.set(newNotificationRef(to), notification("transfer", `Ou resevwa ${formatHtg(value)}`, `Soti nan ${myName} (${me.wallet_code}).`, transferRef.id));
        return { id: transferRef.id, amount: value, to_code: toCode, to_name: toName };
      });
    },

    /* ---------- Admin ---------- */
    // Kòmand 31 dènye jou yo (pou estatistik yo) + tout kòmand ki poko fini, nenpòt ki dat
    subscribeAdmin(handlers) {
      const report = (name) => (error) => console.error(name, error);
      const since = new Date(Date.now() - 31 * 86400000);
      const RECENT_LIMIT = 3000;
      let recentOrders = [];
      let openOrders = [];
      const emitOrders = () => {
        const byId = new Map([...openOrders, ...recentOrders].map((o) => [o.id, o]));
        // 2yèm valè a: kote istwa an dirèk la kòmanse (adminOlderOrders kontinye anvan dat sa a)
        const full = recentOrders.length >= RECENT_LIMIT;
        handlers.onOrders(newestFirst([...byId.values()]), full ? recentOrders.at(-1).created_at : since.toISOString());
      };
      const unsubscribers = [
        onSnapshot(query(collection(db, "orders"), where("created_at", ">=", since), orderBy("created_at", "desc"), limit(RECENT_LIMIT)), (s) => {
          recentOrders = s.docs.map(toPlain);
          emitOrders();
        }, report("admin orders")),
        onSnapshot(query(collection(db, "orders"), where("status", "in", ["unpaid", "pending", "processing"])), (s) => {
          openOrders = s.docs.map(toPlain);
          emitOrders();
        }, report("admin open orders")),
        onSnapshot(query(collection(db, "deposits"), orderBy("created_at", "desc"), limit(300)), (s) => handlers.onDeposits(s.docs.map(toPlain)), report("admin deposits")),
        onSnapshot(query(collection(db, "users"), limit(3000)), (s) => {
          handlers.onProfiles(Object.fromEntries(s.docs.map((d) => [d.id, toPlain(d)])));
        }, report("admin users")),
        onSnapshot(query(collection(db, "visits"), where(documentId(), ">=", dayKey(since))), (s) => {
          handlers.onVisits?.(Object.fromEntries(s.docs.map((d) => [d.id, d.data().count])));
        }, report("admin visits")),
        onSnapshot(query(collection(db, "announcements"), orderBy("created_at", "desc"), limit(30)), (s) => {
          handlers.onAnnouncements?.(s.docs.map(toPlain));
        }, report("admin announcements")),
      ];
      return () => unsubscribers.forEach((stop) => stop());
    },

    // Kòmand ki pi ansyen pase sa ki deja chaje yo: tout istwa a, 100 pa 100
    async adminOlderOrders(before, size = 100) {
      const snap = await getDocs(query(collection(db, "orders"), where("created_at", "<", new Date(before)), orderBy("created_at", "desc"), limit(size)));
      return snap.docs.map(toPlain);
    },

    // `supplier`: estati livrezon otomatik la (FazerCards), ekri nan menm operasyon an
    async adminUpdateOrder(order, status, deliveryCode, note, supplier) {
      if (order.status === "refused") throw new UserError("Kòmand sa a deja refize e ranbouse.");
      if (order.status === "unpaid" && status !== "refused") throw new UserError("Konfime peman an anvan.");
      const unpaid = order.status === "unpaid";
      const changes = { status, updated_at: serverTimestamp() };
      if (supplier) changes.supplier = { ...supplier, at: serverTimestamp() };
      if (deliveryCode?.trim()) changes.delivery_code = deliveryCode.trim().slice(0, 200);
      if (note?.trim()) changes.admin_note = note.trim().slice(0, 300);

      const batch = writeBatch(db);
      batch.update(doc(db, "orders", order.id), changes);
      // Peman dirèk ki pa rive: pa gen anyen pou ranbouse
      if (status === "refused" && !unpaid) {
        batch.update(userRef(order.user_id), {
          balance: increment(order.price), total_spent: increment(-order.price), last_admin_op: { kind: "refund", id: order.id },
        });
      }
      if (status !== order.status) {
        const what = `${order.product_name} · ${order.package_label}`;
        const text = {
          processing: [`Kòmand ${order.code} an kou`, `N ap trete ${what}.`],
          delivered: [`Kòmand ${order.code} livre ✅`, `${what}${changes.delivery_code || order.delivery_code ? ". Kòd ou a nan Historique." : " sou kont ou."}`],
          refused: [`Kòmand ${order.code} refize`, `${unpaid ? `Nou pa jwenn peman ${METHOD_NAMES[order.payment?.method] || ""} ou a.` : `${formatHtg(order.price)} retounen nan Wallet ou.`}${changes.admin_note ? ` ${changes.admin_note}` : ""}`],
        }[status];
        if (text) batch.set(newNotificationRef(order.user_id), notification("order", text[0], text[1], order.code));
      }
      await batch.commit();
    },

    // Admin nan resevwa peman dirèk la: kòmand lan vin "pending" (pare pou FazerCards oswa pou livre)
    async adminConfirmPayment(order) {
      if (order.status !== "unpaid") throw new UserError("Peman kòmand sa a deja trete.");
      const batch = writeBatch(db);
      batch.update(doc(db, "orders", order.id), { status: "pending", updated_at: serverTimestamp() });
      batch.update(userRef(order.user_id), { total_spent: increment(order.price), last_admin_op: { kind: "paid", id: order.id } });
      batch.set(newNotificationRef(order.user_id), notification("order", `Peman ${order.code} resevwa ✅`,
        `${order.product_name} · ${order.package_label}. N ap livre l kounye a.`, order.code));
      await batch.commit();
    },

    /* ---------- Livrezon otomatik (FazerCards) ---------- */
    // Kle koneksyon kliyan an, pou fonksyon sèvè yo (/api/…) konnen ki moun k ap rele yo
    getIdToken: () => auth.currentUser?.getIdToken() ?? Promise.resolve(null),

    // Mande sèvè a voye kòmand lan bay FazerCards (si pake a otomatik). Pa janm bloke kliyan an.
    async requestAutoDelivery(orderId) {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return null;
        const res = await fetch("/api/fulfill", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId }),
        });
        return res.ok ? await res.json() : null;
      } catch {
        return null;
      }
    },

    // Panneau admin → FazerCards (balans, katalòg, webhook, eseye ankò)
    async adminFazer(action, params = {}) {
      const token = await auth.currentUser?.getIdToken();
      let res;
      try {
        res = await fetch("/api/fazer", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action, ...params }),
        });
      } catch {
        throw new UserError("Pa gen koneksyon ak sèvè a. Eseye ankò.");
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new UserError(data?.error || `Sèvè a pa reponn (HTTP ${res.status}).`);
      return data;
    },

    subscribeSupplierMap(callback) {
      return onSnapshot(collection(db, "supplierMap"), (snap) => {
        callback(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()])));
      }, (error) => console.error("supplierMap", error));
    },

    adminSetSupplierMap: (packageId, data) => setDoc(doc(db, "supplierMap", packageId), {
      provider: "fazercards", category_id: data.category_id, category_name: data.category_name || null,
      offer_id: data.offer_id, offer_name: data.offer_name || null, price_usd: data.price_usd ?? null,
      field_key: data.field_key || null, auto: Boolean(data.auto),
    }),

    adminDeleteSupplierMap: (packageId) => deleteDoc(doc(db, "supplierMap", packageId)),

    // Pou fonksyon sèvè yo (bot admin nan)
    async adminIsAdmin(uid) {
      const snap = await getDoc(userRef(uid));
      return snap.exists() && snap.data().is_admin === true;
    },

    async adminGetOrder(id) {
      const snap = await getDoc(doc(db, "orders", id));
      return snap.exists() ? toPlain(snap) : null;
    },

    async adminGetSupplierMap(packageId) {
      const snap = await getDoc(doc(db, "supplierMap", packageId));
      return snap.exists() ? snap.data() : null;
    },

    async adminFindOrderBySupplier(supplierOrderId) {
      const snap = await getDocs(query(collection(db, "orders"), where("supplier.order_id", "==", supplierOrderId), limit(1)));
      return snap.empty ? null : toPlain(snap.docs[0]);
    },

    // Make kòmand lan "ap voye" yon sèl fwa, menm si de demand rive an menm tan.
    // Retounen kòmand lan si se nou ki pran l, oswa null si yon lòt demand deja la.
    async adminClaimSupplier(orderId) {
      const ref = doc(db, "orders", orderId);
      return runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return null;
        const order = toPlain(snap);
        if (order.status !== "pending" || (order.supplier && order.supplier.status !== "error")) return null;
        tx.update(ref, { supplier: { provider: "fazercards", status: "sending", at: serverTimestamp() }, updated_at: serverTimestamp() });
        return order;
      });
    },

    adminSetSupplier: (orderId, supplier) => updateDoc(doc(db, "orders", orderId), {
      supplier: { ...supplier, at: serverTimestamp() }, updated_at: serverTimestamp(),
    }),

    async adminReviewDeposit(deposit, approve, note) {
      if (deposit.status !== "pending") throw new UserError("Depo sa a deja trete.");
      const cleanNote = note?.trim().slice(0, 300) || null;
      const batch = writeBatch(db);
      batch.update(doc(db, "deposits", deposit.id), { status: approve ? "completed" : "refused", admin_note: cleanNote, updated_at: serverTimestamp() });
      if (approve) {
        batch.update(userRef(deposit.user_id), { balance: increment(deposit.amount), last_admin_op: { kind: "deposit", id: deposit.id } });
      }
      batch.set(newNotificationRef(deposit.user_id), approve
        ? notification("deposit", `Depo ${formatHtg(deposit.amount)} konfime ✅`, "Kòb la nan Wallet ou kounye a.", deposit.id)
        : notification("deposit", `Depo ${formatHtg(deposit.amount)} refize`, cleanNote || "Nou pa jwenn peman sa a. Kontakte nou sou WhatsApp.", deposit.id));
      await batch.commit();
    },

    async adminSetPackage(id, price, available) {
      const value = Number(price);
      if (!Number.isInteger(value) || value <= 0) throw new UserError("Pri a dwe yon chif san vigil, pi gran pase 0.");
      await updateDoc(doc(db, "packages", id), { price: value, available });
    },

    // Mete pake ki nan data.js men ki poko nan baz done a
    async adminAddPackages(list) {
      const batch = writeBatch(db);
      list.forEach((p) => batch.set(doc(db, "packages", p.id), {
        product_name: p.product_name, label: p.label, price: p.price, needs_id: p.needs_id, available: true, sort: p.sort,
      }));
      await batch.commit();
    },

    // Nouvo pake sou yon pwodwi (pa egzanp yon nouvo kantite dyaman, oswa "Netflix 1 mwa")
    async adminAddPackage({ productId, productName, group, label, price, needsId, sort }) {
      const value = Number(price);
      const name = String(label || "").trim().slice(0, 60);
      if (!name) throw new UserError("Mete non pake a.");
      if (!Number.isInteger(value) || value <= 0) throw new UserError("Pri a dwe yon chif san vigil, pi gran pase 0.");
      await addDoc(collection(db, "packages"), {
        product_id: productId, product_name: productName, group: String(group || "").trim().slice(0, 40) || "Offres",
        label: name, price: value, needs_id: Boolean(needsId), available: true, sort,
      });
    },

    adminDeletePackage: (id) => deleteDoc(doc(db, "packages", id)),

    // To, limit ak frè palye yon pwodwi Finans
    async adminSetExchange(productId, { productName, currency, rate, min, max, tiers, available }) {
      const r = Number(rate);
      if (!(r > 0)) throw new UserError("To a dwe yon chif pi gran pase 0 (egzanp 145).");
      const lo = Number(min);
      const hi = Number(max);
      if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < 1 || hi < lo) throw new UserError("Minimòm ak maksimòm yo dwe chif san vigil, minimòm ≤ maksimòm.");
      const clean = tiers.map((t) => ({ max: Number(t.max), fee: Number(t.fee) }));
      if (clean.length === 0 || clean.some((t) => !Number.isInteger(t.max) || !Number.isInteger(t.fee) || t.max < 1 || t.fee < 0)) {
        throw new UserError("Chak palye bezwen yon montan maksimòm ak yon frè (chif san vigil).");
      }
      clean.sort((a, b) => a.max - b.max);
      if (clean.some((t, i) => i > 0 && t.max === clean[i - 1].max)) throw new UserError("De palye pa ka gen menm maksimòm.");
      await setDoc(doc(db, "exchange", productId), {
        product_name: productName, currency: String(currency).trim().toUpperCase().slice(0, 10), rate: r,
        min: lo, max: hi, tiers: clean, available: Boolean(available),
      });
    },

    // Kreye oswa modifye yon pwodwi. Si non an chanje, pake li yo pran nouvo non an tou.
    async adminSaveProduct(product, packageIds = []) {
      const name = String(product.name || "").trim().slice(0, 60);
      if (name.length < 2) throw new UserError("Mete non pwodwi a.");
      if (!CATEGORY_NAMES.includes(product.category)) throw new UserError("Chwazi yon kategori.");
      const data = {
        name, category: product.category, image: product.image || null,
        is_new: Boolean(product.is_new), player_id: Boolean(product.player_id), sort: Number(product.sort) || 0,
      };
      if (data.image && data.image.length > 350000) throw new UserError("Foto a twò lou. Chwazi yon lòt.");
      if (!product.id) {
        const ref = await addDoc(collection(db, "products"), { ...data, created_at: serverTimestamp() });
        return ref.id;
      }
      const batch = writeBatch(db);
      batch.update(doc(db, "products", product.id), data);
      packageIds.forEach((id) => batch.update(doc(db, "packages", id), { product_name: name }));
      await batch.commit();
      return product.id;
    },

    async adminDeleteProduct(id, packageIds = []) {
      const batch = writeBatch(db);
      batch.delete(doc(db, "products", id));
      packageIds.forEach((pid) => batch.delete(doc(db, "packages", pid)));
      await batch.commit();
    },

    // Pwodwi ki pa parèt sou sit la (ni sa ki nan data.js, ni sa admin nan kreye)
    adminSetHidden: (hidden) => setDoc(doc(db, "settings", "catalog"), { hidden: [...new Set(hidden)] }),

    /* ---------- Mesaj ---------- */
    async adminSendMessage(uid, title, body) {
      const [t, b] = messageText(title, body);
      await setDoc(newNotificationRef(uid), notification("message", t, b));
    },

    async adminBroadcast(title, body) {
      const [t, b] = messageText(title, body);
      await addDoc(collection(db, "announcements"), { title: t, body: b, by: currentUid(), created_at: serverTimestamp() });
    },

    adminDeleteAnnouncement: (id) => deleteDoc(doc(db, "announcements", id)),

    /* ---------- Ekip la ---------- */
    // Sèlman pwopriyetè a (admin san admin_by) ka fè sa; règ yo verifye l
    async adminSetAdmin(uid, makeAdmin) {
      const me = currentUid();
      if (uid === me) throw new UserError("Ou pa ka chanje pwòp wòl ou.");
      const batch = writeBatch(db);
      batch.update(userRef(uid), makeAdmin ? { is_admin: true, admin_by: me } : { is_admin: false, admin_by: null });
      if (makeAdmin) {
        batch.set(newNotificationRef(uid), notification("info", "Ou se admin sou Awens Topup",
          "Ou ka jere kòmand yo, depo yo, pwodwi yo ak kliyan yo nan Profil → Panneau admin."));
      }
      await batch.commit();
    },
  };
}
