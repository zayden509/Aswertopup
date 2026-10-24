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

## Lè sit la jwenn nouvo fonksyon: mete règ yo ajou
Chak fwa fichye [`firestore.rules`](firestore.rules) a chanje, ou dwe pibliye l ankò:
1. Louvri fichye a sou GitHub, peze **Raw**, epi kopye tout tèks la.
2. **Firestore Database → Règles**, efase sa ki la a, kole nouvo tèks la, epi peze **Publier**.

San sa, nouvo bagay yo (estatistik, pwodwi ou kreye, mesaj) p ap mache, men rès sit la ap
kontinye mache.

## Panneau admin
- **Tablo**: lavant, kòmand, vizitè, nouvo kliyan, depo, pwodwi ki vann plis, pou jodi a,
  7 jou oswa 30 jou (lè Ayiti). Vizitè yo konte yon fwa pa telefòn pa jou.
- **Kòmand / Depo**: trete kòmand yo ak depo yo (gade anba a).
- **Kliyan**: tout kont ki anrejistre yo, solde yo, sa yo depanse, kòmand yo. Ou ka ekri
  yon kliyan dirèkteman: mesaj la parèt nan 🔔 li.
- **Pwodwi**: kreye yon pwodwi (non, foto, kategori), ajoute pake ak pri, kache oswa remete
  nenpòt pwodwi, efase pwodwi ou te kreye yo. Louvri nenpòt pwodwi sit la epi peze
  **Chanje foto a** pou mete pwòp foto pa w (**Foto orijinal la** remete sa ki te la).
  Yon pake dyaman ki rele `520 + BONUS 52` nan seksyon **Diamants** parèt ansanm ak lòt
  kat dyaman yo, nan lòd pri.
- **Pwodwi Finans** (Meru, PayPal, Cash App, Binance Pay, Wise): yo mache ak yon konvèsyon.
  Kliyan an mete konbyen li vle resevwa (oswa konbyen li vle peye), sit la ajoute frè palye a
  epi miltipliye pa to du jou a. Nan **Pwodwi → Finans**, louvri chak pwodwi, mete to a
  (egzanp 145 HTG pou 1 MERU), minimòm, maksimòm ak frè yo, epi peze **Sove**. Tank ou pa
  sove, kliyan yo pa ka achte pwodwi sa a. Kòmand lan montre ou kont kliyan an ak non an.
- **Mesaj**: voye yon mesaj bay tout moun (menm vizitè ki pa gen kont wè l nan 🔔) oswa bay
  yon sèl kliyan.
- **Ekip**: ajoute yon admin ak imèl li (li dwe gen yon kont sou sit la deja), oswa retire l.
  Se sèlman **pwopriyetè** a (admin ou te mete alamen nan Firebase la) ki ka fè sa.
  Lòt admin yo ka fè tout rès bagay yo.
- **Paramèt**: nimewo MonCash ak NatCash kliyan yo voye kòb la, ak non ki sou kont lan.
  Se pwopriyetè a sèlman ki ka chanje yo.

## Kijan sa mache
- **Déposer**: kliyan an voye kòb sou MonCash/NatCash ou, epi li mete montan an ak ID
  tranzaksyon an. Ou verifye l nan MonCash ou, epi ou peze **Konfime** nan
  Panneau admin → Depo. Kòb la antre nan Wallet li touswit. Menm ID tranzaksyon an pa
  ka sèvi de fwa.
- **Acheter**: règ Firestore yo tcheke pri a nan koleksyon `packages` la ak solde
  kliyan an. Yon kliyan pa ka chanje solde li, ni peye mwens pase pri a.
- **Peye dirèkteman**: nan etap **Paiement**, kliyan an ka chwazi MonCash oswa NatCash olye
  Wallet li. Li voye pri a sou nimewo ou, epi li mete ID tranzaksyon an. Kòmand lan parèt nan
  Panneau admin → Kòmand ak **Peman ap verifye**. Verifye l nan MonCash ou, epi peze
  **Mwen resevwa peman an**: si pake a otomatik, FazerCards livre l touswit. Si kòb la pa
  rive, peze **Refuser** (pa gen ranbousman, paske Wallet kliyan an pa t touche).
- **Livrer**: nan Panneau admin → Kòmand, peze **Livrer**, mete kòd PIN lan (si gen
  youn), epi konfime. Kliyan an resevwa notifikasyon an epi li jwenn kòd la nan Historique.
- **Refuser**: kliyan an ranbouse otomatikman nan Wallet li, yon sèl fwa.
- **Transférer**: kliyan an voye kòb bay yon lòt kliyan ak ASWER-ID li.
- Montan yo an goud san vigil (pa egzanp 1000, pa 999,50).

## Limit plan gratis la
Plan Spark la bay **50 000 lekti** ak **20 000 ekriti** pa jou. Sa ase pou plizyè santèn
kliyan chak jou. Si w depase l, Firebase bloke baz done a jiska demen: ou ka pase sou
plan **Blaze** (ou peye sèlman sa w itilize).

## Koneksyon ak Google
Bouton **Kontinye ak Google** la deja sou sit la (`GOOGLE_LOGIN = true` nan `config.js`).
Pou l mache:
1. **Authentication → Sign-in method → Ajouter un fournisseur → Google**, aktive l, chwazi
   imèl sipò a, epi **Enregistrer**.
2. **Authentication → Paramètres → Domaines autorisés**: ajoute `awenstopup.com`,
   `www.awenstopup.com` ak `aswertopup.vercel.app`.

Kliyan ki konekte ak Google jwenn foto kont Google yo kòm foto pwofil (yo ka chanje l).

## Efase yon kont
Kliyan yo voye demann lan sou WhatsApp (anba paj akèy la → **Efase kont**). Pou efase l:
1. **Authentication → Users**: chèche imèl la, peze **⋮ → Supprimer le compte**.
2. **Firestore → Données → users**: efase dokiman kliyan an.

## Livrezon otomatik ak FazerCards
Lè yon pake **otomatik**, kòmand kliyan an ale kote FazerCards touswit apre acha a.
FazerCards mete dyaman yo sou kont jwè a, epi sit la make kòmand lan **Livré** poukont li.
Si FazerCards echwe, kliyan an ranbouse otomatikman. Si FazerCards refize kòmand lan (pa
egzanp balans ou fini), kòmand lan rete nan **Kòmand** ak yon bouton **Eseye ankò**.

Sa ki fè l mache: 3 fonksyon sou Vercel (`api/fulfill.js`, `api/fazer.js`,
`api/fazer-webhook.js`). Kle FazerCards la rete sou sèvè a sèlman.

### Konfigirasyon (yon sèl fwa)
1. **Kont bot la**: sou sit la, kreye yon kont pou sèvè a, pa egzanp `bot@awenstopup.com`, ak
   yon modpas long. Imèl la pa bezwen egziste. Apre sa, nan **Panneau admin → Ekip**, fè l admin.
2. **Kle FazerCards la**: sou reseller.fazercards.com → **Profile**, kreye yon kle API.
3. **Vercel**: pwojè a → **Settings → Environment Variables**, ajoute:
   - `FAZER_API_KEY`: kle FazerCards la
   - `BOT_EMAIL`: imèl kont bot la
   - `BOT_PASSWORD`: modpas kont bot la
   Apre sa, **Deployments → ⋯ → Redeploy** pou varyab yo pran efè.
4. **Panneau admin → Otomatik**: verifye balans lan, epi peze **Konekte** pou webhook la.
5. Peze chak pake, chwazi pwodwi FazerCards ki koresponn lan, epi **Sove**.

Teste ak pwòp kont jwèt ou anvan (pi piti pake a). Kenbe kòb sou balans FazerCards ou
(USDT oswa Binance Pay, minimòm 10 $) ak yon abònman FazerCards aktif.

