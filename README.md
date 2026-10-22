# Aswer Top Up

Sit rechaj jwèt, abònman ak gift cards (React + Vite + Tailwind).

## Kòmanse
```
npm install
npm run dev      # sèvè lokal
npm run build    # kreye dosye dist/ pou mete an liy
```
Sou Vercel: enpòte depo a, Vercel detekte Vite poukont li (`vercel.json` deja la).

## Baz done (Wallet, kont kliyan, notifikasyon)
Sit la mache san baz done (kòmand yo pase sou WhatsApp). Pou aktive kont
kliyan, Wallet ak solde, tranzaksyon, rang, kòd PIN ak notifikasyon an dirèk,
swiv gid [`firebase/README.md`](firebase/README.md) (Firebase, plan gratis la).

## Fichye yo
- `data.js`: tout kontni an (pwodwi, pri, peman, banye, notifikasyon, nimewo WhatsApp).
- `App.jsx`: paj akèy la, Boutique, navigasyon anba a.
- `ProductPage.jsx`: paj acha a (Player ID, pake, mode peman, konfimasyon).
- `PaymentPage.jsx`: paj Wallet la (MonCash, NatCash, tutoriel).
- `HistoryPage.jsx`: istorik kòmand yo (sove sou telefòn kliyan an).
- `WalletPage.jsx`, `WalletSheets.jsx`: Wallet la, depo ak transfè (lè baz done a konekte).
- `SettingsPage.jsx`, `AdminPage.jsx`: Paramètres (rang, kont) ak Panneau admin nan.
- `AuthSheet.jsx`, `Notifications.jsx`: koneksyon ak notifikasyon yo.
- `ProfileWallet.jsx`: kat Wallet la nan pwofil la.
- `account.js`, `backend.js`, `firebase.js`, `errors.js`: koneksyon ak Firebase
  (Firebase chaje sèlman si `config.js` gen kle yo).
- `firebase/firestore.rules`: règ sekirite ki pwoteje kòb kliyan yo.
- `config.js`: nimewo WhatsApp, videyo tutoriel ak kle Firebase yo.
- `ui.jsx`, `orders.js`: pyès ak fonksyon tout paj yo pataje.
- `img/`: foto pwodwi yo ak logo peman yo.

## Kote pou chanje bagay yo
Nan `config.js`:
- `WHATSAPP_NUMBER`: nimewo WhatsApp sipò a (egzanp `50937000000`). Tout kòmand yo rive la.
- `VIDEO_TUTORIAL_URL`: lyen videyo tutoriel la.
- `FIREBASE_CONFIG`: kle Firebase yo (gade `firebase/README.md`).

Nan `data.js`:
- `PAYMENT_METHODS`: mete nimewo MonCash ak NatCash yo nan `number`.
- `PRODUCTS`: lis pwodwi yo. `groups` se pake yo ak pri yo an goud;
  `isNew: true` mete badj **NOUVEAU** a; `image` se foto a (mete l nan `img/` epi enpòte l anlè `data.js`).
