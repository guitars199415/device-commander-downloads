"use strict";
(() => {
  const pair = document.getElementById("pair");
  const status = document.getElementById("pair-status");
  const release = document.getElementById("release");
  const download = document.getElementById("download");
  const fragment = window.location.hash;
  const encoded = fragment.startsWith("#pair=") ? fragment.substring(6) : "";
  let invitation = "";
  try {
    if (!encoded || encoded.length > 4096) throw new Error("missing");
    const raw = decodeURIComponent(encoded);
    const uri = new URL(raw);
    if (uri.protocol !== "devicecommander:" || uri.hostname !== "pair" || uri.username || uri.password) throw new Error("invalid");
    const params = uri.searchParams;
    if (!/^wss:\/\//.test(params.get("url") || "")) throw new Error("transport");
    if (!/^[a-f0-9]{64}$/i.test(params.get("pin") || "")) throw new Error("pin");
    if (!/^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){2}$/.test(params.get("code") || "")) throw new Error("code");
    const expiration = Date.parse(params.get("expires") || "");
    if (!Number.isFinite(expiration) || expiration <= Date.now() || expiration > Date.now() + 61 * 60000) throw new Error("expired");
    invitation = raw;
    pair.href = invitation;
    pair.classList.remove("disabled");
    pair.removeAttribute("aria-disabled");
    pair.removeAttribute("tabindex");
    status.textContent = "Invitación válida hasta " + new Date(expiration).toLocaleTimeString("es-MX", {hour:"numeric",minute:"2-digit"}) + ". Aprueba la vinculación en este teléfono.";
  } catch (_error) {
    status.textContent = "No hay invitación válida o ya venció. Pide a tu familiar un QR nuevo. / Request a new QR from the owner.";
  }
  // The invitation lives only in the URL fragment, never in HTTP requests or persistent storage.
  pair.addEventListener("click", (event) => {
    if (!invitation) event.preventDefault();
  });
  fetch("./release.json", {cache:"no-store", credentials:"omit", referrerPolicy:"no-referrer"})
    .then((response) => { if (!response.ok) throw new Error("missing"); return response.json(); })
    .then((data) => {
      if (data.product !== "Device Commander" || data.platform !== "android" || data.channel !== "stable" ||
          !/^\d+\.\d+\.\d+$/.test(data.version) || !/^[a-f0-9]{64}$/i.test(data.sha256) ||
          data.apk !== "DeviceCommander-Android-" + data.version + ".apk") throw new Error("invalid");
      release.textContent = "Stable v" + data.version + " · SHA-256: " + data.sha256;
      download.href = "./" + data.apk;
      download.classList.remove("disabled");
      download.removeAttribute("aria-disabled");
      download.removeAttribute("tabindex");
    })
    .catch(() => {
      release.textContent = "Descarga no verificada. Contacta al propietario. / Release unavailable.";
      download.removeAttribute("href");
      download.classList.add("disabled");
      download.setAttribute("aria-disabled", "true");
    });
})();
