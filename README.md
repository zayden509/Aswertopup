# Aswer Top Up

Sit rechaj jwèt, abònman ak gift cards (React + Vite + Tailwind).

## Kòmanse
```
npm install
npm run dev      # sèvè lokal
npm run build    # kreye dosye dist/ pou mete an liy
```
Sou Vercel: enpòte depo a, Vercel detekte Vite poukont li (`vercel.json` deja la).

## Fichye yo
- `data.js`: tout kontni an (pwodwi, pri, peman, banye, notifikasyon, nimewo WhatsApp).
- `App.jsx`: paj akèy la, Boutique, navigasyon anba a.
- `ProductPage.jsx`: paj acha a (Player ID, pake, mode peman, konfimasyon).
- `PaymentPage.jsx`: paj Wallet la (MonCash, NatCash, tutoriel).
- `HistoryPage.jsx`: istorik kòmand yo (sove sou telefòn kliyan an).
- `ui.jsx`, `orders.js`: pyès ak fonksyon tout paj yo pataje.
- `img/`: foto pwodwi yo ak logo peman yo.

## Kote pou chanje bagay yo
Nan `data.js`:
- `WHATSAPP_NUMBER`: nimewo WhatsApp sipò a (egzanp `50937000000`). Tout kòmand yo rive la.
- `PAYMENT_METHODS`: mete nimewo MonCash ak NatCash yo nan `number`.
- `VIDEO_TUTORIAL_URL`: lyen videyo tutoriel la.
- `PRODUCTS`: lis pwodwi yo. `groups` se pake yo ak pri yo an goud;
  `isNew: true` mete badj **NOUVEAU** a; `image` se foto a (mete l nan `img/` epi enpòte l anlè `data.js`).
