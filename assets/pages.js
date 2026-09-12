/* ==========================================================================
   VIBENCODE / INNER PAGES

   The document pages carry three behaviours, all of them responses to
   scrolling and none of them on a timer:

   - a reading-progress rule, because a service page still runs long;
   - the About page's drawn journey, where the spine fills at the speed you
     scroll and each year lights as it is passed;
   - reveal-on-arrival for list rows, staggered, once.

   Two things used to live here and no longer do. A contents rail sat pinned
   to the right-hand edge of every long page; it was apparatus the reader had
   not asked for, and it is gone. And the drawn track was shared between the
   About journey and the four-phase process blocks on nine other pages: drawing the same figure that often left it meaning nothing in particular,
   so the journey keeps it and the phase blocks became a plain grid.

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
     second listener per feature would mean two layout reads a frame. */
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

  /* ---- the drawn journey -------------------------------------------------
     One element, on one page. The spine fills from nothing to full as it
     travels from low in the window to high in it, and the nodes are lit by
     comparing the length of the fill against where each node actually sits,
     so the line and the lit dots can never disagree, the same approach the
     home page uses for its delivery path. */
  const tracks = [...document.querySelectorAll(".timeline")];

  function drawTracks() {
    tracks.forEach(track => {
      const box = track.getBoundingClientRect();
      const start = innerHeight * .82;
      const end = innerHeight * .42;
      const span = box.height + start - end;
      const p = span > 0 ? Math.min(Math.max((start - box.top) / span, 0), 1) : 1;
      track.style.setProperty("--draw", p.toFixed(4));

      const inset = 10;
      const filled = p * Math.max(track.offsetHeight - inset * 2, 1) + inset;
      [...track.children].forEach(node => node.classList.toggle("lit", filled >= node.offsetTop + 12));
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
    ".deliverables, .fit-list, .service-rows, .next-rows, .failures, " +
    ".needs, .people, .stages, .faq, .case-rows, " +
    ".client-wall-grid, .took")];

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
     is hidden, the class that hides rows is only ever added here. */
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
       told about it: otherwise the top of the page depends on a callback. */
    const box = group.getBoundingClientRect();
    if (box.top < innerHeight && box.bottom > 0) {
      reveal(group);
      return;
    }
    watcher.observe(group);
  });

  /* Failsafe. If the observer never runs, a background tab on first paint, a
     browser that throttles it, anything unforeseen, the page must still be
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

/* ---- folding the long lists on a phone ------------------------------------
   A service page was 9.6 screens at 375px, and almost none of that was extra
   words: it is the two-column blocks stacking into one, so the same content
   costs twice the scroll. Cutting copy would be the expensive fix for the
   wrong problem.

   So the supporting detail folds instead. Each long list keeps its first
   couple of items and hides the rest behind one control per section - never
   several, which would read as a page arguing with itself.

   What does not fold: .service-rows and .case-rows, which are the point of
   the pages they sit on, and .faq, which is already a stack of <details>.

   The script only marks and never measures. Which viewport counts as a phone
   is left entirely to a media query, so a rotation or a resize is handled by
   the browser at the moment it happens - no listener to miss an event, and
   nothing to leave content hidden on a wide screen if one is missed.

   The markup also ships whole and is folded afterwards, so a crawler, a
   reader with no JavaScript and a printed page all get everything.
   -------------------------------------------------------------------------- */
(() => {
  /* keep: how many items survive the fold, chosen so each list still shows
     enough to establish what kind of list it is. A list only one longer than
     that is left alone: hiding a single item buys nothing and costs a
     control. */
  const LISTS = [
    [".deliverables", 2],
    [".ships ul", 1],
    [".stages", 1],
    [".needs", 2],
    [".next-rows", 2],
    [".failures", 2],
    [".roles", 3],
    [".timeline", 2],
    /* Prose rather than a list, but the same mechanic: about's "lean on
       purpose" runs five paragraphs and 1.4 screens on a phone. The case
       pages carry three, which the keep + 1 guard leaves alone. */
    [".prose", 2],
  ];

  document.querySelectorAll("main > section").forEach(section => {
    let extras = 0, anchor = null, lists = 0, single = 0;

    LISTS.forEach(([selector, keep]) => {
      section.querySelectorAll(selector).forEach(list => {
        const items = [...list.children];
        if (items.length <= keep + 1) return;
        items.slice(keep).forEach(item => item.classList.add("fold-extra"));
        extras += items.length - keep;
        anchor = list.closest(".ships") || list;
        single = lists ? 0 : items.length;
        lists += 1;
      });
    });
    if (!extras) return;

    /* The opening paragraph of a split section is the longest single block on
       the page. It is clamped rather than hidden, because its first lines are
       what a reader skimming actually wants from it. */
    if (section.classList.contains("split")) {
      const lede = section.querySelector(".lede");
      if (lede) lede.classList.add("fold-clamp");
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "fold-more mono";
    const shut = lists === 1 && single ? "Show all " + single : "Read the rest";
    const label = (open) =>
      (open ? "Show less" : shut) + ' <span aria-hidden="true">' + (open ? "↑" : "↓") + "</span>";

    button.setAttribute("aria-expanded", "false");
    button.innerHTML = label(false);
    button.addEventListener("click", () => {
      const open = section.classList.toggle("fold-open");
      button.setAttribute("aria-expanded", String(open));
      button.innerHTML = label(open);
    });
    anchor.insertAdjacentElement("afterend", button);
  });
})();
