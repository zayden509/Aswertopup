// Tès règ sekirite Firestore yo (kòb kliyan yo) ak emilatè Firebase la.
// Lanse: npm run test:rules (bezwen Java). GitHub Actions lanse yo tou sou chak push.
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, writeBatch, serverTimestamp, increment } from "firebase/firestore";

let env;
const ALICE = "alice", BOB = "bob", OWNER = "owner", STAFF = "staff";

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "awens-rules-test",
    firestore: { rules: readFileSync(new URL("../firebase/firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8085 },
  });
});
after(() => env.cleanup());

const user = (extra = {}) => ({
  email: "x@test.com", full_name: "X", wallet_code: "ABCDEFGH", balance: 1000, total_spent: 0, is_admin: false,
  created_at: new Date(), last_op: null, last_credit: null, last_admin_op: null, ...extra,
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users", ALICE), user({ wallet_code: "AAAAAAAA" }));
    await setDoc(doc(db, "users", BOB), user({ wallet_code: "BBBBBBBB", balance: 0 }));
    await setDoc(doc(db, "users", OWNER), user({ wallet_code: "OOOOOOOO", is_admin: true }));
    await setDoc(doc(db, "users", STAFF), user({ wallet_code: "SSSSSSSS", is_admin: true, admin_by: OWNER, admin_role: "orders" }));
    await setDoc(doc(db, "packages", "ff100"), { product_name: "Free Fire", label: "100", price: 155, needs_id: false, available: true, sort: 1 });
  });
});

const as = (uid) => env.authenticatedContext(uid, { email: "x@test.com" }).firestore();

// Tikè sèvè a bay lè l jwenn SMS peman an
const ticket = (uid, method, reference, amount) => env.withSecurityRulesDisabled((ctx) =>
  setDoc(doc(ctx.firestore(), "depositTickets", `${uid}_${method}_${reference}`), { user_id: uid, method, reference, amount, created_at: new Date() }));

function order(db, id, price, extra = {}) {
  const batch = writeBatch(db);
  batch.set(doc(db, "orders", id), {
    code: "AS-ABCDEF", user_id: ALICE, package_id: "ff100", product_name: "Free Fire", package_label: "100",
    price, player_id: null, status: "pending", delivery_code: null, admin_note: null,
    created_at: serverTimestamp(), updated_at: serverTimestamp(), ...extra,
  });
  batch.update(doc(db, "users", ALICE), { balance: 1000 - price, total_spent: price, last_op: { kind: "order", id } });
  return batch.commit();
}

test("yon kliyan achte ak bon pri a", async () => {
  await assertSucceeds(order(as(ALICE), "o1", 155));
});

test("yon kliyan pa ka peye mwens pase pri a", async () => {
  await assertFails(order(as(ALICE), "o1", 10));
});

test("yon kliyan pa ka ogmante solde li poukont li", async () => {
  await assertFails(updateDoc(doc(as(ALICE), "users", ALICE), { balance: 999999 }));
  await assertFails(updateDoc(doc(as(ALICE), "users", ALICE), { is_admin: true }));
});

test("yon kliyan pa ka li kont yon lòt kliyan", async () => {
  await assertFails(getDoc(doc(as(ALICE), "users", BOB)));
});

test("rabè fidelite: sèlman pousantaj rang lan, e sèlman si pwopriyetè a limen l", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(doc(ctx.firestore(), "users", ALICE), { total_spent: 20000, balance: 1000 });
  });
  const discounted = (db, id, price, loyalty) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "orders", id), {
      code: "AS-ABCDEF", user_id: ALICE, package_id: "ff100", product_name: "Free Fire", package_label: "100",
      price, player_id: null, status: "pending", delivery_code: null, admin_note: null,
      created_at: serverTimestamp(), updated_at: serverTimestamp(), list_price: 155, loyalty,
    });
    batch.update(doc(db, "users", ALICE), { balance: 1000 - price, total_spent: 20000 + price, last_op: { kind: "order", id } });
    return batch.commit();
  };
  // Pa gen paramèt: pa gen rabè
  await assertFails(discounted(as(ALICE), "o1", 152, 2));
  await assertSucceeds(setDoc(doc(as(OWNER), "settings", "loyalty"), { bronze: 1, argent: 2, or: 3, diamant: 5 }));
  await assertFails(discounted(as(ALICE), "o2", 140, 10)); // pa bon pousantaj
  await assertSucceeds(discounted(as(ALICE), "o3", 152, 2)); // Argent: 155 - floor(3.1)
});

test("se pwopriyetè a sèlman ki chanje rabè fidelite yo", async () => {
  await assertFails(setDoc(doc(as(ALICE), "settings", "loyalty"), { bronze: 20, argent: 20, or: 20, diamant: 20 }));
  await assertFails(setDoc(doc(as(STAFF), "settings", "loyalty"), { bronze: 1, argent: 2, or: 3, diamant: 5 }));
  await assertFails(setDoc(doc(as(OWNER), "settings", "loyalty"), { bronze: 50, argent: 2, or: 3, diamant: 5 }));
});

test("transfè: kòb la soti kote moun k ap voye a epi l ale kote lòt la, egzak", async () => {
  const db = as(ALICE);
  const send = (amount, credit) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "transfers", "t1"), { from_user: ALICE, to_user: BOB, from_code: "AAAAAAAA", to_code: "BBBBBBBB", amount, created_at: serverTimestamp() });
    batch.update(doc(db, "users", ALICE), { balance: 1000 - amount, last_op: { kind: "transfer", id: "t1" } });
    batch.update(doc(db, "users", BOB), { balance: credit, last_credit: "t1" });
    return batch.commit();
  };
  await assertFails(send(100, 500)); // Bob pa ka resevwa plis pase sa Alice voye
  await assertFails(send(5000, 5000)); // Alice pa ka voye plis pase solde li
  await assertSucceeds(send(100, 100));
});

test("yon kliyan pa ka konfime pwòp depo li", async () => {
  const db = as(ALICE);
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "deposits", "d1"), {
      user_id: ALICE, amount: 500, method: "moncash", reference: "3598068116", sender_phone: null, status: "pending",
      admin_note: null, created_at: new Date(), updated_at: new Date(),
    });
  });
  const confirm = (db2) => {
    const batch = writeBatch(db2);
    batch.update(doc(db2, "deposits", "d1"), { status: "completed", updated_at: serverTimestamp() });
    batch.update(doc(db2, "users", ALICE), { balance: increment(500), last_admin_op: { kind: "deposit", id: "d1" } });
    return batch.commit();
  };
  await assertFails(confirm(db));
  await assertFails(confirm(as(STAFF))); // admin "kòmand sèlman" pa ka konfime depo
  await assertSucceeds(confirm(as(OWNER)));
});

test("menm kòd tranzaksyon an pa ka sèvi pou de depo", async () => {
  const db = as(ALICE);
  const deposit = (id) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "deposits", id), {
      user_id: ALICE, amount: 500, method: "moncash", reference: "3598068116", sender_phone: null, status: "pending",
      admin_note: null, created_at: serverTimestamp(), updated_at: serverTimestamp(),
    });
    batch.set(doc(db, "depositRefs", "moncash_3598068116"), { deposit_id: id, user_id: ALICE });
    return batch.commit();
  };
  await ticket(ALICE, "moncash", "3598068116", 500);
  await assertSucceeds(deposit("d1"));
  await assertFails(deposit("d2"));
});

test("yon kliyan pa ka li SMS peman yo ni paramèt prive yo", async () => {
  await assertFails(getDoc(doc(as(ALICE), "smsPayments", "moncash_1")));
  await assertFails(getDoc(doc(as(ALICE), "private", "alerts")));
  await assertFails(getDoc(doc(as(ALICE), "settings", "automation")));
});

test("se admin konplè yo sèlman ki mete pwomo flash la", async () => {
  const flash = { active: true, title: "-10% Free Fire", text: null, ends_at: new Date(Date.now() + 3600000), product_id: "free-fire", code: "FLASH10" };
  await assertFails(setDoc(doc(as(ALICE), "settings", "flash"), flash));
  await assertFails(setDoc(doc(as(STAFF), "settings", "flash"), flash));
  await assertSucceeds(setDoc(doc(as(OWNER), "settings", "flash"), flash));
  await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), "settings", "flash")));
});

test("notifikasyon push: chak kliyan jere pa l sèlman, kle sèvè a rete prive", async () => {
  const sub = { subs: [{ endpoint: "https://push.example/1", p256dh: "k", auth: "a" }] };
  await assertSucceeds(setDoc(doc(as(ALICE), "pushSubs", ALICE), sub));
  await assertFails(setDoc(doc(as(ALICE), "pushSubs", BOB), sub));
  await assertFails(getDoc(doc(as(BOB), "pushSubs", ALICE)));
  await assertFails(setDoc(doc(as(ALICE), "pushSubs", ALICE), { subs: Array(6).fill(sub.subs[0]) }));
  await assertFails(getDoc(doc(as(ALICE), "private", "push")));
});

test("depo minimòm lan se 25 HTG", async () => {
  const db = as(ALICE);
  const deposit = (id, amount, ref) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "deposits", id), {
      user_id: ALICE, amount, method: "moncash", reference: ref, sender_phone: null, status: "pending",
      admin_note: null, created_at: serverTimestamp(), updated_at: serverTimestamp(),
    });
    batch.set(doc(db, "depositRefs", `moncash_${ref}`), { deposit_id: id, user_id: ALICE });
    return batch.commit();
  };
  await ticket(ALICE, "moncash", "1111111111", 24);
  await ticket(ALICE, "moncash", "2222222222", 25);
  await assertFails(deposit("d1", 24, "1111111111"));
  await assertSucceeds(deposit("d2", 25, "2222222222"));
});

test("pake Gift Access: admin konplè sèlman, ak bon fòm", async () => {
  const gift = { provider: "giftaccess", product_id: "1024", variation_ref: null, amount: null, offer_name: "Free Fire 100", auto: true };
  await assertFails(setDoc(doc(as(ALICE), "supplierMap", "ff100"), gift));
  await assertSucceeds(setDoc(doc(as(OWNER), "supplierMap", "ff100"), gift));
  await assertFails(setDoc(doc(as(OWNER), "supplierMap", "ff100"), { ...gift, product_id: "" }));
  await assertFails(setDoc(doc(as(OWNER), "supplierMap", "ff100"), { ...gift, provider: "other" }));
});

test("non pwodwi ak non pake: admin konplè sèlman, ak bon fòm", async () => {
  await assertFails(setDoc(doc(as(ALICE), "productNames", "free-fire"), { name: "Free Fire Max" }));
  await assertFails(setDoc(doc(as(STAFF), "productNames", "free-fire"), { name: "Free Fire Max" }));
  await assertFails(setDoc(doc(as(OWNER), "productNames", "free-fire"), { name: "F" }));
  await assertFails(setDoc(doc(as(OWNER), "productNames", "free-fire"), { name: "Free Fire Max", extra: 1 }));
  await assertSucceeds(setDoc(doc(as(OWNER), "productNames", "free-fire"), { name: "Free Fire Max" }));
  await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), "productNames", "free-fire")));
  await assertFails(updateDoc(doc(as(ALICE), "packages", "ff100"), { label: "100 Diamants" }));
  await assertFails(updateDoc(doc(as(OWNER), "packages", "ff100"), { label: "" }));
  await assertSucceeds(updateDoc(doc(as(OWNER), "packages", "ff100"), { label: "100 Diamants", product_name: "Free Fire Max" }));
});

test("yon depo san SMS peman (san tikè sèvè a) refize", async () => {
  const db = as(ALICE);
  const deposit = (id, amount, ref) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "deposits", id), {
      user_id: ALICE, amount, method: "moncash", reference: ref, sender_phone: "50900000000", status: "pending",
      admin_note: null, created_at: serverTimestamp(), updated_at: serverTimestamp(),
    });
    batch.set(doc(db, "depositRefs", `moncash_${ref}`), { deposit_id: id, user_id: ALICE });
    return batch.commit();
  };
  await assertFails(deposit("fake", 25, "ZZMONCASH01"));
  await ticket(ALICE, "moncash", "3333333333", 500);
  await assertFails(deposit("more", 5000, "3333333333")); // montan an pa menm ak SMS la
  await ticket(BOB, "moncash", "4444444444", 500);
  await assertFails(deposit("other", 500, "4444444444")); // tikè yon lòt kliyan
  await assertSucceeds(deposit("ok", 500, "3333333333"));
  await assertFails(setDoc(doc(as(ALICE), "depositTickets", `${ALICE}_moncash_5555555555`), { user_id: ALICE, method: "moncash", reference: "5555555555", amount: 9999, created_at: new Date() }));
});
