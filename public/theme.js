// Aplike tèm nan anvan React chaje pou paj la pa flache (fichye apa pou règ sekirite CSP la)
try {
  var t = localStorage.getItem("aswer-theme");
  if (t === "dark" || (!t && matchMedia("(prefers-color-scheme: dark)").matches)) document.documentElement.classList.add("dark");
} catch (e) {}

// Polis Inter la: li chaje san bloke paj la, epi li aplike lè l rive
(function () {
  var link = document.getElementById("font-css");
  if (!link) return;
  if (link.sheet) link.media = "all";
  else link.addEventListener("load", function () { link.media = "all"; });
})();
