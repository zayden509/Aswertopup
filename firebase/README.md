# Konekte Aswer Top Up ak Firebase (plan gratis)

Lè Firebase konekte, kliyan yo gen yon kont, yon Wallet (solde), tranzaksyon,
rang, kòd PIN yo nan Historique, ak notifikasyon an dirèk sou kòmand yo.
Ou menm, ou jere kòmand yo, depo yo ak pri yo nan **Profil → Panneau admin**.

Tout bagay mache sou plan **Spark** (gratis), san kat bank.

## 1. Kreye pwojè a
1. Ale sou **console.firebase.google.com**, epi peze **Create a project** (oswa **Add project**).
2. Bay li yon non, pa egzanp `aswer-topup`. Ou ka dezaktive Google Analytics.

## 2. Aktive koneksyon ak imèl
1. Nan meni an: **Build → Authentication → Get started**.
2. Nan **Sign-in method**, chwazi **Email/Password**, aktive premye bouton an, epi **Save**.
3. Nan **Settings → Authorized domains**, peze **Add domain** epi ajoute:
   `awenstopup.com`, `www.awenstopup.com` ak `aswertopup.vercel.app`.

## 3. Kreye baz done a
1. **Build → Firestore Database → Create database**.
2. Chwazi yon kote (pa egzanp `nam5 (United States)`), epi **production mode**.
3. Ale nan onglet **Rules**, efase sa ki la a, kole tout fichye
   [`firestore.rules`](firestore.rules) a, epi peze **Publish**.

## 4. Mete kle yo nan sit la
1. Peze ⚙️ (**Project settings**), desann nan **Your apps**, epi peze ikòn **`</>`** (Web).
2. Bay app la yon non (`Aswer`), epi peze **Register app**. **Pa** koche Firebase Hosting.
3. Firebase ap montre yon blòk `const firebaseConfig = { ... }`. Kopye valè yo nan
   `config.js`, nan `FIREBASE_CONFIG` (apiKey, authDomain, projectId, storageBucket,
   messagingSenderId, appId). Kle sa yo fèt pou parèt nan sit la, se règ yo ki pwoteje done yo.

Oubyen voye blòk la ban mwen, epi m ap mete l pou ou.

## 5. Vin admin
1. Louvri sit la, epi kreye kont ou: peze ⚙️ anlè adwat, epi **Kreye kont**.
2. Nan Firebase: **Firestore Database → Data → users**, peze dokiman ki gen imèl ou a.
3. Peze sou chan **is_admin**, chanje `false` an `true`, epi **Update**.
4. Rechaje sit la: **Panneau admin** parèt anba pwofil ou.
5. Nan Panneau admin → **Pri**, peze **Ajoute yo ak pri ki nan sit la**. San etap sa a,
   kliyan yo pa ka achte.

## Kijan sa mache
- **Déposer**: kliyan an voye kòb sou MonCash/NatCash ou, epi li mete montan an ak ID
  tranzaksyon an. Ou verifye l nan MonCash ou, epi ou peze **Konfime** nan
  Panneau admin → Depo. Kòb la antre nan Wallet li touswit. Menm ID tranzaksyon an pa
  ka sèvi de fwa.
- **Acheter**: règ Firestore yo tcheke pri a nan koleksyon `packages` la ak solde
  kliyan an. Yon kliyan pa ka chanje solde li, ni peye mwens pase pri a.
- **Livrer**: nan Panneau admin → Kòmand, peze **Livrer**, mete kòd PIN lan (si gen
  youn), epi konfime. Kliyan an resevwa notifikasyon an epi li jwenn kòd la nan Historique.
- **Refuser**: kliyan an ranbouse otomatikman nan Wallet li, yon sèl fwa.
- **Transférer**: kliyan an voye kòb bay yon lòt kliyan ak ASWER-ID li.
- Montan yo an goud san vigil (pa egzanp 1000, pa 999,50).

## Limit plan gratis la
Plan Spark la bay **50 000 lekti** ak **20 000 ekriti** pa jou. Sa ase pou plizyè santèn
kliyan chak jou. Si w depase l, Firebase bloke baz done a jiska demen: ou ka pase sou
plan **Blaze** (ou peye sèlman sa w itilize).

## Koneksyon ak Google (si w vle)
1. **Authentication → Sign-in method → Add new provider → Google**, aktive l, epi **Save**.
2. Nan `config.js`, mete `GOOGLE_LOGIN = true`.
