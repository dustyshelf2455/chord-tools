# Chord tools

Two small web apps for guitar and keyboard, built as installable home-screen pages.

- **Chord Finder** (`/`) — pick a chord and swipe through playable guitar shapes and piano voicings, or type a whole progression and see every chord at once. Saves progressions with the voicing chosen for each chord; shares them as links.
- **Jazz Voicings** (`/voicings/`) — shell voicings, the ii–V–I, 9ths and 13ths, and comping ideas.

Static HTML served from GitHub Pages. `index.html` is generated: edit the files in `src/` and run `python3 src/build.py`. `node src/test.js` checks the chord engine against reference shapes, spellings and parser cases.
