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
  getCountFromServer,
} from "firebase/firestore";
import { UserError } from "./errors.js";
import { t } from "./i18n.js";
import { dayKey } from "./days.js";
import { quote } from "./exchange.js";
import { DEPOSIT_MAX, DEPOSIT_MIN, isPhoneNumber, normalizeReference } from "./depositCheck.js";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // san 0/O/1/I pou kliyan yo pa konfonn yo
const METHOD_NAMES = { moncash: "MonCash", natcash: "NatCash" };

function randomCode(length) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => CODE_CHARS[v % CODE_CHARS.length]).join("");
}

// Kòd pwomo: lèt ak chif sèlman, an majiskil
const normalizePromo = (code) => String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// Yon kòd pwomo ki ka sèvi kounye a, sinon yon erè pou kliyan an
function promoOrThrow(code, snap, used) {
  if (!/^[A-Z0-9]{3,20}$/.test(code) || !snap.exists()) throw new UserError(t("Kòd pwomo sa a pa egziste.", "Ce code promo n'existe pas."));
  const promo = snap.data();
  if (!promo.active) throw new UserError(t("Kòd pwomo sa a pa aktif ankò.", "Ce code promo n'est plus actif."));
  if (promo.expires_at && promo.expires_at.toMillis() <= Date.now()) throw new UserError(t("Kòd pwomo sa a ekspire.", "Ce code promo a expiré."));
  if (promo.max_uses && promo.uses >= promo.max_uses) throw new UserError(t("Kòd pwomo sa a fin itilize.", "Ce code promo est épuisé."));
  if (used.exists()) throw new UserError(t("Ou deja sèvi ak kòd pwomo sa a.", "Vous avez déjà utilisé ce code promo."));
  return promo;
}

const PHONE_NOT_REFERENCE = t("Sa se yon nimewo telefòn. Mete ID tranzaksyon ki nan SMS MonCash/NatCash la.", "C'est un numéro de téléphone. Entrez l'ID de transaction du SMS MonCash/NatCash.");

const formatHtg = (n) => `${new Intl.NumberFormat("fr-FR").format(n)} HTG`;

// Wòl admin yo: "full" (tout bagay) oswa "orders" (trete kòmand sèlman)
const ADMIN_ROLES = ["full", "orders"];
const roleText = (role) => role === "orders"
  ? "Ou ka trete kòmand yo (livrer, refize) epi wè kliyan yo nan Profil → Panneau admin."
  : "Ou ka jere kòmand yo, depo yo, pwodwi yo ak kliyan yo nan Profil → Panneau admin.";

// Sou yon rezo fèb (4G), premye demann koneksyon an ka echwe: nou eseye yon dezyèm fwa
// anvan nou di kliyan an pa gen entènèt
async function retryOnNetwork(run) {
  try {
    return await run();
  } catch (error) {
    if (error?.code !== "auth/network-request-failed") throw error;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return run();
  }
}

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
    if (!uid) throw new UserError(t("Konekte anvan ou kontinye.", "Connectez-vous pour continuer."));
    return uid;
  };
  let signupInFlight = null;

  // Rele yon fonksyon sèvè (Vercel) kòm kliyan konekte a; null si l pa reponn
  async function postApi(path, body) {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return null;
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }

  // Yon kòd tranzaksyon sèvi yon sèl fwa, NatCash kou MonCash (règ Firestore yo verifye l tou)
  const referenceUsed = async (ref, tx) => {
    const read = (key) => (tx ? tx.get(doc(db, "depositRefs", key)) : getDoc(doc(db, "depositRefs", key)));
    const [natcash, moncash] = await Promise.all([read(`natcash_${ref}`), read(`moncash_${ref}`)]);
    return natcash.exists() || moncash.exists();
  };

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
    throw new UserError(t("Nou pa rive kreye kont ou. Eseye ankò.", "Impossible de créer votre compte. Réessayez."));
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

    signIn: (email, password) => retryOnNetwork(() => signInWithEmailAndPassword(auth, email.trim(), password)),

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
      if (changes.photo && changes.photo.length > 60000) throw new UserError(t("Foto a twò lou. Chwazi yon lòt.", "Photo trop lourde. Choisissez-en une autre."));
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
      let payments = null;
      let images = {};
      // Nou voye katalòg la sèlman lè tout pati yo rive (pou yon pwodwi kache pa parèt yon ti moman),
      // epi `ready` di to yo fin chaje (pou paj Finans yo pa di "pa disponib" pandan chajman an)
      const PARTS = 5;
      const arrived = new Set();
      const emit = (part) => {
        arrived.add(part);
        if (arrived.size === PARTS) callback({ products, hidden, exchange, payments, images, ready: true });
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
        // Nimewo MonCash/NatCash pou peye (Panneau admin → Paramèt)
        onSnapshot(doc(db, "settings", "payments"), (snap) => {
          payments = snap.data() || null;
          emit("payments");
        }, failed("payments")),
        // Foto admin nan mete sou pwodwi sit la
        onSnapshot(collection(db, "productImages"), (snap) => {
          images = Object.fromEntries(snap.docs.map((d) => [d.id, d.data().image]));
          emit("images");
        }, failed("images")),
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
    // Kòd pwomo: tcheke l anvan achte. Retounen { code, percent, discount, price }.
    async checkPromo(promoCode, price) {
      const uid = currentUid();
      const code = normalizePromo(promoCode);
      const [snap, used] = await Promise.all([getDoc(doc(db, "promos", code)), getDoc(doc(db, "promoUses", `${code}_${uid}`))]);
      const promo = promoOrThrow(code, snap, used);
      const discount = Math.floor((price * promo.percent) / 100);
      return { code, percent: promo.percent, discount, price: price - discount };
    },

    async placeOrder(packageId, playerId, promoCode = null) {
      const uid = currentUid();
      const pid = String(playerId || "").trim() || null;
      if (pid && !/^\d{6,15}$/.test(pid)) throw new UserError(t("Player ID a dwe gen ant 6 ak 15 chif.", "Le Player ID doit contenir entre 6 et 15 chiffres."));
      const orderRef = doc(collection(db, "orders"));
      const code = `AS-${randomCode(6)}`;
      const promoId = promoCode ? normalizePromo(promoCode) : null;
      return runTransaction(db, async (tx) => {
        const pkgSnap = await tx.get(doc(db, "packages", packageId));
        const pkg = pkgSnap.data();
        if (!pkgSnap.exists() || !pkg.available) throw new UserError(t("Pake sa a pa disponib.", "Ce forfait n'est pas disponible."));
        if (pkg.needs_id && !pid) throw new UserError(t("Mete Player ID ou pou pake sa a.", "Entrez votre Player ID pour ce forfait."));
        const me = (await tx.get(userRef(uid))).data();
        if (!me) throw new UserError(t("Konekte anvan ou achte.", "Connectez-vous avant d'acheter."));

        // Kòd pwomo: rabè a, epi kòd la konte yon fwa pou kliyan sa a
        let price = pkg.price;
        let promo = null;
        if (promoId) {
          const promoRef = doc(db, "promos", promoId);
          const useRef = doc(db, "promoUses", `${promoId}_${uid}`);
          promo = promoOrThrow(promoId, await tx.get(promoRef), await tx.get(useRef));
          price = pkg.price - Math.floor((pkg.price * promo.percent) / 100);
          tx.update(promoRef, { uses: promo.uses + 1 });
          tx.set(useRef, { user_id: uid, order_id: orderRef.id, created_at: serverTimestamp() });
        }
        if (me.balance < price) throw new UserError(t("Solde ou pa ase. Ajoute kòb nan Wallet ou.", "Solde insuffisant. Ajoutez de l'argent à votre Wallet."));

        const order = {
          code, user_id: uid, package_id: packageId, product_name: pkg.product_name, package_label: pkg.label,
          price, player_id: pid, status: "pending", delivery_code: null, admin_note: null,
          created_at: serverTimestamp(), updated_at: serverTimestamp(),
          ...(promo && { promo: promoId, list_price: pkg.price }),
        };
        tx.update(userRef(uid), {
          balance: me.balance - price, total_spent: me.total_spent + price, last_op: { kind: "order", id: orderRef.id },
        });
        tx.set(orderRef, order);
        tx.set(newNotificationRef(uid), notification("order", `Kòmand ${code} resevwa`,
          `${pkg.product_name} · ${pkg.label} (${formatHtg(price)}). N ap trete l kounye a.`, code));
        return { ...order, id: orderRef.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      });
    },

    // Kliyan an peye dirèkteman ak MonCash/NatCash: kòmand lan tann admin nan konfime peman an
    // (solde Wallet la pa chanje). Nimewo tranzaksyon an ka sèvi yon sèl fwa.
    async placeDirectOrder(packageId, playerId, { method, reference, senderPhone }) {
      const uid = currentUid();
      const pid = String(playerId || "").trim() || null;
      if (pid && !/^\d{6,15}$/.test(pid)) throw new UserError(t("Player ID a dwe gen ant 6 ak 15 chif.", "Le Player ID doit contenir entre 6 et 15 chiffres."));
      if (!METHOD_NAMES[method]) throw new UserError(t("Chwazi MonCash oswa NatCash.", "Choisissez MonCash ou NatCash."));
      const ref = normalizeReference(reference);
      if (!/^[A-Z0-9]{6,40}$/.test(ref)) throw new UserError(t("Mete ID tranzaksyon an (sèlman lèt ak chif, omwen 6).", "Entrez l'ID de transaction (lettres et chiffres, au moins 6)."));
      if (isPhoneNumber(ref)) throw new UserError(PHONE_NOT_REFERENCE);
      const phone = String(senderPhone || "").trim().slice(0, 20) || null;
      const refDoc = doc(db, "depositRefs", `${method}_${ref}`);
      const orderRef = doc(collection(db, "orders"));
      const code = `AS-${randomCode(6)}`;
      return runTransaction(db, async (tx) => {
        const pkgSnap = await tx.get(doc(db, "packages", packageId));
        const pkg = pkgSnap.data();
        if (!pkgSnap.exists() || !pkg.available) throw new UserError(t("Pake sa a pa disponib.", "Ce forfait n'est pas disponible."));
        if (pkg.needs_id && !pid) throw new UserError(t("Mete Player ID ou pou pake sa a.", "Entrez votre Player ID pour ce forfait."));
        if (await referenceUsed(ref, tx)) throw new UserError(t("Nimewo tranzaksyon sa a deja itilize.", "Ce numéro de transaction est déjà utilisé."));

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
      if (account.length < 3) throw new UserError(t("Mete kont kote pou n voye kòb la.", "Indiquez le compte où envoyer l'argent."));
      if (name.length < 2) throw new UserError(t("Mete non ki sou kont lan.", "Indiquez le nom du titulaire du compte."));
      const orderRef = doc(collection(db, "orders"));
      const code = `AS-${randomCode(6)}`;
      return runTransaction(db, async (tx) => {
        const exSnap = await tx.get(doc(db, "exchange", productId));
        const ex = exSnap.data();
        if (!exSnap.exists() || !ex.available) throw new UserError(t("Sèvis sa a pa disponib kounye a.", "Ce service n'est pas disponible pour le moment."));
        if (!Number.isInteger(value) || value < ex.min || value > ex.max) {
          throw new UserError(t(`Montan an dwe yon chif san vigil ant ${ex.min} ak ${ex.max} ${ex.currency}.`, `Le montant doit être un nombre entier entre ${ex.min} et ${ex.max} ${ex.currency}.`));
        }
        const q = quote(ex, value);
        const me = (await tx.get(userRef(uid))).data();
        if (!me) throw new UserError(t("Konekte anvan ou achte.", "Connectez-vous avant d'acheter."));
        if (me.balance < q.price) throw new UserError(t("Solde ou pa ase. Ajoute kòb nan Wallet ou.", "Solde insuffisant. Ajoutez de l'argent à votre Wallet."));

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
      if (!Number.isInteger(value)) throw new UserError(t("Mete montan an san vigil (egzanp 1000).", "Entrez un montant sans virgule (exemple 1000)."));
      if (value < DEPOSIT_MIN || value > DEPOSIT_MAX) throw new UserError(t("Montan an dwe ant 50 ak 100 000 HTG.", "Le montant doit être entre 50 et 100 000 HTG."));
      if (!METHOD_NAMES[method]) throw new UserError(t("Mòd peman sa a pa egziste.", "Ce mode de paiement n'existe pas."));
      const ref = normalizeReference(reference);
      if (!/^[A-Z0-9]{6,40}$/.test(ref)) throw new UserError(t("Mete ID tranzaksyon an (sèlman lèt ak chif, omwen 6).", "Entrez l'ID de transaction (lettres et chiffres, au moins 6)."));
      if (isPhoneNumber(ref)) throw new UserError(PHONE_NOT_REFERENCE);
      const phone = String(senderPhone || "").trim().slice(0, 20) || null;

      const refDoc = doc(db, "depositRefs", `${method}_${ref}`);
      if (await referenceUsed(ref)) throw new UserError(t("Nimewo tranzaksyon sa a deja itilize.", "Ce numéro de transaction est déjà utilisé."));
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
      if (!Number.isInteger(value)) throw new UserError(t("Mete montan an san vigil (egzanp 500).", "Entrez un montant sans virgule (exemple 500)."));
      if (value < 10) throw new UserError(t("Montan minimòm lan se 10 HTG.", "Le montant minimum est de 10 HTG."));
      const toCode = String(code).toUpperCase();
      const codeSnap = await getDoc(doc(db, "walletCodes", toCode));
      if (!codeSnap.exists()) throw new UserError(t("Nou pa jwenn AWENS-ID sa a.", "AWENS-ID introuvable."));
      const { uid: to, name: toName } = codeSnap.data();
      if (to === uid) throw new UserError(t("Ou pa ka voye kòb ba tèt ou.", "Vous ne pouvez pas vous envoyer de l'argent."));

      const transferRef = doc(collection(db, "transfers"));
      return runTransaction(db, async (tx) => {
        const me = (await tx.get(userRef(uid))).data();
        if (me.balance < value) throw new UserError(t("Solde ou pa ase.", "Solde insuffisant."));
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

    /* ---------- Parennaj ---------- */
    // { bonus, min_deposit } (bonus 0: parennaj la etenn)
    subscribeReferralSettings(callback) {
      return onSnapshot(doc(db, "settings", "referral"), (snap) => callback(snap.data() || { bonus: 0, min_deposit: 500 }), (error) => console.error("referral", error));
    },

    async adminSetReferralSettings({ bonus, minDeposit }) {
      const b = Number(bonus);
      const min = Number(minDeposit);
      if (!Number.isInteger(b) || b < 0 || b > 5000) throw new UserError("Bonis la dwe ant 0 ak 5 000 HTG.");
      if (!Number.isInteger(min) || min < 50 || min > 100000) throw new UserError("Premye depo a dwe omwen 50 HTG.");
      await setDoc(doc(db, "settings", "referral"), { bonus: b, min_deposit: min });
    },

    // Zanmi k ap kreye kont li ak lyen yon moun (?ref=AWENS-ID): nou sonje ki moun ki envite l
    async claimReferral(code) {
      const uid = currentUid();
      const clean = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!/^[A-HJ-NP-Z2-9]{8}$/.test(clean)) return false;
      if ((await getDoc(doc(db, "referrals", uid))).exists()) return false;
      const owner = await getDoc(doc(db, "walletCodes", clean));
      if (!owner.exists() || owner.data().uid === uid) return false;
      await setDoc(doc(db, "referrals", uid), { referrer_uid: owner.data().uid, referrer_code: clean, rewarded: false, created_at: serverTimestamp() });
      return true;
    },

    // Zanmi yon kliyan envite (pou kat parennaj la)
    subscribeMyReferrals(callback) {
      const uid = auth.currentUser?.uid;
      if (!uid) return () => {};
      return onSnapshot(query(collection(db, "referrals"), where("referrer_uid", "==", uid)), (snap) => callback(snap.docs.map(toPlain)), (error) => console.error("my referrals", error));
    },

    // Admin/sèvè a, apre yon depo konfime: si se premye depo yon zanmi envite (e l ase gwo),
    // zanmi an ak moun ki envite l la chak jwenn bonis la. Retounen true si bonis yo bay.
    async adminRewardReferral(deposit) {
      const refRef = doc(db, "referrals", deposit.user_id);
      const [refSnap, settingsSnap] = await Promise.all([getDoc(refRef), getDoc(doc(db, "settings", "referral"))]);
      const settings = settingsSnap.data() || {};
      if (!refSnap.exists() || refSnap.data().rewarded || !(settings.bonus > 0) || deposit.amount < settings.min_deposit) return false;
      const { referrer_uid: referrer } = refSnap.data();
      const op = { kind: "referral", id: deposit.user_id };
      const batch = writeBatch(db);
      batch.update(refRef, { rewarded: true, deposit_id: deposit.id, rewarded_at: serverTimestamp() });
      batch.update(userRef(deposit.user_id), { balance: increment(settings.bonus), last_admin_op: op });
      batch.update(userRef(referrer), { balance: increment(settings.bonus), last_admin_op: op });
      batch.set(newNotificationRef(deposit.user_id), notification("deposit", `Bonis parennaj ${formatHtg(settings.bonus)} 🎁`, "Mèsi paske w vin jwenn nou! Bonis la nan Wallet ou."));
      batch.set(newNotificationRef(referrer), notification("deposit", `Bonis parennaj ${formatHtg(settings.bonus)} 🎁`, "Zanmi w envite a fè premye depo li. Bonis ou a nan Wallet ou."));
      await batch.commit();
      return true;
    },

    /* ---------- Kòd pwomo (admin) ---------- */
    adminSubscribePromos(callback) {
      return onSnapshot(query(collection(db, "promos"), orderBy("created_at", "desc")), (snap) => callback(snap.docs.map(toPlain)), (error) => console.error("promos", error));
    },

    async adminCreatePromo({ code, percent, expiresAt, maxUses }) {
      const id = normalizePromo(code);
      if (!/^[A-Z0-9]{3,20}$/.test(id)) throw new UserError("Kòd la dwe gen 3 a 20 lèt oswa chif.");
      const pct = Number(percent);
      if (!Number.isInteger(pct) || pct < 1 || pct > 90) throw new UserError("Rabè a dwe ant 1 ak 90%.");
      const max = maxUses === "" || maxUses == null ? null : Number(maxUses);
      if (max !== null && (!Number.isInteger(max) || max < 1)) throw new UserError("Kantite fwa a dwe yon chif (1 oswa plis).");
      const expires = expiresAt ? new Date(`${expiresAt}T23:59:59-05:00`) : null;
      if (expires && expires.getTime() <= Date.now()) throw new UserError("Dat ekspirasyon an deja pase.");
      const ref = doc(db, "promos", id);
      if ((await getDoc(ref)).exists()) throw new UserError("Kòd sa a egziste deja.");
      await setDoc(ref, { percent: pct, active: true, expires_at: expires, max_uses: max, uses: 0, created_at: serverTimestamp() });
      return id;
    },

    adminSetPromoActive: (code, active) => updateDoc(doc(db, "promos", code), { active }),
    adminDeletePromo: (code) => deleteDoc(doc(db, "promos", code)),

    /* ---------- Avi kliyan yo ak kantite kòmand livre ---------- */
    // Avi admin yo apwouve (paj akèy la), pi resan an anvan
    subscribeReviews(callback) {
      return onSnapshot(query(collection(db, "reviews"), where("approved", "==", true), limit(30)), (snap) => {
        callback(newestFirst(snap.docs.map(toPlain)));
      }, (error) => console.error("reviews", error));
    },

    subscribePublicStats(callback) {
      return onSnapshot(doc(db, "stats", "public"), (snap) => callback(snap.data() || {}), (error) => console.error("stats", error));
    },

    // Avi kliyan an te deja bay pou kòmand sa a (null si poko)
    async getMyReview(orderId) {
      try {
        const snap = await getDoc(doc(db, "reviews", orderId));
        return snap.exists() ? toPlain(snap) : null;
      } catch {
        return null;
      }
    },

    async createReview(order, rating, text, name) {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new UserError(t("Konekte anvan.", "Connectez-vous d'abord."));
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new UserError(t("Chwazi kantite etwal yo.", "Choisissez le nombre d'étoiles."));
      const clean = String(text || "").trim().slice(0, 300);
      await setDoc(doc(db, "reviews", order.id), {
        user_id: uid, name: String(name || "Kliyan").trim().slice(0, 40) || "Kliyan", product_name: order.product_name,
        rating, text: clean, approved: false, created_at: serverTimestamp(),
      });
    },

    adminSubscribeReviews(callback) {
      return onSnapshot(query(collection(db, "reviews"), orderBy("created_at", "desc"), limit(60)), (snap) => {
        callback(snap.docs.map(toPlain));
      }, (error) => console.error("admin reviews", error));
    },

    adminSetReviewApproved: (id, approved) => updateDoc(doc(db, "reviews", id), { approved }),
    adminDeleteReview: (id) => deleteDoc(doc(db, "reviews", id)),

    // Mete kantite kòmand livre yo ajou (paj akèy la li l)
    async adminSyncDeliveredCount() {
      const count = (await getCountFromServer(query(collection(db, "orders"), where("status", "==", "delivered")))).data().count;
      const snap = await getDoc(doc(db, "stats", "public"));
      if (!snap.exists() || snap.data().delivered !== count) await setDoc(doc(db, "stats", "public"), { delivered: count });
      return count;
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
        throw new UserError(t("Pa gen koneksyon ak sèvè a. Eseye ankò.", "Pas de connexion au serveur. Réessayez."));
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new UserError(data?.error || t(`Sèvè a pa reponn (HTTP ${res.status}).`, `Le serveur ne répond pas (HTTP ${res.status}).`));
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

    /* ---------- SMS peman (httpSMS) ---------- */
    // Sèvè a: anrejistre yon SMS yon sèl fwa (httpSMS ka voye menm SMS la plizyè fwa)
    // (`data.received_at`: lè SMS la te rive vre, pou yon SMS nou li ankò)
    async adminSaveSms(id, { received_at: at, ...data }) {
      const ref = doc(db, "smsPayments", id);
      const when = at ? new Date(at) : new Date();
      return runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists()) return toPlain(snap);
        tx.set(ref, { ...data, status: "new", deposit_id: null, received_at: at ? when : serverTimestamp() });
        return { id, ...data, status: "new", deposit_id: null, received_at: when.toISOString() };
      });
    },

    // SMS ki rive depi `since` (ms), pi resan an anvan
    async adminRecentSms(since) {
      const snap = await getDocs(query(collection(db, "smsPayments"), where("received_at", ">=", new Date(since)), orderBy("received_at", "desc"), limit(100)));
      return snap.docs.map(toPlain);
    },

    adminDeleteSms: (id) => deleteDoc(doc(db, "smsPayments", id)),

    // Dènye fwa sit la resevwa yon SMS ofisyèl NatCash/MonCash (SIM nan konekte nan httpSMS).
    // Dokiman "seen_…" yo pa gen received_at: yo pa parèt nan lis SMS yo.
    adminMarkSmsSeen: (method) => setDoc(doc(db, "smsPayments", `seen_${method}`), { last_at: serverTimestamp() }),

    // Tras webhook httpSMS la (sms-webhook ak rekiperasyon dirèk la): last_at, result, last_ok_at, missed_at…
    adminSetHookStatus: (fields) => setDoc(doc(db, "smsPayments", "hook_status"), fields, { merge: true }),

    subscribeHookStatus(callback) {
      return onSnapshot(doc(db, "smsPayments", "hook_status"), (snap) => callback(snap.exists() ? toPlain(snap) : {}), (error) => console.error("hook status", error));
    },

    async adminSmsSeen() {
      const snaps = await Promise.all(["natcash", "moncash"].map((m) => getDoc(doc(db, "smsPayments", `seen_${m}`))));
      return { natcash: snaps[0].exists() ? toPlain(snaps[0]).last_at : null, moncash: snaps[1].exists() ? toPlain(snaps[1]).last_at : null };
    },

    subscribeSmsSeen(callback) {
      const seen = {};
      const stops = ["natcash", "moncash"].map((m) => onSnapshot(doc(db, "smsPayments", `seen_${m}`), (snap) => {
        seen[m] = snap.exists() ? toPlain(snap).last_at : null;
        callback({ ...seen });
      }, (error) => console.error("sms seen", error)));
      return () => stops.forEach((stop) => stop());
    },

    // Pwopriyetè a: tout done sit la pou yon backup (fichye JSON)
    async adminExportAll() {
      const names = ["users", "orders", "deposits", "transfers", "packages", "products", "exchange", "supplierMap",
        "settings", "productImages", "announcements", "visits", "smsPayments"];
      const out = { exported_at: new Date().toISOString(), project: config.projectId };
      for (const name of names) out[name] = (await getDocs(collection(db, name))).docs.map(toPlain);
      return out;
    },

    // Rapò: kòmand ak depo ki fèt ant 2 dat
    async adminPeriodData(from, to) {
      const range = (name) => getDocs(query(collection(db, name), where("created_at", ">=", from), where("created_at", "<", to), orderBy("created_at", "asc")));
      const [orders, deposits] = await Promise.all([range("orders"), range("deposits")]);
      return { orders: orders.docs.map(toPlain), deposits: deposits.docs.map(toPlain) };
    },

    // Nimewo MonCash/NatCash ki nan Paramèt ({} si pwopriyetè a poko chanje yo)
    async adminGetPayments() {
      const snap = await getDoc(doc(db, "settings", "payments"));
      return snap.exists() ? snap.data() : {};
    },

    async adminGetSms(id) {
      const snap = await getDoc(doc(db, "smsPayments", id));
      return snap.exists() ? toPlain(snap) : null;
    },

    // Yon SMS sèvi pou yon sèl depo: nou "pran" l anvan nou konfime depo a
    async adminClaimSms(id, depositId) {
      const ref = doc(db, "smsPayments", id);
      return runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists() || snap.data().status !== "new") return false;
        tx.update(ref, { status: "used", deposit_id: depositId });
        return true;
      });
    },

    adminReleaseSms: (id) => updateDoc(doc(db, "smsPayments", id), { status: "new", deposit_id: null }),

    async adminGetAutomation() {
      const snap = await getDoc(doc(db, "settings", "automation"));
      return snap.exists() ? snap.data() : {};
    },

    async adminGetDeposit(id) {
      const snap = await getDoc(doc(db, "deposits", id));
      return snap.exists() ? toPlain(snap) : null;
    },

    // Depo ki gen kòd tranzaksyon sa a (depositRefs se endèks kòd yo)
    async adminFindDepositByRef(method, reference) {
      const refSnap = await getDoc(doc(db, "depositRefs", `${method}_${reference}`));
      const depositId = refSnap.exists() ? refSnap.data().deposit_id : null;
      if (!depositId) return null;
      const snap = await getDoc(doc(db, "deposits", depositId));
      return snap.exists() ? toPlain(snap) : null;
    },

    adminReferenceUsed: (reference) => referenceUsed(reference),

    // Kòd ki pa bon yon kliyan mete (pou pèsonn pa ka devine kòd): konbyen ms li rete pou l tann
    async adminCodeWait(uid) {
      const snap = await getDoc(doc(db, "codeChecks", uid));
      const until = snap.exists() ? snap.data().blocked_until?.toMillis() || 0 : 0;
      return Math.max(0, until - Date.now());
    },

    // Yon lòt kòd ki pa bon: apre `max` nan `waitMs`, kliyan an tann `waitMs`. Retounen chans ki rete.
    async adminAddCodeFail(uid, max, waitMs) {
      const ref = doc(db, "codeChecks", uid);
      return runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const d = snap.exists() ? snap.data() : null;
        const now = Date.now();
        const fresh = !d || now - d.since.toMillis() > waitMs || (d.blocked_until && d.blocked_until.toMillis() <= now);
        const fails = fresh ? 1 : d.fails + 1;
        tx.set(ref, {
          fails,
          since: fresh ? new Date(now) : d.since,
          blocked_until: fails >= max ? new Date(now + waitMs) : null,
        });
        return Math.max(0, max - fails);
      });
    },

    adminClearCodeFails: (uid) => deleteDoc(doc(db, "codeChecks", uid)),

    // Lòt depo ki gen menm kòd tranzaksyon an (nenpòt mòd peman)
    async adminDepositsByReference(reference) {
      const snap = await getDocs(query(collection(db, "deposits"), where("reference", "==", reference)));
      return snap.docs.map(toPlain);
    },

    // Panneau admin: dènye SMS yo
    subscribeSms(callback) {
      return onSnapshot(query(collection(db, "smsPayments"), orderBy("received_at", "desc"), limit(40)), (snap) => {
        callback(snap.docs.map(toPlain));
      }, (error) => console.error("sms", error));
    },

    // Panneau admin: SMS NatCash/MonCash ki gen kòd tranzaksyon sa a (pou verifye yon depo)
    subscribeSmsFor(reference, callback) {
      const found = {};
      const stops = ["natcash", "moncash"].map((method) => onSnapshot(doc(db, "smsPayments", `${method}_${reference}`), (snap) => {
        found[method] = snap.exists() ? toPlain(snap) : null;
        if (Object.keys(found).length === 2) callback(Object.values(found).filter(Boolean));
      }, (error) => console.error("sms", error)));
      return () => stops.forEach((stop) => stop());
    },

    subscribeAutomation(callback) {
      return onSnapshot(doc(db, "settings", "automation"), (snap) => callback(snap.data() || {}), (error) => console.error("automation", error));
    },

    // Pwopriyetè a sèlman: limen/etenn konfimasyon otomatik la, nimewo ofisyèl ki voye SMS yo, limit la
    async adminSetAutomation({ senders, maxAuto }) {
      const max = Number(maxAuto);
      if (!Number.isInteger(max) || max < 0 || max > 100000) throw new UserError("Limit la dwe yon chif san vigil ant 0 ak 100 000.");
      const list = [...new Set((senders || []).map((x) => String(x).trim()).filter(Boolean))].slice(0, 10);
      // Depo yo toujou konfime otomatikman (sms_auto rete nan dokiman an pou règ Firestore yo)
      await setDoc(doc(db, "settings", "automation"), { sms_auto: true, senders: list, max_auto: max });
    },

    // Kliyan an fin voye depo a: sèvè a gade si SMS NatCash/MonCash la deja rive
    requestDepositCheck: (depositId) => postApi("/api/sms-match", { depositId }),

    // Anvan depo a: èske telefòn boutik la resevwa peman kòd sa a? San kòd: èske verifikasyon
    // otomatik la limen ({ auto })
    checkDepositCode: (method, reference) => postApi("/api/sms-lookup", reference === undefined ? {} : { method, reference }),

    // Pou fonksyon sèvè yo (bot admin nan)
    async adminIsAdmin(uid) {
      const snap = await getDoc(userRef(uid));
      return snap.exists() && snap.data().is_admin === true;
    },

    // Admin konplè (pa "kòmand sèlman"): ka chanje paramèt FazerCards yo, depo yo…
    async adminIsFullAdmin(uid) {
      const snap = await getDoc(userRef(uid));
      return snap.exists() && snap.data().is_admin === true && snap.data().admin_role !== "orders";
    },

    // Pwopriyetè a: admin ke okenn lòt admin pa nonmen
    async adminIsOwner(uid) {
      const snap = await getDoc(userRef(uid));
      return snap.exists() && snap.data().is_admin === true && !snap.data().admin_by;
    },

    /* ---------- Alèt Telegram (private/alerts) ---------- */
    async adminGetAlerts() {
      const snap = await getDoc(doc(db, "private", "alerts"));
      return snap.exists() ? snap.data() : {};
    },

    adminSetAlerts: (data) => setDoc(doc(db, "private", "alerts"), data, { merge: true }),

    // Dènye fwa yon alèt (kle) te voye, pou pa voye menm alèt la twòp fwa
    adminMarkAlertSent: (key) => setDoc(doc(db, "private", "alerts"), { sent: { [key]: Date.now() } }, { merge: true }),

    subscribeAlerts(callback) {
      return onSnapshot(doc(db, "private", "alerts"), (snap) => callback(snap.exists() ? toPlain(snap) : {}), (error) => console.error("alerts", error));
    },

    // Pwopriyetè a: konekte Telegram oswa voye yon tès ({ ok } oswa { ok: false, error })
    async alertsAction(action) {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action }),
        });
        return await res.json();
      } catch {
        return { ok: false, error: "Pa gen koneksyon entènèt. Eseye ankò." };
      }
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

    // Mete non pwodwi a ajou sou pake yo (lè non pwodwi a chanje)
    async adminRenamePackages(fixes) {
      const batch = writeBatch(db);
      fixes.slice(0, 400).forEach(({ id, product_name }) => batch.update(doc(db, "packages", id), { product_name: String(product_name).slice(0, 80) }));
      await batch.commit();
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
      if (data.image && data.image.length > 350000) throw new UserError(t("Foto a twò lou. Chwazi yon lòt.", "Photo trop lourde. Choisissez-en une autre."));
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

    // Nimewo pou kliyan yo voye kòb la (pwopriyetè a sèlman)
    async adminSetPayments(accounts) {
      const clean = {};
      for (const id of ["moncash", "natcash"]) {
        const number = String(accounts?.[id]?.number || "").replace(/\D/g, "");
        const name = String(accounts?.[id]?.name || "").trim().slice(0, 60);
        if (number && (number.length < 8 || number.length > 15)) throw new UserError(`Nimewo ${METHOD_NAMES[id]} lan dwe gen omwen 8 chif (egz: 43699262).`);
        clean[id] = { number, name };
      }
      await setDoc(doc(db, "settings", "payments"), clean);
    },

    // Foto yon pwodwi (data: yon ti imaj kare), oswa null pou retounen sou foto pa defo a
    async adminSetProductImage(productId, image) {
      if (!image) return deleteDoc(doc(db, "productImages", productId));
      if (image.length > 120000) throw new UserError(t("Foto a twò lou. Chwazi yon lòt.", "Photo trop lourde. Choisissez-en une autre."));
      await setDoc(doc(db, "productImages", productId), { image });
    },

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
    // Sèlman pwopriyetè a (admin san admin_by) ka fè sa; règ yo verifye l.
    // role: "full" (tout bagay) oswa "orders" (trete kòmand sèlman)
    async adminSetAdmin(uid, makeAdmin, role = "full") {
      const me = currentUid();
      if (uid === me) throw new UserError("Ou pa ka chanje pwòp wòl ou.");
      if (!ADMIN_ROLES.includes(role)) throw new UserError("Wòl sa a pa egziste.");
      const batch = writeBatch(db);
      batch.update(userRef(uid), makeAdmin ? { is_admin: true, admin_by: me, admin_role: role } : { is_admin: false, admin_by: null, admin_role: null });
      if (makeAdmin) batch.set(newNotificationRef(uid), notification("info", "Ou se admin sou Awens Topup", roleText(role)));
      await batch.commit();
    },

    async adminSetAdminRole(uid, role) {
      if (uid === currentUid()) throw new UserError("Ou pa ka chanje pwòp wòl ou.");
      if (!ADMIN_ROLES.includes(role)) throw new UserError("Wòl sa a pa egziste.");
      const batch = writeBatch(db);
      batch.update(userRef(uid), { admin_role: role });
      batch.set(newNotificationRef(uid), notification("info", "Wòl admin ou chanje", roleText(role)));
      await batch.commit();
    },
  };
}
