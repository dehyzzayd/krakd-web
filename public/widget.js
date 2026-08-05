(function () {
  "use strict";
  var script = document.currentScript || document.querySelector("script[data-slug],script[data-krakd]");
  if (!script) return;
  var slug = script.getAttribute("data-slug") || script.getAttribute("data-krakd");
  if (!slug) { console.error("[Krakd] widget missing data-slug"); return; }
  var HOST = new URL(script.src).origin;
  var COLOR = script.getAttribute("data-color") || "#2b6ba4";
  var NAME = script.getAttribute("data-name") || "Chat with us";
  if (window.__krakdWidget) return; window.__krakdWidget = true;

  var css = ""
    + ".kw-btn{position:fixed;bottom:20px;right:20px;z-index:2147483000;width:58px;height:58px;border-radius:9999px;border:0;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;transition:transform .15s}"
    + ".kw-btn:hover{transform:scale(1.06)}"
    + ".kw-btn svg{width:26px;height:26px}"
    + ".kw-panel{position:fixed;bottom:90px;right:20px;z-index:2147483000;width:376px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 130px);background:#fff;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.28);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:none;flex-direction:column}"
    + ".kw-open .kw-panel{display:flex}"
    + ".kw-hd{padding:16px 18px;color:#fff;display:flex;align-items:center;gap:11px}"
    + ".kw-hd .kw-av{width:38px;height:38px;border-radius:9999px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px}"
    + ".kw-hd h4{margin:0;font-size:15px;font-weight:700;line-height:1.2}"
    + ".kw-hd p{margin:2px 0 0;font-size:11.5px;opacity:.9;display:flex;align-items:center;gap:5px}"
    + ".kw-hd .kw-dot{width:7px;height:7px;border-radius:9999px;background:#4ade80;box-shadow:0 0 0 2px rgba(255,255,255,.25)}"
    + ".kw-x{margin-left:auto;background:none;border:0;color:#fff;opacity:.85;cursor:pointer;padding:4px;line-height:0}"
    + ".kw-body{flex:1;overflow-y:auto;padding:16px;background:#f6f7f9;display:flex;flex-direction:column;gap:8px}"
    + ".kw-row{display:flex;max-width:100%}"
    + ".kw-row.bot{justify-content:flex-start}.kw-row.me{justify-content:flex-end}"
    + ".kw-bub{max-width:82%;padding:9px 13px;font-size:13.5px;line-height:1.5;border-radius:16px;white-space:pre-wrap;word-wrap:break-word}"
    + ".kw-row.bot .kw-bub{background:#fff;color:#1a1d21;border:1px solid #eceef1;border-bottom-left-radius:5px}"
    + ".kw-row.me .kw-bub{color:#fff;border-bottom-right-radius:5px}"
    + ".kw-bub a{color:inherit;text-decoration:underline}"
    + ".kw-typing{display:flex;gap:4px;padding:11px 14px;background:#fff;border:1px solid #eceef1;border-radius:16px;border-bottom-left-radius:5px;width:fit-content}"
    + ".kw-typing span{width:7px;height:7px;border-radius:9999px;background:#c2c8d0;animation:kwb 1.2s infinite}"
    + ".kw-typing span:nth-child(2){animation-delay:.2s}.kw-typing span:nth-child(3){animation-delay:.4s}"
    + "@keyframes kwb{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}"
    + ".kw-foot{border-top:1px solid #eef0f2;background:#fff}"
    + ".kw-inp{display:flex;align-items:flex-end;gap:8px;padding:10px 12px}"
    + ".kw-inp textarea{flex:1;resize:none;border:0;outline:none;font-family:inherit;font-size:13.5px;line-height:1.4;max-height:96px;padding:8px 2px;color:#1a1d21;background:transparent}"
    + ".kw-send{width:36px;height:36px;border-radius:9999px;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .15s}"
    + ".kw-send:disabled{opacity:.4;cursor:not-allowed}.kw-send svg{width:17px;height:17px}"
    + ".kw-brand{display:flex;align-items:center;justify-content:center;gap:5px;padding:0 0 9px;font-size:10.5px;color:#9aa0ac}"
    + ".kw-brand a{display:inline-flex;align-items:center;gap:5px;color:#6b7280;text-decoration:none;font-weight:600}"
    + ".kw-brand svg{border-radius:4px}";
  var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  var KMARK = '<svg width="14" height="14" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="7" fill="#0A0A0A"/><g stroke="#fff" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"><line x1="11" y1="8" x2="11" y2="24"/><line x1="11" y1="16.5" x2="20.5" y2="8"/><line x1="11" y1="15.3" x2="21" y2="24"/></g><circle cx="23.6" cy="22.6" r="2.4" fill="#ff5a16"/></svg>';
  var initials = NAME.split(/\s+/).filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();

  var root = document.createElement("div");
  root.innerHTML = ""
    + '<button class="kw-btn" aria-label="' + NAME + '" style="background:' + COLOR + '"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>'
    + '<div class="kw-panel">'
    + '  <div class="kw-hd" style="background:' + COLOR + '"><span class="kw-av">' + (initials || "K") + '</span><div><h4>' + NAME + '</h4><p><span class="kw-dot"></span>Typically replies in a few minutes</p></div><button class="kw-x" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div>'
    + '  <div class="kw-body" id="kw-body"></div>'
    + '  <div class="kw-foot">'
    + '    <div class="kw-inp"><textarea id="kw-text" rows="1" placeholder="Type a message…"></textarea>'
    + '      <input type="text" id="kw-hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" />'
    + '      <button class="kw-send" id="kw-send" style="background:' + COLOR + '" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button>'
    + '    </div>'
    + '    <div class="kw-brand">Powered by <a href="' + HOST + '" target="_blank" rel="noopener">' + KMARK + 'Krakd</a></div>'
    + '  </div>'
    + '</div>';
  document.body.appendChild(root);

  var btn = root.querySelector(".kw-btn");
  var panel = root.querySelector(".kw-panel");
  var body = root.querySelector("#kw-body");
  var text = root.querySelector("#kw-text");
  var send = root.querySelector("#kw-send");
  var closeX = root.querySelector(".kw-x");
  var convoId = null, busy = false, greeted = false;

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function linkify(s) { return esc(s).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>'); }
  function scroll() { body.scrollTop = body.scrollHeight; }

  function addBubble(role, html) {
    var row = document.createElement("div"); row.className = "kw-row " + role;
    var b = document.createElement("div"); b.className = "kw-bub";
    if (role === "me") b.style.background = COLOR;
    b.innerHTML = html; row.appendChild(b); body.appendChild(row); scroll();
    return row;
  }
  function showTyping() { var r = document.createElement("div"); r.className = "kw-row bot"; r.id = "kw-typing-row"; r.innerHTML = '<div class="kw-typing"><span></span><span></span><span></span></div>'; body.appendChild(r); scroll(); }
  function hideTyping() { var r = document.getElementById("kw-typing-row"); if (r) r.remove(); }

  function greet() {
    if (greeted) return; greeted = true;
    addBubble("bot", "👋 Hi! Welcome to " + esc(NAME) + ". How can I help — are you interested in a specific vehicle, financing, or our hours &amp; location?");
    setTimeout(function () { text.focus(); }, 120);
  }

  btn.addEventListener("click", function () { root.classList.toggle("kw-open"); if (root.classList.contains("kw-open")) greet(); });
  closeX.addEventListener("click", function () { root.classList.remove("kw-open"); });

  text.addEventListener("input", function () { text.style.height = "auto"; text.style.height = Math.min(text.scrollHeight, 96) + "px"; });
  text.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } });
  send.addEventListener("click", submit);

  // which vehicle is the visitor looking at? (so "this unit" resolves to the real car)
  function currentVehicleId() {
    var m = location.pathname.match(/\/inventory\/([0-9a-fA-F-]{36})/);
    return m ? m[1] : null;
  }

  function submit() {
    var msg = text.value.trim();
    if (!msg || busy) return;
    var hp = (root.querySelector("#kw-hp") || {}).value || "";
    addBubble("me", esc(msg));
    text.value = ""; text.style.height = "auto";
    busy = true; send.disabled = true; showTyping();
    fetch(HOST + "/api/v1/public/site/" + encodeURIComponent(slug) + "/chat", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversationId: convoId, message: msg, vehicleId: currentVehicleId(), hp: hp }),
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        hideTyping();
        if (res.ok && res.j.reply) { convoId = res.j.conversationId || convoId; addBubble("bot", linkify(res.j.reply)); }
        else { addBubble("bot", res.j && res.j.message ? esc(res.j.message) : "Sorry — something went wrong. Please try again."); }
      })
      .catch(function () { hideTyping(); addBubble("bot", "Hmm, I couldn't reach the server. Please try again."); })
      .finally(function () { busy = false; send.disabled = false; text.focus(); });
  }
})();
