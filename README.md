# vibencode.com

The Vibencode site. Plain static HTML, CSS and JavaScript: no build step, no
framework, no package manager, no toolchain. What is in this repository is
exactly what gets served.

## Running it locally

Any static file server works, from the repository root. Two that need nothing
installed beyond what you probably already have:

```bash
npx --yes serve -l 8010
```

```bash
python -m http.server 8010
```

Then open <http://localhost:8010>. It has to be served over HTTP rather than
opened as a `file://` path: every internal link is absolute (`/assets/site.css`,
`/services/sovereign-ai/`), so the site expects to sit at a domain root.

That same fact is why this repository is named `prateekcom.github.io`: a GitHub
Pages **user site** publishes at the root, where those links resolve. A normal
project repository would publish under `/<repo>/` and every link would 404.

## Structure

```
index.html                    the home page: five acts, cursor-driven token stream
about/  work/  contact/  careers/
terms/  privacy/              the two legal documents
services/                     index, plus one page per service
work/                         index, seven case studies, and _template/
assets/
  site.css                    the whole design system
  data.js                     the six services, single source of truth
  home.js                     home page only
  site.js                     the cursor stream
  pages.js                    inner pages: reading bar, drawn tracks, arrivals
  clients/                    client logos for the wall on /work/
logo.png                      the mark, as supplied
favicon.ico  icon-*.png  apple-touch-icon.png  og-image.png
sitemap.xml  robots.txt  site.webmanifest
.nojekyll                     serve the files as they are; do not run Jekyll
```

`assets/data.js` is the one place the six services are written down. The home
page cycles them, the services index renders its rows from them, and the token
stream draws its words from them, so the wording cannot drift between the three.

`work/_template/` is the shell a new case study is copied from. It is marked
`noindex` and excluded in `robots.txt`; its comments carry the rules the case
pages follow.

## Design notes

Two typefaces do the identifying: **Bricolage Grotesque** asks, **IBM Plex Mono**
answers. The motif is language rather than illustration: each service is a pair
of sentences, what a client actually says and what it becomes.

Everything that moves is a response to scrolling; nothing runs on a timer. Every
staged or dimmed state is added by script and fails open, so a page with
JavaScript disabled, or with `prefers-reduced-motion` set, is the finished page
with nothing moving rather than a broken one.

No em dashes. Colons, commas and full stops carry the same joins.

## Search

Every page carries a canonical URL, Open Graph and Twitter card tags; the home
page also carries Organization structured data. `sitemap.xml` lists 21 pages and
is declared in `robots.txt`.

**All of that assumes the site is served at `https://vibencode.com`.** There is
no `CNAME` file, so GitHub Pages currently publishes it at
`prateekcom.github.io`. Until a `CNAME` exists the canonical host and the served
host disagree, which is correct only if vibencode.com really is the
destination. The base URL is set in one place per generated artefact: the
`BASE` constant used to write `sitemap.xml`, `robots.txt` and every
`<link rel="canonical">`.

## Still to come

- The GenAI use-case library (155 posts) is not here yet.
- `hero-archive.html` held thirteen earlier hero concepts and was deleted when
  the site moved to production. It is in git history:
  `git show 906f194:hero-archive.html > hero-archive.html` brings it back.
