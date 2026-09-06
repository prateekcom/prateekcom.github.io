/* ==========================================================================
   VIBENCODE / INNER PAGES

   The document pages carry four behaviours, all of them responses to
   scrolling and none of them on a timer:

   - a reading-progress rule, because a service page runs long;
   - a contents rail, so a long page tells you where you are and what else
     there is;
   - drawn tracks — the About timeline and the phase tracks — where the line
     fills at the speed you scroll and each node lights as it is passed;
   - reveal-on-arrival for list rows, staggered, once.

   Everything that hides or dims is added from here, so a page without
   script, or with motion turned down, is simply the finished page with
   nothing moving. Each staged behaviour also fails open: anything already on
   screen is dealt with immediately rather than waiting for a callback, and a
   failsafe undoes the staging entirely if something unforeseen stops it.
   ========================================================================== */

(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  root.classList.add("js");

  /* Everything below is measured in one rAF frame per scroll event. Adding a
     second listener per feature would mean three layout reads a frame. */
  const onFrame = [];
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      onFrame.forEach(fn => fn());
    });
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);

  /* ---- reading progress -------------------------------------------------- */
  const bar = document.createElement("div");
  bar.className = "read-bar";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  onFrame.push(function drawBar() {
    const max = root.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(scrollY / max, 1) : 0) + ")";
  });

  /* ---- contents rail -----------------------------------------------------
     Built from the page rather than written per page: every section head
     already names its own section, so the rail is just those names. It is
     hidden by CSS below 1180px and hidden by script while the lilac head or
     the ink footer is what you are looking at, because a paper-coloured rail
     on either of those grounds is illegible. */
  const sections = [...document.querySelectorAll(".page-section")]
    .filter(section => section.querySelector(".rule-head span"));

  let rail = null;
  let railItems = [];

  if (sections.length > 2) {
    rail = document.createElement("ul");
    rail.className = "rail off";
    rail.setAttribute("aria-label", "Sections on this page");

    sections.forEach((section, i) => {
      if (!section.id) section.id = "section-" + (i + 1);
      const name = section.querySelector(".rule-head span").textContent.trim();

      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = "#" + section.id;
      link.innerHTML = '<span class="label"></span><span class="tick"></span>';
      link.querySelector(".label").textContent = name;
      link.addEventListener("click", event => {
        event.preventDefault();
        section.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      });
      item.appendChild(link);
      rail.appendChild(item);
      railItems.push(item);
    });

    document.body.appendChild(rail);

    const footer = document.querySelector(".site-footer");
    onFrame.push(function markRail() {
      const first = sections[0].getBoundingClientRect();
      const footTop = footer ? footer.getBoundingClientRect().top : Infinity;
      rail.classList.toggle("off", first.top > innerHeight * .5 || footTop < innerHeight * .9);

      /* The section you are reading is the last one whose top has passed the
         upper third of the window. */
      let current = 0;
      sections.forEach((section, i) => {
        if (section.getBoundingClientRect().top < innerHeight * .34) current = i;
      });
      railItems.forEach((item, i) => item.classList.toggle("here", i === current));
    });
  }

  /* ---- drawn tracks ------------------------------------------------------
     A track fills from nothing to full as it travels from low in the window
     to high in it. The nodes are lit by comparing the length of the fill
     against where each node actually sits, so the line and the lit dots can
     never disagree — the same approach the home page uses for its delivery
     path. */
  const tracks = [...document.querySelectorAll(".timeline, .phase-track")];

  function drawTracks() {
    tracks.forEach(track => {
      const box = track.getBoundingClientRect();
      const start = innerHeight * .82;
      const end = innerHeight * .42;
      const span = box.height + start - end;
      const p = span > 0 ? Math.min(Math.max((start - box.top) / span, 0), 1) : 1;
      track.style.setProperty("--draw", p.toFixed(4));

      /* Horizontal only while the phase track is actually side by side; the
         same markup is a spine again below 760px. */
      const across = track.classList.contains("phase-track") && innerWidth >= 760;
      const nodes = [...track.children];

      if (across) {
        const filled = p * track.offsetWidth;
        nodes.forEach(node => node.classList.toggle("lit", filled >= node.offsetLeft + 4));
      } else {
        const inset = track.classList.contains("timeline") ? 10 : 6;
        const filled = p * Math.max(track.offsetHeight - inset * 2, 1) + inset;
        const dot = track.classList.contains("timeline") ? 12 : 8;
        nodes.forEach(node => node.classList.toggle("lit", filled >= node.offsetTop + dot));
      }
    });
  }

  if (tracks.length) {
    if (reduced) {
      /* Nothing dims, but the line is still drawn to full so the section is
         not a row of empty circles. */
      tracks.forEach(track => {
        track.style.setProperty("--draw", "1");
        [...track.children].forEach(node => node.classList.add("lit"));
      });
    } else {
      try {
        tracks.forEach(track => track.classList.add("drawing"));
        drawTracks();
        onFrame.push(drawTracks);
      } catch (error) {
        tracks.forEach(track => track.classList.remove("drawing"));
      }

      /* If the fill never ran for a track the reader is looking at, undim it
         and leave the line alone. Dim text that never brightens would be the
         one failure worth avoiding here. */
      setTimeout(() => {
        tracks.forEach(track => {
          const box = track.getBoundingClientRect();
          const onScreen = box.top < innerHeight && box.bottom > 0;
          const anyLit = [...track.children].some(node => node.classList.contains("lit"));
          if (onScreen && !anyLit) track.classList.remove("drawing");
        });
      }, 2500);
    }
  }

  /* ---- section rules -----------------------------------------------------
     The hairline under a section head draws in as the section arrives. */
  const heads = [...document.querySelectorAll(".rule-head")];
  if (heads.length && !reduced && "IntersectionObserver" in window) {
    const ruler = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("ruled");
        ruler.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: "0px 0px -10% 0px" });

    heads.forEach(head => {
      if (head.getBoundingClientRect().top < innerHeight) head.classList.add("ruled");
      else ruler.observe(head);
    });
    setTimeout(() => heads.forEach(head => head.classList.add("ruled")), 2500);
  } else {
    heads.forEach(head => head.classList.add("ruled"));
  }

  /* ---- arrival ----------------------------------------------------------- */
  const groups = [...document.querySelectorAll(
    ".deliverables, .signals, .service-rows, .next-rows, .failures, " +
    ".needs, .people, .example-steps, .faq, .case-rows")];

  if (!groups.length) return;

  function reveal(group) {
    [...group.children].forEach((row, i) => {
      /* Capped: a twelve-row list should not take a second and a half to
         finish arriving. */
      row.style.transitionDelay = Math.min(i * 55, 330) + "ms";
      row.classList.add("row-in");
    });
  }

  /* Without script, or with motion turned down, nothing is staged and nothing
     is hidden — the class that hides rows is only ever added here. */
  if (reduced || !("IntersectionObserver" in window)) return;

  groups.forEach(group => group.classList.add("rows-in"));

  const watcher = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      watcher.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -8% 0px" });

  groups.forEach(group => {
    /* Anything already on screen is revealed now rather than waiting to be
       told about it — otherwise the top of the page depends on a callback. */
    const box = group.getBoundingClientRect();
    if (box.top < innerHeight && box.bottom > 0) {
      reveal(group);
      return;
    }
    watcher.observe(group);
  });

  /* Failsafe. If the observer never runs — a background tab on first paint, a
     browser that throttles it, anything unforeseen — the page must still be
     readable. Two seconds, then everything is shown whatever happened. */
  setTimeout(() => {
    groups.forEach(group => {
      if (![...group.children].some(row => row.classList.contains("row-in"))) {
        reveal(group);
        watcher.unobserve(group);
      }
    });
  }, 2000);
})();
