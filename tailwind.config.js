import colors from "tailwindcss/colors";

// Sit la gen 3 koulè sèlman: jòn, blan, nwa. Tout ansyen koulè aksan yo (ble, vyolèt, woz,
// oranj, vèt…) tounen jòn, e gri yo tounen gri net (san ti ble). Wouj rete pou mesaj erè yo sèlman.
const gold = colors.yellow;
const accents = ["sky", "violet", "fuchsia", "purple", "pink", "rose", "indigo", "blue", "cyan", "teal", "orange", "amber", "lime", "emerald", "green"];

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ...Object.fromEntries(accents.map((name) => [name, gold])),
        slate: colors.neutral,
        gray: colors.neutral,
      },
    },
  },
  plugins: [],
};
