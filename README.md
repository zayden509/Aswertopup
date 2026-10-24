# Awens Topup

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
- `SettingsPage.jsx`, `ProfileTabs.jsx`: paj "Mon profil" la (foto, rakousi, Profil / QR Code /
  Frais & limites).
- `SideMenu.jsx`: meni sou kote a (bouton ☰). `Footer.jsx`: pye paj akèy la ak paj legal yo.
- `image.js`: redimansyone foto yo (pwofil, pwodwi) anvan yo ale nan baz done a.
- `AdminPage.jsx` ak `Admin*.jsx`, `adminUi.jsx`: Panneau admin nan (estatistik, kòmand, depo,
  kliyan, pwodwi, mesaj, ekip). Li chaje sèlman pou admin yo.
- `catalog.js`: mete pwodwi ki nan `data.js` ansanm ak sa admin nan kreye yo.
- `payments.js`: nimewo MonCash/NatCash an dirèk (pwopriyetè a chanje yo nan Panneau admin → Paramèt).
- `smsParse.js`, `api/sms-webhook.js`, `api/sms-match.js`, `AdminSms.jsx`: depo otomatik ak SMS (httpSMS).
- `ExchangePage.jsx`, `exchange.js`: paj konvèsyon pwodwi Finans yo (to du jou, frè pa palye).
  Kalkil la menm jan nan `firebase/firestore.rules`.
- `days.js`: jou yo ak lè Ayiti, pou estatistik yo.
- `AuthSheet.jsx`, `Notifications.jsx`: koneksyon ak notifikasyon yo.
- `ProfileWallet.jsx`: kat Wallet la nan pwofil la.
- `account.js`, `backend.js`, `firebase.js`, `errors.js`: koneksyon ak Firebase
  (Firebase chaje sèlman si `config.js` gen kle yo).
- `firebase/firestore.rules`: règ sekirite ki pwoteje kòb kliyan yo.
- `api/`: fonksyon sèvè Vercel pou livrezon otomatik FazerCards (gade `firebase/README.md`).
  `AdminAuto.jsx` se onglet **Otomatik** la nan Panneau admin, `AdminSettings.jsx` se onglet **Paramèt** la.
- `config.js`: nimewo WhatsApp, videyo tutoriel ak kle Firebase yo.
- `ui.jsx`, `orders.js`: pyès ak fonksyon tout paj yo pataje.
- `img/`: foto pwodwi yo ak logo peman yo.

## Kote pou chanje bagay yo
Nan `config.js`:
- `WHATSAPP_NUMBER`: nimewo WhatsApp sipò a (egzanp `50937000000`). Tout kòmand yo rive la.
- `VIDEO_TUTORIAL_URL`: lyen videyo tutoriel la.
- `FIREBASE_CONFIG`: kle Firebase yo (gade `firebase/README.md`).
- `GOOGLE_LOGIN`: bouton "Kontinye ak Google" la.
- `SITE_URL`: adrès sit la (kòd QR Wallet yo mennen la).
- `SOCIAL_LINKS`: lyen TikTok, Instagram, Facebook (anba paj akèy la). Yon lyen vid pa parèt.

Nan `data.js`:
- `PAYMENT_METHODS`: mete nimewo MonCash ak NatCash yo nan `number`.
- `PRODUCTS`: lis pwodwi yo. `groups` se pake yo ak pri yo an goud;
  `isNew: true` mete badj **NOUVEAU** a; `image` se foto a (mete l nan `img/` epi enpòte l anlè `data.js`).
