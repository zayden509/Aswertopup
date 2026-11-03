import React from "react";

// Inisyal non kliyan an pou avatar la (egzanp "Jean Baptiste" -> "JB")
export function initials(profile) {
  const source = (profile?.full_name || profile?.email || "?").trim();
  const words = source.split(/[\s@._-]+/).filter(Boolean);
  return ((words[0]?.[0] || "?") + (words[1]?.[0] || "")).toUpperCase();
}

// Foto pwofil kliyan an, oswa inisyal li yo si l pa gen foto.
// `className` bay gwosè a (ak gwosè tèks inisyal yo).
export function UserAvatar({ profile, photo, className = "h-11 w-11 text-sm" }) {
  const src = photo ?? profile?.photo;
  if (src) return <img src={src} alt="" referrerPolicy="no-referrer" decoding="async" className={`${className} shrink-0 rounded-full object-cover`} />;
  return (
    <span className={`grid ${className} shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 font-extrabold text-white`}>
      {initials(profile)}
    </span>
  );
}
