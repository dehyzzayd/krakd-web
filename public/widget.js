(function () {
  "use strict";
  var script = document.currentScript;
  if (!script) return;
  var slug = script.getAttribute("data-slug") || script.getAttribute("data-krakd");
  if (!slug) { console.error("[Krakd] widget missing data-slug"); return; }
  var HOST = new URL(script.src).origin;
  var COLOR = script.getAttribute("data-color") || "#2b6ba4";
  var NAME = script.getAttribute("data-name") || "Chat with us";
  if (window.__krakdWidget) return; window.__krakdWidget = true;

  var css = ""
    + ".kw-btn{position:fixed;bottom:20px;right:20px;z-index:2147483000;width:56px;height:56px;border-radius:9999px;border:0;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;transition:transform .15s}"
    + ".kw-btn:hover{transform:scale(1.06)}"
    + ".kw-panel{position:fixed;bottom:88px;right:20px;z-index:2147483000;width:360px;max-width:calc(100vw - 32px);background:#fff;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.24);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:none;flex-direction:column;max-height:calc(100vh - 120px)}"
    + ".kw-open .kw-panel{display:flex}"
    + ".kw-hd{padding:16px 18px;color:#fff}"
    + ".kw-hd h4{margin:0;font-size:15px;font-weight:700}"
    + ".kw-hd p{margin:2px 0 0;font-size:12px;opacity:.85}"
    + ".kw-body{padding:16px 18px;overflow-y:auto;background:#f7f8fa}"
    + ".kw-msg{background:#fff;border:1px solid #eceef1;border-radius:12px;padding:10px 12px;font-size:13.5px;line-height:1.5;color:#1a1d21;margin-bottom:10px;max-width:88%}"
    + ".kw-field{width:100%;box-sizing:border-box;height:40px;border:1px solid #dfe3e8;border-radius:9px;padding:0 11px;font-size:13.5px;margin-bottom:8px;outline:none}"
    + ".kw-field:focus{border-color:" + COLOR + ";box-shadow:0 0 0 3px " + COLOR + "22}"
    + "textarea.kw-field{height:64px;padding:9px 11px;resize:none}"
    + ".kw-consent{display:flex;gap:8px;align-items:flex-start;font-size:11px;color:#6b7280;line-height:1.45;margin:2px 0 10px}"
    + ".kw-consent input{margin-top:2px}"
    + ".kw-send{width:100%;height:42px;border:0;border-radius:9px;color:#fff;font-size:14px;font-weight:600;cursor:pointer}"
    + ".kw-send:disabled{opacity:.5;cursor:not-allowed}"
    + ".kw-foot{padding:8px;text-align:center;font-size:10.5px;color:#9aa0ac;background:#fff;border-top:1px solid #f0f1f3}"
    + ".kw-foot a{color:#9aa0ac;text-decoration:none}"
    + ".kw-ok{text-align:center;padding:22px 8px}"
    + ".kw-ok .kw-check{width:44px;height:44px;border-radius:9999px;color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:22px}";

  var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  var root = document.createElement("div");
  root.innerHTML = ""
    + '<button class="kw-btn" aria-label="' + NAME + '" style="background:' + COLOR + '">'
    + '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
    + '</button>'
    + '<div class="kw-panel">'
    + '  <div class="kw-hd" style="background:' + COLOR + '"><h4>' + NAME + '</h4><p>We typically reply in a few minutes.</p></div>'
    + '  <div class="kw-body">'
    + '    <div class="kw-msg">👋 Hi! Thanks for stopping by. Tell us what you’re looking for and how to reach you — we’ll get right back to you.</div>'
    + '    <input class="kw-field" id="kw-name" placeholder="Your name" />'
    + '    <input class="kw-field" id="kw-contact" placeholder="Phone or email" />'
    + '    <textarea class="kw-field" id="kw-message" placeholder="How can we help?"></textarea>'
    + '    <label class="kw-consent"><input type="checkbox" id="kw-consent" /><span>I agree to be contacted by phone, text and email about my enquiry. Msg/data rates may apply; reply STOP to opt out.</span></label>'
    + '    <button class="kw-send" id="kw-send" style="background:' + COLOR + '" disabled>Send</button>'
    + '  </div>'
    + '  <div class="kw-foot">Powered by <a href="' + HOST + '" target="_blank" rel="noopener">Krakd</a></div>'
    + '</div>';
  document.body.appendChild(root);

  var btn = root.querySelector(".kw-btn");
  var panel = root.querySelector(".kw-panel");
  var name = root.querySelector("#kw-name");
  var contact = root.querySelector("#kw-contact");
  var message = root.querySelector("#kw-message");
  var consent = root.querySelector("#kw-consent");
  var send = root.querySelector("#kw-send");
  var body = root.querySelector(".kw-body");

  btn.addEventListener("click", function () { root.classList.toggle("kw-open"); if (root.classList.contains("kw-open")) name.focus(); });

  function validate() { send.disabled = !(name.value.trim() && contact.value.trim() && consent.checked); }
  [name, contact, consent].forEach(function (el) { el.addEventListener("input", validate); el.addEventListener("change", validate); });

  send.addEventListener("click", function () {
    var val = contact.value.trim();
    var isEmail = val.indexOf("@") > -1;
    send.disabled = true; send.textContent = "Sending…";
    fetch(HOST + "/api/v1/public/site/" + encodeURIComponent(slug) + "/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.value.trim(), email: isEmail ? val : "", phone: isEmail ? "" : val, message: message.value.trim(), consent: consent.checked }),
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (data) {
        body.innerHTML = '<div class="kw-ok"><div class="kw-check" style="background:' + COLOR + '">✓</div>'
          + '<div style="font-size:15px;font-weight:600;color:#1a1d21">' + (data && data.reply ? esc(data.reply) : "Thanks — we’ll be in touch!") + '</div></div>';
      })
      .catch(function () { send.disabled = false; send.textContent = "Send"; alert("Something went wrong. Please try again."); });
  });

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
})();
