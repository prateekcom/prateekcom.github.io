/* ==========================================================================
   VIBENCODE / CALLS TO ACTION

   Every page loads this, and it owns all three of the site's actions:

   - BOOK. Ordinary links to /contact/, where the calendar is inline. No
     popup and no query parameter: both went when booking stopped
     interrupting the page it was launched from.
   - WRITE. Ordinary links to /contact/. Nothing to wire.
   - MESSAGE. Anything marked data-whatsapp.

   Two values switch the first and third on. Leave them empty and the site
   behaves exactly as it does without this file: no third-party script is
   fetched, the calendar section stays hidden, the WhatsApp rows stay hidden.
   Nothing here can fail half-on.
   ========================================================================== */

(function () {
  /* ------------------------------------------------------------------ set */
  const CAL_LINK = "prateek-porwal/general-discussion";        /* the 30-minute call, e.g. "vibencode/30min"  */
  const CAL_SPRINT = "";      /* optional separate sprint event; falls back  */
  const CAL_ORIGIN = "https://cal.com";   /* your own instance if self-hosted */
  const WHATSAPP = "916265167351";        /* digits with country code, e.g. 919876543210 */

  /* --------------------------------------------------------- message us */
  if (WHATSAPP) {
    document.querySelectorAll("[data-whatsapp]").forEach(node => {
      node.href = "https://wa.me/" + WHATSAPP;
      node.hidden = false;
      const row = node.closest("li");
      if (row) row.hidden = false;
    });
  }

  /* -------------------------------------------------------------- book */
  /* Nothing to load unless this page is the one that shows a calendar. */
  if (!CAL_LINK || !document.getElementById("cal-inline")) return;

  /* Cal's own loader, unchanged. */
  (function (C, A, L) {
    let p = function (a, ar) { a.q.push(ar); };
    let d = C.document;
    C.Cal = C.Cal || function () {
      let cal = C.Cal, ar = arguments;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        d.head.appendChild(d.createElement("script")).src = A;
        cal.loaded = true;
      }
      if (ar[0] === L) {
        const api = function () { p(api, arguments); };
        const namespace = ar[1];
        api.q = api.q || [];
        typeof namespace === "string" ? (cal.ns[namespace] = api) && p(api, ar) : p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, CAL_ORIGIN + "/embed/embed.js", "init");

  Cal("init", { origin: CAL_ORIGIN });

  /* Cal binds its own click handlers by scanning for [data-cal-link] when it
     initialises, so attributes added afterwards are never picked up - the
     link just navigates. Opening the modal ourselves avoids depending on
     when their script happens to finish loading.

     preventDefault only ever runs if this file ran AND a link is configured,
     so the href underneath stays a real fallback. */
  const inline = document.getElementById("cal-inline");
  if (inline) {
    const section = inline.closest("section");
    if (section) section.hidden = false;
    Cal("inline", { elementOrSelector: "#cal-inline", calLink: CAL_LINK, config: { layout: "month_view" } });

    /* Watch for Cal's iframe rather than trusting a timer: the loader comes
       off when there is actually something behind it. If it never arrives,
       say so and give them a way through instead of leaving a bar turning
       over an empty box. */
    const loader = document.getElementById("cal-loading");
    if (loader) {
      loader.hidden = false;
      const started = Date.now();
      const clear = () => { loader.hidden = true; clearInterval(watch); };
      const watch = setInterval(() => {
        const frame = inline.querySelector("iframe");
        if (frame && frame.getBoundingClientRect().height > 120) {
          frame.addEventListener("load", clear, { once: true });
          /* It is often already loaded by the time we get here. */
          setTimeout(clear, 1200);
        } else if (Date.now() - started > 12000) {
          clearInterval(watch);
          loader.innerHTML = 'The calendar is not loading. '
            + '<a class="link" href="mailto:hello@vibencode.com">Write to us instead</a>';
        }
      }, 250);
    }
  }
})();
