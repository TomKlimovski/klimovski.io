# klimovski.io — `man` page for first-time visitors

**Date:** 2026-09-09
**Status:** Approved (autonomous session; assumptions stated inline)

## Goal

Give a first-time visitor one place that lets them fully experience the site:
a real-looking manual page with a guided tour, a complete command inventory,
and per-command entries. `help` stays deliberately short but now points at it.

## Design

### `man` command

- `man`, `man klimovski`, `man klimovski.io`, `man tom`, `man intro` → main page.
- `man <command>` → that command's entry. Aliases resolve (`vi` → `vim`,
  `./x` executables `cowsay` and `do-not-run-me` have entries too).
- `man <unknown>` → `No manual entry for <unknown>`.
- Output is inline (not a pager) so visitors can scroll back to it while
  following the tour.

### Main page sections

NAME · SYNOPSIS · DESCRIPTION · GETTING STARTED (numbered tour, every feature
in a sensible order) · COMMANDS (grouped: Filesystem, Housekeeping, Toys,
Programs) · KEYS · DANGER · FILES · SEE ALSO · BUGS.

The tour is structured data (`TOUR = [{ cmd, note }]`) so a test can assert
every tour command is a real command or executable.

### `help`

Unchanged inventory, plus a final line: `lost? 'man klimovski' has the whole tour.`

### Tab completion

`complete(line, commandNames, entryNames, commandArgFor = [])`: when the first
token is in `commandArgFor` (CommandBox passes `['man', 'sudo']`), argument
completion draws from command names instead of cwd entries.

### Code layout

```
src/content/man.js                  — MAIN page, TOUR, per-command ENTRIES, getManPage(name)
src/content/man.test.js             — coverage + resolution tests
src/components/output/ManOutput.js  — man-page renderer (header line, coloured headings, pre-wrap body)
src/helpers/commands/actions.js     — `man` action, `help` pointer
src/helpers/commands/completion.js  — commandArgFor param
src/components/CommandBox.js        — passes ['man', 'sudo']
README.md                           — mention `man`
```

### Testing

Jest: `getManPage` resolution (main aliases, commands, alias `vi`, unknown →
null); every `COMMAND_NAMES` entry has a man entry; every `TOUR` command is a
known command or home-fs executable; completion `commandArgFor` behaviour.
Visual rendering verified manually in the browser.

## Cut (YAGNI)

A `less`-style pager, `man -k` search, `apropos`, `whatis`, an interactive
step-by-step `tour` program.
