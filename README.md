# Aswer Top Up

Sit rechaj jwèt, abònman ak gift cards (React + Vite + Tailwind).
Tout fichye yo nan menm dosye a, konsa ou ka voye yo sou GitHub an yon sèl fwa,
menm depi yon telefòn (Add file → Upload files → chwazi tout fichye yo).

## Kòmanse
```
npm install
npm run dev      # sèvè lokal
npm run build    # kreye dosye dist/ pou mete an liy
```
Sou Vercel: enpòte depo a, Vercel detekte Vite poukont li (`vercel.json` deja la).

## Kote pou chanje bagay yo
Tout kontni paj akèy la nan `data.js`:
- `WHATSAPP_NUMBER`: nimewo WhatsApp sipò a (egzanp `50937000000`).
- `VIDEO_TUTORIAL_URL`: lyen videyo tutoriel la.
- `PRODUCTS`: lis pwodwi yo. Mete `isNew: true` pou badj **NOUVEAU** a,
  `image` pou yon foto (mete foto a nan menm dosye a epi enpòte l anlè `data.js`),
  ak `packages` pou lis pake yo ak pri yo an goud.
- `SLIDES`: banye karousèl la.
- `NOTIFICATIONS`: notifikasyon klòch la.
