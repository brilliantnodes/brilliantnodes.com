# brilliantnodes.com

The website of Brilliant Nodes, served by GitHub Pages at https://www.brilliantnodes.com.

- Static pages: HTML, CSS and our own JavaScript. No libraries, no trackers, no cookies. A Content Security Policy allows one outside request only: the live status of our nodes, read from our public status record.
- The diamond in the hero is drawn with WebGL from our own code. Without WebGL it falls back to a 2D drawing; with reduced motion it is shown still.
- The globe and the map are drawn on a canvas from our own code; the land outline was built offline from a public land mask.
- The inquiry form sends nothing itself: it prepares an email to bn@brilliantnodes.com in the visitor's own email app.
- Font: Atkinson Hyperlegible Next (SIL Open Font License 1.1), self-hosted in `fonts/`.
- Security contact: `/.well-known/security.txt`; policy: `/security.html`.
