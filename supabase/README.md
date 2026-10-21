# Konekte Aswer Top Up ak Supabase

Lè baz done a konekte, kliyan yo gen yon kont, yon Wallet (solde), tranzaksyon,
rang, kòd PIN yo nan Historique, ak notifikasyon an dirèk sou kòmand yo.
Ou menm, ou jere kòmand yo, depo yo ak pri yo nan **Paramètres → Panneau admin**.

## 1. Kreye tab yo
1. Nan Supabase, louvri pwojè a epi ale nan **SQL Editor → New query**.
2. Kole tout fichye [`schema.sql`](schema.sql) a, epi peze **Run**.
   Ou ka relanse l san danje si nou chanje l pita.

## 2. Paramèt koneksyon yo (Authentication)
- **Authentication → Sign In / Providers → Email**: dezaktive **Confirm email**
  pou kliyan yo ka konekte touswit apre yo kreye kont yo. (Si w kite l aktive,
  Supabase voye yon imèl konfimasyon, men sèvis imèl gratis li a limite a
  kèk imèl pa èdtan.)
- **Authentication → URL Configuration**: mete lyen sit la nan **Site URL**
  (egzanp `https://aswertopup.vercel.app`). Sa nesesè pou lyen "Modpas bliye" yo.

## 3. Mete kle yo nan sit la
Nan `data.js`, ranpli:
```js
export const SUPABASE_URL = "https://xxxx.supabase.co";
export const SUPABASE_ANON_KEY = "eyJ...";   // kle "anon public" la, PA "service_role"
```
Mete nimewo MonCash ak NatCash yo tou nan `PAYMENT_METHODS` (`number: "37000000"`).

## 4. Vin admin
1. Kreye kont ou sou sit la (Paramètres → Kreye kont).
2. Nan **SQL Editor**, lanse (ak imèl ou):
   ```sql
   update public.profiles set is_admin = true where email = 'imel-ou@gmail.com';
   ```
3. Rechaje sit la: **Panneau admin** parèt nan Paramètres.

## Kijan sa mache
- **Ajouter de l'argent**: kliyan an voye kòb sou MonCash/NatCash ou, epi li
  mete montan an ak ID tranzaksyon an. Ou verifye l nan MonCash ou, epi ou peze
  **Konfime** nan Panneau admin → Depo. Kòb la antre nan Wallet li touswit.
  Menm ID tranzaksyon an pa ka sèvi de fwa.
- **Acheter**: sèvè a tcheke pri a nan tab `packages` la ak solde kliyan an,
  epi li retire kòb la. Pri ki nan navigatè a pa konte.
- **Livrer**: nan Panneau admin → Kòmand, peze **Livrer**, mete kòd PIN lan
  (si gen youn), epi konfime. Kliyan an resevwa notifikasyon an epi li jwenn
  kòd la nan Historique.
- **Refuser**: kliyan an ranbouse otomatikman nan Wallet li.
- **Pri**: chanje yo nan Panneau admin → Pri. Pou ajoute yon nouvo pake, ajoute
  l nan `data.js` ak menm `id` a nan tab `packages` la (gade fen `schema.sql`).
- **Rang**: Bronze, Argent, Or, Diamant selon kantite kliyan an depanse
  (`RANKS` nan `data.js`).

## Koneksyon ak Google (si w vle)
1. **Authentication → Sign In / Providers → Google**: aktive l epi mete
   Client ID ak Client Secret Google Cloud ou.
2. Nan `data.js`, mete `GOOGLE_LOGIN = true`.
