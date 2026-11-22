// Aplike tèm nan anvan React chaje pou paj la pa flache (fichye apa pou règ sekirite CSP la)
try {
  // Mòd nwa a se tèm prensipal la: tout moun kòmanse an nwa, sof si yo chwazi mòd klè nan meni an
  var t = localStorage.getItem("awens-theme");
  document.documentElement.classList.toggle("dark", t !== "light");
} catch (e) {}

// Polis Inter la: li chaje san bloke paj la, epi li aplike lè l rive
(function () {
  var link = document.getElementById("font-css");
  if (!link) return;
  if (link.sheet) link.media = "all";
  else link.addEventListener("load", function () { link.media = "all"; });
})();
