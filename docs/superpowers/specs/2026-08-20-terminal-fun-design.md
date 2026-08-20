# klimovski.io Terminal — Fun Edition

**Date:** 2026-08-20
**Status:** Approved

## Goal

Turn the terminal-emulator personal site into a playable, discoverable toy: real-shell
ergonomics, easter eggs, interactive programs, and a retro layer — while staying a
zero-cost static site.

## Constraints

- **$0 to run.** Frontend only. No backend, no API calls, no new paid services.
  Netlify static hosting as today.
- **No new runtime dependencies.** Canvas games are hand-rolled; `react-cowsay` and
  `uuid` are already present. Dev-only additions are allowed if needed for tests.
- Every interactive program must have a guaranteed exit path.
- Honor `prefers-reduced-motion` for anything that auto-plays (boot typing animation,
  CRT flicker). Opt-in commands (cmatrix, snake) are exempt.
- Touch devices: interactive programs show a "best with a keyboard" hint; boot skip
  also works via tap. No swipe controls (cut as YAGNI).

## Current architecture (for context)

- `Prompts` (src/components/Prompt.js) owns an array of prompt rows; each row's
  `CommandBox` parses input on Enter and looks up `actions` (ls/cat/help/sh; `clear`
  special-cased). Output is a React element rendered under the row.
- Files are a flat map in `src/content/home.js` (`about.txt`, `cowsay`,
  `do-not-run-me`). `fileType.dir` exists in utils but is unused. `KEY_UP`/`KEY_DOWN`
  constants exist but are unused (no history).
- Parser lowercases the whole line — a known bug (`cowsay "Hello"` outputs lowercase).
- Single hardcoded `darkMode` emotion theme in `App.js`.

## Design

### 1. Shell core

**Shell state.** A `ShellProvider` (React context + `useReducer`) wrapping the app.
State:

```js
{
  sessions: [ { user, host, fsRoot, themeName, cwd } ],  // stack; top = active
  history: [],          // commands entered, this session only (not persisted)
  crt: false,           // persisted in localStorage
  bootPlayed: false,    // persisted in localStorage
  program: null,        // active interactive program, or null
}
```

The **session stack** is how `ssh` works: `ssh` pushes a session (user `tiq`, host
`tectoniq.com.au`, its own fs root and theme); `exit` pops it. The same prompt loop
serves both — no nested shell implementation. With one session on the stack, `exit`
prints a refusal gag instead of popping. The prompt renders `user@host` from the
active session; the home session is `guest@internet`, exactly as today.

**Virtual filesystem.** `src/content/fs.js` exports a nested tree; nodes are
`{ type: dir|regular|exec, name, content|children, hidden, longView, run }`.
Dotfile nodes set `hidden: true`. The existing `home.js` content migrates in as the
`~` directory; `home.js` is removed and imports updated. Layout:

```
~/
  about.txt        (current content)
  cowsay, do-not-run-me   (execs, as today)
  .plan            (finger-style status file, hidden)
  .secrets/        (hidden dir; contains dont-tell-anyone.txt → gag payoff)
  projects/        (epicarc.txt, skicounselling.txt, sleeplikegoldilocks.txt)
```

Pure helpers in `src/helpers/commands/fsUtils.js`: `resolvePath(cwd, arg)` (handles
`~`, `/`-rooted-at-`~`, `.`, `..`, relative), `getNode(root, path)`, `listDir`,
`readFile`. No trailing-slash pedantry.

**Command contract.** An action returns either
`{ output: <ReactElement> }` (one-shot, as today) or
`{ program: { name, Component } }`. When a program is set, the prompt input hides and
the program's component mounts (inline block or fixed overlay, its choice), receives
keyboard events via a document-level `keydown` listener, and calls `exit(outputElement?)`
to unmount, print an optional farewell line, and restore the prompt. The boot
sequence, vim, snake, cmatrix, and the meltdown are all programs.

**Parser fix.** Only the command token is lowercased; args preserve case. Double
quotes group words into one arg and are stripped. `./foo` handling stays.

**Input ergonomics** (in `CommandBox`): ArrowUp/ArrowDown walk `history`
(constants already in utils); Tab completes command names and node names in the cwd
(pure logic in `src/helpers/commands/completion.js`); Ctrl+L clears the screen.

### 2. Real-shell commands

- `cd`, `pwd`; prompt's directory segment shows the live cwd (`~`, `~/projects`, …).
- `ls` supports `-a` (show hidden) and `-l` in any combination (`-la`/`-al`),
  and directory arguments.
- `cat` accepts paths (`cat projects/epicarc.txt`, `cat ~/.plan`).
- `whoami` — `guest`, with a wink on repeat invocations.
- `history` — numbered list of this session's commands.
- `help` — updated inventory, deliberately not listing the easter eggs.

### 3. Easter eggs (one-shot commands)

- `neofetch` — ASCII "TK" logo beside a TomOS spec card built from real bio data
  (OS: TomOS, Host: klimovski.io, Kernel: GCP, Uptime: 20 years in IT, Shell: zsh,
  Packages: dbt, BigQuery, Prefect, Claude Code, …). Data in `src/content/eggs.js`.
- `sudo <anything>` — "guest is not in the sudoers file. This incident will be
  reported." Special case: `sudo make me a sandwich` → "Okay." (xkcd 149).
- `rm` — `rm -rf /` (and equivalent flag spellings) launches the **meltdown
  program**: scrolling fake deletions, CSS glitch, "SYSTEM HALTED", then auto-runs
  the boot sequence into a cleared shell. Any other `rm` → permission-denied quip.
- `fortune` — random line from a data-engineering-proverbs list in `eggs.js`.
- `git log` — career milestones as oneline commit history (fake short hashes,
  `feat: co-found TectoniQ`, …). Other `git` subcommands → one-liner quips.
- `exit` — with only the home session active: refuses to let the visitor leave
  (playful). Inside an ssh session: pops back home.

### 4. Interactive programs

- `vim` (alias `vi`) — convincing empty buffer: tilde column, statusline showing
  a fake filename and `-- INSERT --` misdirection. Captures all keys; only the
  literal sequence `:q!` + Enter exits. On exit prints "You escaped vim after Ns."
- `snake` — `<canvas>` grid game, arrow keys, food styled as data packets; score
  reported as "pipelines eaten"; `q` or Escape quits and prints the score.
- `cmatrix` — full-viewport canvas rain in theme green; any key exits.
- `ssh tiq@tectoniq.com.au` (aliases: `ssh tectoniq`, `ssh tectoniq.com.au`) —
  prints a connection banner, pushes the TectoniQ session: theme flips to a
  TectoniQ palette (second emotion theme), prompt reads `tiq@tectoniq.com.au`, fs
  root is a tiny TectoniQ tree (`about.txt` with the independent-venture
  positioning, `team.txt`). `exit` pops back and restores the home theme.
  Unknown `ssh` targets → "connection refused".

### 5. Retro layer

- **Boot sequence** — a program auto-launched on first visit only
  (`localStorage: klimovski.bootPlayed`), always available via `reboot`. ~2.5s
  hard cap of BIOS-style lines (KLIMOVSKI BIOS v20.26, memory check, "Detecting
  coffee ... OK", "Mounting ~ ... OK"). Any key or tap skips. Under
  reduced-motion, lines render instantly.
- **`crt`** — toggles a pure-CSS overlay: scanlines, vignette, subtle flicker
  (flicker suppressed under reduced-motion). Persisted via
  `localStorage: klimovski.crt`. localStorage access is try/catch-guarded
  (private browsing).

### 6. Code layout

```
src/content/fs.js                  — home fs tree (replaces home.js)
src/content/tectoniq.js            — ssh sub-shell fs tree
src/content/eggs.js                — fortunes, git-log career data, neofetch card, .plan text
src/helpers/shell/ShellContext.js  — provider + reducer
src/helpers/commands/parser.js     — case/quote fixes (in place)
src/helpers/commands/fsUtils.js    — pure path/fs helpers
src/helpers/commands/completion.js — pure tab completion
src/helpers/commands/actions.js    — command registry (grows)
src/components/programs/           — Boot, Vim, Snake, Cmatrix, Meltdown
src/components/CrtOverlay.js
src/styles/_themes.js              — add tectoniq theme
```

### 7. Testing

Jest via react-scripts (already available). Unit tests for all pure logic: parser
(case preservation, quotes, `./`), fsUtils (resolvePath edge cases: `..` above `~`,
absolute, dotfiles), completion (commands, files, ambiguous prefixes), and the
shell reducer (session push/pop, history, program lifecycle). Visual components
and canvas games are verified manually; no snapshot tests.

### 8. Error handling

- Unknown command message unchanged.
- Programs: document-level listener always bound to the active program only;
  unmount on exit is unconditional (no stuck states). Meltdown ends in `reboot`
  regardless of animation errors (timeout fallback).
- localStorage guarded; failures degrade to session-only behavior.

## Build order (each phase leaves the site shippable)

1. **Core** — shell state, fs tree + helpers, parser fix, history, completion,
   cd/pwd/ls -a/cat paths, live cwd prompt, tests.
2. **Eggs** — sudo, fortune, git log, whoami, history, exit, neofetch, dotfile
   content.
3. **Programs** — program plumbing, boot (simplest, proves plumbing), vim,
   cmatrix, snake, meltdown (`rm -rf /`), ssh session + tectoniq theme.
4. **Retro polish** — first-visit boot wiring, `reboot`, `crt` overlay +
   persistence, reduced-motion + touch hints, README update.

## Explicitly cut (YAGNI)

Pipes/redirection, `nano`, generic theme switcher, Konami code, 2048/typing test,
swipe controls for snake, persistent command history.
