# Terminal Fun Edition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn klimovski.io's terminal into a playable toy: real-shell ergonomics (history, tab, directories), easter eggs, interactive programs (vim/snake/cmatrix/ssh), and a retro layer (boot sequence, CRT) — frontend-only, zero cost.

**Architecture:** A `ShellProvider` (context + pure reducer) holds a session stack (how `ssh` works), history, and the active interactive program. Files live in a nested virtual-fs tree; pure helpers resolve paths. Commands are functions `(args, shell) => ReactElement | {program} | null`; a `{program}` result mounts a fullscreen component that owns the keyboard until it calls `exit(farewell?)`.

**Tech Stack:** React 17, react-scripts 4 (CRA), @emotion/styled 11, jest via `react-scripts test`. Spec: `docs/superpowers/specs/2026-08-20-terminal-fun-design.md`.

## Global Constraints

- **$0 / frontend-only:** no backend, no API calls, no new runtime dependencies.
- **Node 20 + react-scripts 4:** `yarn build`/`yarn start` need `NODE_OPTIONS=--openssl-legacy-provider`. Do NOT add the flag to package.json scripts (Netlify may run an older Node where the flag is fatal).
- **Test command:** `CI=true yarn test --watchAll=false` (single run, no watch).
- Every interactive program must have a guaranteed exit path.
- `prefers-reduced-motion`: boot renders instantly, CRT flicker disabled. Opt-in programs (cmatrix/snake) exempt.
- localStorage access always wrapped (private-browsing safe). Keys: `klimovski.bootPlayed`, `klimovski.crt`.
- Match existing code style: emotion styled-components, theme colors via `props.theme.colors.*`, 4-space indent, default exports for components.
- Commit after every task with the trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Parser — preserve arg case, support quotes

**Files:**
- Modify: `src/helpers/commands/parser.js`
- Test: `src/helpers/commands/parser.test.js`

**Interfaces:**
- Produces: `parseCommand(raw) => { command: string (lowercased), args: string[] (case preserved, quotes stripped), raw: string (trimmed) }`. `./foo bar` still becomes `{command:'sh', args:['foo','bar']}`.

- [ ] **Step 1: Write the failing tests**

```js
// src/helpers/commands/parser.test.js
import parseCommand from './parser';

test('lowercases the command token only', () => {
    expect(parseCommand('CAT About.txt')).toEqual(
        { command: 'cat', args: ['About.txt'], raw: 'CAT About.txt' });
});

test('preserves case inside quoted args and strips quotes', () => {
    expect(parseCommand('sh cowsay "Hello World"')).toEqual(
        { command: 'sh', args: ['cowsay', 'Hello World'], raw: 'sh cowsay "Hello World"' });
});

test('collapses whitespace between tokens', () => {
    expect(parseCommand('  ls    -la   ')).toEqual(
        { command: 'ls', args: ['-la'], raw: 'ls    -la' });
});

test('dot-slash becomes sh with the target prepended', () => {
    expect(parseCommand('./do-not-run-me now')).toEqual(
        { command: 'sh', args: ['do-not-run-me', 'now'], raw: './do-not-run-me now' });
});

test('empty input parses to empty command', () => {
    expect(parseCommand('   ')).toEqual({ command: '', args: [], raw: '' });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true yarn test --watchAll=false src/helpers/commands/parser.test.js`
Expected: FAIL (current parser lowercases everything and has no `raw`).

- [ ] **Step 3: Rewrite the parser**

```js
// src/helpers/commands/parser.js  (full replacement)
const tokenize = (line) => {
    const tokens = [];
    const re = /"([^"]*)"|(\S+)/g;
    let m;
    while ((m = re.exec(line)) !== null) {
        tokens.push(m[1] !== undefined ? m[1] : m[2]);
    }
    return tokens;
};

const parseCommand = (cmd) => {
    const raw = cmd.trim();
    const parts = tokenize(raw);
    if (parts.length === 0) {
        return { command: '', args: [], raw };
    }
    let command = parts[0].toLowerCase();
    let args = parts.slice(1);

    if (command.startsWith('./')) {
        const target = command.slice(2);
        command = 'sh';
        if (target.length > 0) {
            args.unshift(target);
        }
    }
    return { command, args, raw };
};

export default parseCommand;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true yarn test --watchAll=false src/helpers/commands/parser.test.js`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/helpers/commands/parser.js src/helpers/commands/parser.test.js
git commit -m "fix(shell): parser preserves arg case and handles quoted args"
```

---

### Task 2: fsUtils — pure path resolution over a nested tree

**Files:**
- Create: `src/helpers/commands/fsUtils.js`
- Test: `src/helpers/commands/fsUtils.test.js`

**Interfaces:**
- Consumes: `fileType` from `src/helpers/utils.js` (`{regular:0, exec:1, dir:2}`).
- Produces:
  - `resolvePath(cwd: string[], arg: string) => string[]` — cwd like `['~','projects']`; handles `~`, `~/x`, `/x` (rooted at `~`), `.`, `..` (clamped at `~`), relative paths.
  - `getNode(root, path: string[]) => node | null` — root is the `~` dir node; dir nodes have `.children` keyed by name.
  - `formatPath(path: string[]) => string` — `['~']` → `'~'`, `['~','projects']` → `'~/projects'`.

- [ ] **Step 1: Write the failing tests**

```js
// src/helpers/commands/fsUtils.test.js
import { resolvePath, getNode, formatPath } from './fsUtils';
import { fileType } from '../utils';

const tree = {
    type: fileType.dir, name: '~', children: {
        'about.txt': { type: fileType.regular, name: 'about.txt', content: ['hi'] },
        '.plan': { type: fileType.regular, name: '.plan', content: ['x'], hidden: true },
        'projects': {
            type: fileType.dir, name: 'projects', children: {
                'epicarc.txt': { type: fileType.regular, name: 'epicarc.txt', content: ['y'] },
            },
        },
    },
};

test('resolvePath handles relative, dot and dotdot', () => {
    expect(resolvePath(['~'], 'projects')).toEqual(['~', 'projects']);
    expect(resolvePath(['~', 'projects'], '..')).toEqual(['~']);
    expect(resolvePath(['~', 'projects'], '.')).toEqual(['~', 'projects']);
    expect(resolvePath(['~', 'projects'], '../projects/./epicarc.txt'))
        .toEqual(['~', 'projects', 'epicarc.txt']);
});

test('resolvePath clamps dotdot at home', () => {
    expect(resolvePath(['~'], '../../..')).toEqual(['~']);
});

test('resolvePath handles ~ and absolute paths', () => {
    expect(resolvePath(['~', 'projects'], '~')).toEqual(['~']);
    expect(resolvePath(['~', 'projects'], '~/about.txt')).toEqual(['~', 'about.txt']);
    expect(resolvePath(['~', 'projects'], '/projects')).toEqual(['~', 'projects']);
});

test('resolvePath with empty arg returns cwd copy', () => {
    const cwd = ['~', 'projects'];
    const out = resolvePath(cwd, '');
    expect(out).toEqual(cwd);
    expect(out).not.toBe(cwd);
});

test('getNode walks the tree and misses cleanly', () => {
    expect(getNode(tree, ['~'])).toBe(tree);
    expect(getNode(tree, ['~', 'projects', 'epicarc.txt']).name).toBe('epicarc.txt');
    expect(getNode(tree, ['~', 'nope'])).toBeNull();
    expect(getNode(tree, ['~', 'about.txt', 'deeper'])).toBeNull();
});

test('formatPath renders home-rooted paths', () => {
    expect(formatPath(['~'])).toBe('~');
    expect(formatPath(['~', 'projects'])).toBe('~/projects');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true yarn test --watchAll=false src/helpers/commands/fsUtils.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement fsUtils**

```js
// src/helpers/commands/fsUtils.js
import { fileType } from '../utils';

export const resolvePath = (cwd, arg) => {
    let base;
    let segs;
    if (!arg) {
        return [...cwd];
    }
    if (arg === '~' || arg.startsWith('~/')) {
        base = ['~'];
        segs = arg.split('/').slice(1);
    } else if (arg.startsWith('/')) {
        base = ['~'];
        segs = arg.split('/');
    } else {
        base = [...cwd];
        segs = arg.split('/');
    }
    for (const s of segs) {
        if (s === '' || s === '.') continue;
        if (s === '..') {
            if (base.length > 1) base.pop();
            continue;
        }
        base.push(s);
    }
    return base;
};

export const getNode = (root, path) => {
    let node = root;
    for (const seg of path.slice(1)) {
        if (!node || node.type !== fileType.dir || !node.children[seg]) {
            return null;
        }
        node = node.children[seg];
    }
    return node;
};

export const formatPath = (path) =>
    path.length === 1 ? '~' : '~/' + path.slice(1).join('/');
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true yarn test --watchAll=false src/helpers/commands/fsUtils.test.js`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/helpers/commands/fsUtils.js src/helpers/commands/fsUtils.test.js
git commit -m "feat(shell): pure virtual-fs path helpers"
```

---

### Task 3: Shell reducer — sessions, history, program, flags

**Files:**
- Create: `src/helpers/shell/shellReducer.js`
- Test: `src/helpers/shell/shellReducer.test.js`

**Interfaces:**
- Produces (all pure, no imports from content or React):
  - `HOME_SESSION = { user:'guest', host:'internet', fsName:'home', themeName:'dark', cwd:['~'] }`
  - `initShellState({crt, bootPlayed}) => state` where state = `{ sessions:[HOME_SESSION], history:[], crt, bootPlayed, program:null }`
  - `shellReducer(state, action)` with actions:
    `{type:'PUSH_SESSION', session}`, `{type:'POP_SESSION'}` (no-op at depth 1),
    `{type:'SET_CWD', cwd}` (updates top session only),
    `{type:'ADD_HISTORY', line}` (ignores empty/whitespace),
    `{type:'START_PROGRAM', program}`, `{type:'EXIT_PROGRAM'}`,
    `{type:'SET_CRT', on}`, `{type:'MARK_BOOT_PLAYED'}`.
  - `program` is an opaque object `{ name, Component, onExit }` stored as-is.

- [ ] **Step 1: Write the failing tests**

```js
// src/helpers/shell/shellReducer.test.js
import { shellReducer, initShellState, HOME_SESSION } from './shellReducer';

const s0 = () => initShellState({ crt: false, bootPlayed: false });

test('initial state has one home session', () => {
    const s = s0();
    expect(s.sessions).toEqual([HOME_SESSION]);
    expect(s.history).toEqual([]);
    expect(s.program).toBeNull();
});

test('push and pop sessions; pop never empties the stack', () => {
    const tiq = { user: 'tiq', host: 'tectoniq.com.au', fsName: 'tectoniq', themeName: 'tectoniq', cwd: ['~'] };
    let s = shellReducer(s0(), { type: 'PUSH_SESSION', session: tiq });
    expect(s.sessions).toHaveLength(2);
    s = shellReducer(s, { type: 'POP_SESSION' });
    expect(s.sessions).toEqual([HOME_SESSION]);
    s = shellReducer(s, { type: 'POP_SESSION' });
    expect(s.sessions).toEqual([HOME_SESSION]);
});

test('SET_CWD changes only the top session', () => {
    const tiq = { user: 'tiq', host: 'tectoniq.com.au', fsName: 'tectoniq', themeName: 'tectoniq', cwd: ['~'] };
    let s = shellReducer(s0(), { type: 'PUSH_SESSION', session: tiq });
    s = shellReducer(s, { type: 'SET_CWD', cwd: ['~', 'x'] });
    expect(s.sessions[1].cwd).toEqual(['~', 'x']);
    expect(s.sessions[0].cwd).toEqual(['~']);
    s = shellReducer(s, { type: 'POP_SESSION' });
    expect(s.sessions[0].cwd).toEqual(['~']);
});

test('history ignores blank lines and appends in order', () => {
    let s = shellReducer(s0(), { type: 'ADD_HISTORY', line: 'ls' });
    s = shellReducer(s, { type: 'ADD_HISTORY', line: '   ' });
    s = shellReducer(s, { type: 'ADD_HISTORY', line: 'cat about.txt' });
    expect(s.history).toEqual(['ls', 'cat about.txt']);
});

test('program start and exit', () => {
    const prog = { name: 'vim', Component: () => null, onExit: null };
    let s = shellReducer(s0(), { type: 'START_PROGRAM', program: prog });
    expect(s.program).toBe(prog);
    s = shellReducer(s, { type: 'EXIT_PROGRAM' });
    expect(s.program).toBeNull();
});

test('flags', () => {
    let s = shellReducer(s0(), { type: 'SET_CRT', on: true });
    expect(s.crt).toBe(true);
    s = shellReducer(s, { type: 'MARK_BOOT_PLAYED' });
    expect(s.bootPlayed).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true yarn test --watchAll=false src/helpers/shell/shellReducer.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the reducer**

```js
// src/helpers/shell/shellReducer.js
export const HOME_SESSION = {
    user: 'guest',
    host: 'internet',
    fsName: 'home',
    themeName: 'dark',
    cwd: ['~'],
};

export const initShellState = ({ crt = false, bootPlayed = false } = {}) => ({
    sessions: [HOME_SESSION],
    history: [],
    crt,
    bootPlayed,
    program: null,
});

export const shellReducer = (state, action) => {
    switch (action.type) {
        case 'PUSH_SESSION':
            return { ...state, sessions: [...state.sessions, action.session] };
        case 'POP_SESSION':
            if (state.sessions.length <= 1) return state;
            return { ...state, sessions: state.sessions.slice(0, -1) };
        case 'SET_CWD': {
            const sessions = [...state.sessions];
            const top = sessions[sessions.length - 1];
            sessions[sessions.length - 1] = { ...top, cwd: action.cwd };
            return { ...state, sessions };
        }
        case 'ADD_HISTORY':
            if (!action.line || !action.line.trim()) return state;
            return { ...state, history: [...state.history, action.line] };
        case 'START_PROGRAM':
            return { ...state, program: action.program };
        case 'EXIT_PROGRAM':
            return { ...state, program: null };
        case 'SET_CRT':
            return { ...state, crt: action.on };
        case 'MARK_BOOT_PLAYED':
            return { ...state, bootPlayed: true };
        default:
            return state;
    }
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true yarn test --watchAll=false src/helpers/shell/shellReducer.test.js`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/helpers/shell/shellReducer.js src/helpers/shell/shellReducer.test.js
git commit -m "feat(shell): pure shell state reducer with session stack"
```

---

### Task 4: Completion — pure tab-completion logic

**Files:**
- Create: `src/helpers/commands/completion.js`
- Test: `src/helpers/commands/completion.test.js`

**Interfaces:**
- Produces: `complete(line, commandNames: string[], entryNames: string[]) => string | null` — returns the new full input line, or null if nothing to do. First token completes against commands (unique match gets a trailing space); later tokens complete against entry names in the cwd. Hidden entries (leading `.`) only offered when the token starts with `.`. Tokens containing `/` are not completed (YAGNI). Multiple matches extend to the longest common prefix.

- [ ] **Step 1: Write the failing tests**

```js
// src/helpers/commands/completion.test.js
import { complete } from './completion';

const CMDS = ['ls', 'cat', 'cd', 'clear', 'cowsay'];
const ENTRIES = ['about.txt', 'projects', '.plan', '.secrets', 'cowsay'];

test('completes a unique command with trailing space', () => {
    expect(complete('l', CMDS, ENTRIES)).toBe('ls ');
});

test('extends ambiguous command to longest common prefix', () => {
    expect(complete('c', CMDS, ENTRIES)).toBe('c'.length < 2 ? null : 'c');
});

test('completes file args', () => {
    expect(complete('cat ab', CMDS, ENTRIES)).toBe('cat about.txt');
});

test('hidden entries only offered for dot-prefixed tokens', () => {
    expect(complete('cat .p', CMDS, ENTRIES)).toBe('cat .plan');
    expect(complete('cat p', CMDS, ENTRIES)).toBe('cat projects');
});

test('ambiguous file arg extends to common prefix', () => {
    expect(complete('cat .', CMDS, ENTRIES)).toBe('cat .');
    expect(complete('ls .s', CMDS, ENTRIES)).toBe('ls .secrets');
});

test('returns null when no match, empty token, or slash in token', () => {
    expect(complete('cat zz', CMDS, ENTRIES)).toBeNull();
    expect(complete('cat ', CMDS, ENTRIES)).toBeNull();
    expect(complete('cat projects/e', CMDS, ENTRIES)).toBeNull();
    expect(complete('', CMDS, ENTRIES)).toBeNull();
});
```

Note on the second test: `'c'` matches cat/cd/clear/cowsay whose longest common prefix is `'c'` — no progress, so the expected result is `null`. Write it literally:

```js
test('ambiguous command with no progress returns null', () => {
    expect(complete('c', CMDS, ENTRIES)).toBeNull();
});
```

(Use this literal version instead of the ternary one above.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true yarn test --watchAll=false src/helpers/commands/completion.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement completion**

```js
// src/helpers/commands/completion.js
const commonPrefix = (names) =>
    names.reduce((a, b) => {
        let i = 0;
        while (i < a.length && i < b.length && a[i] === b[i]) i++;
        return a.slice(0, i);
    });

export const complete = (line, commandNames, entryNames) => {
    if (!line) return null;
    const endsWithSpace = /\s$/.test(line);
    if (endsWithSpace) return null;
    const parts = line.trimStart().split(/\s+/);
    const token = parts[parts.length - 1];
    if (!token || token.includes('/')) return null;

    const isCommand = parts.length === 1;
    const pool = isCommand
        ? commandNames
        : entryNames.filter((n) => (token.startsWith('.') ? true : !n.startsWith('.')));
    const matches = pool.filter((n) => n.startsWith(token));
    if (matches.length === 0) return null;

    let replacement;
    if (matches.length === 1) {
        replacement = matches[0] + (isCommand ? ' ' : '');
    } else {
        replacement = commonPrefix(matches);
    }
    if (replacement.length <= token.length) return null;
    return line.slice(0, line.length - token.length) + replacement;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true yarn test --watchAll=false src/helpers/commands/completion.test.js`
Expected: 6 passed (after replacing the ternary test with the literal one).

- [ ] **Step 5: Commit**

```bash
git add src/helpers/commands/completion.js src/helpers/commands/completion.test.js
git commit -m "feat(shell): pure tab-completion logic"
```

---

### Task 5: Content modules — fs trees and egg copy

**Files:**
- Create: `src/content/eggs.js`
- Create: `src/content/fs.js`
- Create: `src/content/tectoniq.js`
- (Leave `src/content/home.js` in place until Task 6 rewires imports.)

**Interfaces:**
- Consumes: `fileType` from `src/helpers/utils.js`; `execs` from `src/helpers/commands/execs.js`.
- Produces:
  - `eggs.js`: named exports `FORTUNES`, `CAREER_LOG`, `NEOFETCH_ART`, `NEOFETCH_INFO`, `PLAN_LINES`, `SECRET_LINES`, `BOOT_LINES`, `MELTDOWN_LINES` (all `string[]` except `NEOFETCH_INFO` which is `[label, value][]`).
  - `fs.js`: `export const homeFs` — the `~` dir node (children keyed by name).
  - `tectoniq.js`: `export const tectoniqFs` — the ssh sub-shell's `~` dir node.

- [ ] **Step 1: Write eggs.js**

```js
// src/content/eggs.js
export const FORTUNES = [
    "It's not a data swamp, it's a data lake with character.",
    'The pipeline is idempotent. The pipeline is idempotent. The pipeline is idempoten',
    "There are two hard problems in data: naming things, timezones, and off-by-one errors.",
    'dbt run succeeded. Nobody knows why.',
    "A BigQuery bill is just a love letter you write to Google every month.",
    'Schema-on-read is schema-on-someone-else’s-problem.',
    'The AI agent did it correctly on the 3rd try. We call this "engineering".',
    'Your DAG has a cycle. So does history.',
    "It works on my cluster.",
    'Real engineers test in prod. Great engineers have a rollback script.',
];

export const CAREER_LOG = [
    'f4b1e20 feat(tectoniq): co-found TectoniQ as Director of Technology',
    'c0ffee1 feat(cleanaway): tech lead & AI architect',
    'ba5e164 feat(bendigo-bank): tech lead',
    '9a77a0a feat: found Gamma Data — data platforms for the enterprise',
    'a5b2b4a feat(anz): enterprise-scale GCP implementation',
    'd00dbee chore: a decade of GCP, somehow',
    '1a17c0d feat: enter the IT industry (20 years ago)',
    '0000001 initial commit',
];

export const NEOFETCH_ART = [
    '████████╗ ██╗  ██╗',
    '╚══██╔══╝ ██║ ██╔╝',
    '   ██║    █████╔╝ ',
    '   ██║    ██╔═██╗ ',
    '   ██║    ██║  ██╗',
    '   ╚═╝    ╚═╝  ╚═╝',
];

export const NEOFETCH_INFO = [
    ['OS', 'TomOS 20.26 LTS'],
    ['Host', 'klimovski.io (Netlify free tier)'],
    ['Kernel', 'GCP-5.x-enterprise'],
    ['Uptime', '20 years in IT'],
    ['Shell', 'zsh (allegedly)'],
    ['Packages', 'dbt, BigQuery, Prefect, Vault, PowerBI, Claude Code'],
    ['Editor', "definitely-not-vim (try 'vim')"],
    ['Company', 'Gamma Data — gammadata.io'],
    ['Venture', 'TectoniQ — tectoniq.com.au (independent)'],
    ['Learning', 'how far AI coding agents can be pushed'],
];

export const PLAN_LINES = [
    'Building TIQ at TectoniQ.',
    'Shipping data platforms at Gamma Data.',
    'Teaching AI agents to behave.',
    "Back before the coffee's cold.",
];

export const SECRET_LINES = [
    'Okay, the actual secret:',
    "'do-not-run-me' is perfectly safe to run.",
    'Would I lie to you?',
];

export const BOOT_LINES = [
    'KLIMOVSKI BIOS v20.26 — (C) 2021-2026',
    'Memory check: 640K ........... OK (should be enough for anybody)',
    'Detecting coffee ............. OK',
    'Mounting ~ ................... OK',
    'Starting data pipelines ...... OK (3 retries)',
    'Negotiating with AI agents ... OK',
    'Starting shell ...',
];

export const MELTDOWN_LINES = [
    "rm: removing '/home/guest/about.txt'",
    "rm: removing '/home/guest/.plan'",
    "rm: removing '/home/guest/projects'",
    "rm: removing '/var/lib/dbt/models' (all 847 of them)",
    "rm: removing '/etc/gcp/credentials.json'",
    "rm: removing '/dev/coffee'",
    "rm: removing '/usr/share/twenty-years-of-experience'",
    "rm: removing '/opt/tectoniq/tiq'",
    "rm: removing 'node_modules' (17.3 GB freed)",
    "rm: removing '/boot/vmlinuz-tomos'",
    "rm: cannot remove '/sys/kernel/regret': Operation not permitted",
    "rm: removing '/'",
];
```

- [ ] **Step 2: Write fs.js**

The `about.txt` content array below is copied verbatim from the current `src/content/home.js` (post-refresh). If home.js has drifted, copy the live array instead.

```js
// src/content/fs.js
import { fileType } from '../helpers/utils';
import execs from '../helpers/commands/execs';
import { PLAN_LINES, SECRET_LINES } from './eggs';

const execContent = 'Error: can not print an executable file.';

const file = (name, content, extra = {}) =>
    ({ type: fileType.regular, name, content, longView: 'r--', ...extra });
const exec = (name, run) =>
    ({ type: fileType.exec, name, content: [execContent], run, longView: 'r-x' });
const dir = (name, children, extra = {}) =>
    ({ type: fileType.dir, name, children, longView: 'r-x', ...extra });

const aboutLines = [
    "Hi there 👋 I'm Tom Klimovski, Principal at Gamma Data (https://gammadata.io).",
    'We build Data Platforms for the Enterprise.',
    '',
    '-----',
    'Using and manipulating Data in the cloud is what excites me.',
    'I am a specialist GCP consultant with a 20-year history in IT, including a decade of',
    'enterprise-scale GCP implementations for the likes of:',
    '● Cleanaway — Tech Lead',
    '● Bendigo Bank — Tech Lead',
    '● Wesfarmers Health',
    '● ANZ Bank',
    "Startups I've helped with include notion.ai & gopassport.health",
    '',
    '-----',
    "Things we've done at gammadata.io:",
    '● Gitlab/Prefect/Vault/Salesforce/BigQuery/dbt/PowerBI',
    '● Delivered solutions with:',
    '...o High durability of data',
    '...o Robust pipelines and documentation that catch issues early',
    '...o Completely configurable, pythonic syntax for easy debugging',
    '...o ELT architecture on top of a GCP Data Lake',
    '',
    '-----',
    "🚀 Outside of Gamma Data entirely, I'm Co-Founder & Director of Technology",
    'at TectoniQ (https://tectoniq.com.au) — an independent venture.',
    'A strategic talent advisory powered by TIQ, our unified talent intelligence platform —',
    'helping organisations attract, assess, recruit and develop early talent.',
    '',
    '-----',
    'My side projects include',
    '✊ epicarc.io',
    '✊ skicounselling.com',
    '✊ sleeplikegoldilocks.com',
    '',
    '-----',
    '🔭 I’m currently Tech Lead & AI Architect at Cleanaway, and building TIQ at TectoniQ',
    '🌱 I’m currently learning how far AI coding agents can be pushed. Always learning',
    '👯 I’m looking to collaborate on tools that make automation possible',
    '🤔 I’m looking for help with automating Data Governance',
    '💬 Ask me about Delivering Technical Projects',
    '   Read my blog here: https://medium.com/@tom.klimovski',
    '      And here: https://medium.com/@tom.klimovski_90944',
    '------',
];

export const homeFs = dir('~', {
    'about.txt': file('about.txt', aboutLines),
    'cowsay': exec('cowsay', execs['cowsay']),
    'do-not-run-me': exec('do-not-run-me', execs['rick-roll']),
    '.plan': file('.plan', PLAN_LINES, { hidden: true }),
    '.secrets': dir('.secrets', {
        'dont-tell-anyone.txt': file('dont-tell-anyone.txt', SECRET_LINES),
    }, { hidden: true }),
    'projects': dir('projects', {
        'epicarc.txt': file('epicarc.txt', ['epicarc.io — a side project.', 'Status: perpetually nearly done.']),
        'skicounselling.txt': file('skicounselling.txt', ['skicounselling.com — a side project.', 'Downhill from here (in a good way).']),
        'sleeplikegoldilocks.txt': file('sleeplikegoldilocks.txt', ['sleeplikegoldilocks.com — a side project.', 'Just right.']),
    }),
});
```

Note: when writing these files for real, type the emoji/box characters directly (👋 🚀 🔭 🌱 👯 🤔 💬 ● ✊ —) rather than the escape sequences shown here — the escapes are only for this plan document.

- [ ] **Step 3: Write tectoniq.js**

```js
// src/content/tectoniq.js
import { fileType } from '../helpers/utils';

const file = (name, content) =>
    ({ type: fileType.regular, name, content, longView: 'r--' });

export const tectoniqFs = {
    type: fileType.dir,
    name: '~',
    longView: 'r-x',
    children: {
        'about.txt': file('about.txt', [
            'TectoniQ — better early talent decisions start here.',
            'An independent venture (no, not a Gamma Data thing).',
            '',
            'We pair strategic talent advisory with TIQ, our unified',
            'talent intelligence platform, across the early-talent',
            'lifecycle: Attract, Match, Assess, Recruit, Develop, Perform.',
            '',
            'https://tectoniq.com.au',
        ]),
        'team.txt': file('team.txt', [
            'Paula Gepp        Co-Founder, Director of Strategy & Operations',
            'David Cvetkovski  Co-Founder, Director of Strategy & Customer Engagement',
            'Tom Klimovski     Co-Founder, Director of Technology',
            'Mark Stella       Co-Founder, Director of Data & Architecture',
        ]),
    },
};
```

- [ ] **Step 4: Verify it compiles (tests still green, build unaffected)**

Run: `CI=true yarn test --watchAll=false`
Expected: all suites from Tasks 1–4 pass; new files are unimported so nothing else changes.

- [ ] **Step 5: Commit**

```bash
git add src/content/eggs.js src/content/fs.js src/content/tectoniq.js
git commit -m "feat(content): virtual fs trees and easter-egg copy"
```

---

### Task 6: The wiring — ShellContext, themes, App, Prompt, CommandBox, core commands

This is the turn-the-key task: everything from Tasks 1–5 gets connected, `home.js` dies, and the site gains cd/pwd/dirs/history/tab. It ends with a working build.

**Files:**
- Create: `src/helpers/shell/ShellContext.js`
- Modify: `src/styles/_themes.js`
- Modify: `src/App.js`
- Modify: `src/components/Prompt.js` (full rewrite shown)
- Modify: `src/components/CommandBox.js` (full rewrite shown)
- Modify: `src/helpers/commands/actions.js` (full rewrite shown)
- Modify: `src/components/output/LsOutput.js:49` (dir trailing slash)
- Delete: `src/content/home.js`

**Interfaces:**
- Consumes: everything produced by Tasks 1–5.
- Produces:
  - `ShellProvider`, `useShell() => { state, active, fsRoot, actions }` where `active` is the top session, `fsRoot` its fs tree, and `actions = { pushSession, popSession, setCwd, addHistory, setCrt, markBootPlayed, startProgram, exitProgram }` (localStorage side effects live in `setCrt`/`markBootPlayed`).
  - `TECTONIQ_SESSION` export (used by `ssh` in Task 11).
  - `themes` map export from `_themes.js`: `{ dark, tectoniq }`.
  - Command handler contract: `(args, shell) => ReactElement | { program: { Component, andThen? } } | null`, where `shell = { cwd, fsRoot, sessions, history, crt, setCwd, pushSession, popSession, setCrt }`.
  - `COMMAND_NAMES` export from actions.js (for completion): `[...Object.keys(actions), 'clear', 'reboot']` — reboot joins the map in Task 8; include it in the list now so completion doesn't change later.
  - Prompt handles `result.program` with an `andThen` chain: `'reboot'` → run Boot program then clear; `'clear'` → clear after exit. (Boot arrives in Task 8; until then Prompt imports nothing for it — the chain switch lives in a `runProgram` helper whose `'reboot'` branch is added in Task 8. In this task only the plain-program and `'clear'` branches exist.)

- [ ] **Step 1: Add the TectoniQ theme and themes map**

```js
// src/styles/_themes.js  (full replacement)
export const darkMode = {
    colors: {
        backgroundColor: '#3a3335',
        white: '#ffffff',
        fireOpal: '#eb5e55',
        ruby: '#d81e5b',
        papayaWhip: '#fdf0d5',
        opal: '#c6d8d3',
    }
}

export const tectoniqMode = {
    colors: {
        backgroundColor: '#0b1220',
        white: '#e8f1ff',
        fireOpal: '#4fb3ff',
        ruby: '#39d0c3',
        papayaWhip: '#ffd166',
        opal: '#7f9cc0',
    }
}

export const themes = {
    dark: darkMode,
    tectoniq: tectoniqMode,
}
```

- [ ] **Step 2: Write ShellContext**

```js
// src/helpers/shell/ShellContext.js
import { createContext, useContext, useReducer, useMemo } from 'react';
import { shellReducer, initShellState } from './shellReducer';
import { homeFs } from '../../content/fs';
import { tectoniqFs } from '../../content/tectoniq';

export const TECTONIQ_SESSION = {
    user: 'tiq',
    host: 'tectoniq.com.au',
    fsName: 'tectoniq',
    themeName: 'tectoniq',
    cwd: ['~'],
};

const FS_ROOTS = {
    home: homeFs,
    tectoniq: tectoniqFs,
};

const storage = {
    get(key) {
        try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
        try { window.localStorage.setItem(key, value); } catch (e) { /* private browsing */ }
    },
};

const ShellContext = createContext(null);

export function ShellProvider({ children }) {
    const [state, dispatch] = useReducer(shellReducer, {
        crt: storage.get('klimovski.crt') === '1',
        bootPlayed: storage.get('klimovski.bootPlayed') === '1',
    }, initShellState);

    const actions = useMemo(() => ({
        pushSession: (session) => dispatch({ type: 'PUSH_SESSION', session }),
        popSession: () => dispatch({ type: 'POP_SESSION' }),
        setCwd: (cwd) => dispatch({ type: 'SET_CWD', cwd }),
        addHistory: (line) => dispatch({ type: 'ADD_HISTORY', line }),
        startProgram: (program) => dispatch({ type: 'START_PROGRAM', program }),
        exitProgram: () => dispatch({ type: 'EXIT_PROGRAM' }),
        setCrt: (on) => {
            storage.set('klimovski.crt', on ? '1' : '0');
            dispatch({ type: 'SET_CRT', on });
        },
        markBootPlayed: () => {
            storage.set('klimovski.bootPlayed', '1');
            dispatch({ type: 'MARK_BOOT_PLAYED' });
        },
    }), []);

    const active = state.sessions[state.sessions.length - 1];
    const value = { state, actions, active, fsRoot: FS_ROOTS[active.fsName] };

    return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export const useShell = () => useContext(ShellContext);
```

- [ ] **Step 3: Rewrite actions.js with the shell contract and core commands**

```js
// src/helpers/commands/actions.js  (full replacement)
import TxtOutput from '../../components/output/TxtOutput';
import LsOutput from '../../components/output/LsOutput';
import { fileType } from '../utils';
import { resolvePath, getNode, formatPath } from './fsUtils';

const txt = (lines) => <TxtOutput lines={lines} />;
const needsArg = (cmd) => txt([`'${cmd}' needs an argument.`]);
const noSuchFile = (file) => txt([`No such file: '${file}'.`]);

const ls = (args, shell) => {
    let showAll = false;
    let long = false;
    const targets = [];
    for (const a of args) {
        if (a.startsWith('-')) {
            for (const ch of a.slice(1)) {
                if (ch === 'a') showAll = true;
                else if (ch === 'l') long = true;
                else return txt([`ls: invalid option -- '${ch}'`]);
            }
        } else {
            targets.push(a);
        }
    }
    if (targets.length > 1) {
        return txt([`'ls' takes a single path.`]);
    }
    const path = resolvePath(shell.cwd, targets[0] || '.');
    const node = getNode(shell.fsRoot, path);
    if (!node) {
        return txt([`No such file or directory: '${targets[0]}'`]);
    }
    const list = node.type === fileType.dir
        ? Object.values(node.children).filter((f) => showAll || !f.hidden)
        : [node];
    return <LsOutput longOption={long} files={list} />;
};

const cd = (args, shell) => {
    const path = resolvePath(shell.cwd, args[0] || '~');
    const node = getNode(shell.fsRoot, path);
    if (!node) {
        return txt([`cd: no such file or directory: ${args[0]}`]);
    }
    if (node.type !== fileType.dir) {
        return txt([`cd: not a directory: ${args[0]}`]);
    }
    shell.setCwd(path);
    return null;
};

const pwd = (args, shell) => txt([formatPath(shell.cwd)]);

const cat = (args, shell) => {
    if (!args || args.length === 0) {
        return needsArg('cat');
    }
    const path = resolvePath(shell.cwd, args[0]);
    const node = getNode(shell.fsRoot, path);
    if (!node) {
        return noSuchFile(args[0]);
    }
    if (node.type === fileType.dir) {
        return txt([`cat: ${args[0]}: Is a directory`]);
    }
    return txt(node.content);
};

const sh = (args, shell) => {
    if (!args || args.length === 0) {
        return needsArg('sh');
    }
    const path = resolvePath(shell.cwd, args[0]);
    const node = getNode(shell.fsRoot, path);
    if (!node) {
        return noSuchFile(args[0]);
    }
    if (node.type !== fileType.exec) {
        return txt([`'${args[0]}' is not an executable file.`]);
    }
    return node.run(args);
};

const whoami = (args, shell) => {
    const count = shell.history.filter((h) => h.trim().split(/\s+/)[0].toLowerCase() === 'whoami').length;
    if (count <= 1) return txt(['guest']);
    if (count === 2) return txt(['guest (still)']);
    return txt(["ok fine: you're tom's favourite visitor"]);
};

const historyCmd = (args, shell) =>
    txt(shell.history.map((h, i) => `  ${String(i + 1).padStart(3)}  ${h}`));

const help = () => txt([
    'ls [-la] [path] · cd <dir> · pwd · cat <file>: look around',
    'sh <file> or ./<file>: run executables',
    'history · whoami · clear: housekeeping',
    'tab completes · arrows recall history',
    "...the rest you'll have to discover yourself.",
]);

const actions = {
    'ls': ls,
    'cd': cd,
    'pwd': pwd,
    'cat': cat,
    'sh': sh,
    'whoami': whoami,
    'history': historyCmd,
    'help': help,
};

export const COMMAND_NAMES = [...Object.keys(actions), 'clear', 'reboot'];

export default actions;
```

(`whoami` counts occurrences in history; the current invocation is already in history when the action runs — CommandBox adds the line before dispatching the command, see Step 5 — hence `count <= 1` for the first run.)

- [ ] **Step 4: Rewrite Prompt.js**

```js
// src/components/Prompt.js  (full replacement)
import styled from '@emotion/styled';
import { useState, useEffect } from 'react';

import { regularLightTextStyle, regularTextStyle } from '../styles/_typographies';
import CommandBox from './CommandBox';
import actions from '../helpers/commands/actions';
import { genUuid } from '../helpers/utils';
import { formatPath } from '../helpers/commands/fsUtils';
import { useShell } from '../helpers/shell/ShellContext';

const UserHostDiv = styled.div`
    color: ${(props) => props.theme.colors.ruby};
`;

const DirDiv = styled.div`
    color: ${(props) => props.theme.colors.papayaWhip};
`;

const ShellPromptDiv = styled.div`
    color: ${(props) => props.theme.colors.white};
`;

const NotFoundDiv = styled.div`
    padding-left: 10px;
    color: ${(props) => props.theme.colors.white};
    ${regularLightTextStyle};
`;

const PromptDiv = styled.div`
    display: flex;
    height: 32px;
    align-items: center;
    justify-content: left;
    padding-left: 10px;
    gap: 10px;
    ${regularTextStyle};
`;

const PromptsContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: left;
`;

function Prompt({ user, host, dir, setClear, setRenderNext }) {
    const [cmd, setCmd] = useState({});
    const [output, setOutput] = useState();
    const shellCtx = useShell();

    useEffect(() => {
        if (!cmd.command) return;
        const { state, actions: shellActions, active, fsRoot } = shellCtx;

        const shell = {
            cwd: active.cwd,
            fsRoot,
            sessions: state.sessions,
            history: state.history,
            crt: state.crt,
            setCwd: shellActions.setCwd,
            pushSession: shellActions.pushSession,
            popSession: shellActions.popSession,
            setCrt: shellActions.setCrt,
        };

        const runProgram = (prog) => {
            shellActions.startProgram({
                name: prog.Component.name,
                Component: prog.Component,
                onExit: (farewell) => {
                    if (farewell) setOutput(farewell);
                    if (prog.andThen === 'clear') setClear(true);
                    setRenderNext(true);
                },
            });
        };

        if (cmd.command === 'clear') {
            setClear(true);
            setRenderNext(true);
            return;
        }
        if (actions[cmd.command]) {
            const result = actions[cmd.command](cmd.args, shell);
            if (result && result.program) {
                runProgram(result.program);
                return; // renderNext fires when the program exits
            }
            setOutput(result);
        } else {
            setOutput(
                <NotFoundDiv>
                    Command not found : '{cmd.command}'. Type 'help' for available commands.
                </NotFoundDiv>
            );
        }
        setRenderNext(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cmd]);

    return (
        <>
        <PromptDiv>
            <UserHostDiv>{user}@{host}</UserHostDiv>
            <DirDiv>{dir}</DirDiv>
            <ShellPromptDiv>%</ShellPromptDiv>
            <CommandBox setCmd={setCmd} />
        </PromptDiv>
        <div>
            {output}
        </div>
        </>
    );
}

function Prompts() {
    const [renderNext, setRenderNext] = useState(false);
    const [clear, setClear] = useState(false);
    const { active } = useShell();

    const nextPrompt = () => ({
        key: genUuid(),
        user: active.user,
        host: active.host,
        dir: formatPath(active.cwd),
    });

    const [prompts, setPrompts] = useState([{
        key: 'first',
        user: 'guest',
        host: 'internet',
        dir: '~',
    }]);

    useEffect(() => {
        if (renderNext) {
            setRenderNext(false);
            if (clear) {
                setClear(false);
                setPrompts([nextPrompt()]);
                return;
            }
            setPrompts((prev) => prev.concat(nextPrompt()));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renderNext]);

    return (
        <PromptsContainer>
            {prompts.map((prompt) => (
                <Prompt
                    key={prompt.key}
                    user={prompt.user}
                    host={prompt.host}
                    dir={prompt.dir}
                    setClear={setClear}
                    setRenderNext={setRenderNext}
                />
            ))}
        </PromptsContainer>
    );
}

export default Prompts;
```

Notes: `setUser`/`setDir` props are gone (dead code); each new row snapshots the active session at append time, so `cd` and `ssh` change subsequent rows only. The `runProgram` chain handles `'clear'`; the `'reboot'` chain branch is added in Task 8 alongside Boot.

- [ ] **Step 5: Rewrite CommandBox.js (history, tab, program-aware)**

```js
// src/components/CommandBox.js  (full replacement)
import styled from '@emotion/styled';
import { useState, useRef, useEffect } from 'react';

import { regularTextStyle } from '../styles/_typographies';
import parseCommand from '../helpers/commands/parser';
import { complete } from '../helpers/commands/completion';
import { getNode } from '../helpers/commands/fsUtils';
import { COMMAND_NAMES } from '../helpers/commands/actions';
import { useShell } from '../helpers/shell/ShellContext';

const CommandInput = styled.input`
    flex: 1;
    border: none;
    display: flex;
    align-items: center;
    caret-color: ${(props) => props.theme.colors.opal};
    background-color: ${(props) => props.theme.colors.backgroundColor};
    color: ${(props) => props.theme.colors.white};
    &:focus {
        outline: none;
    }
    ${regularTextStyle};
`;

function CommandBox({ setCmd }) {
    const [disabled, setDisabled] = useState(false);
    const [commandValue, setCommandValue] = useState('');
    const [histIdx, setHistIdx] = useState(null);
    const inputRef = useRef(null);
    const { state, actions, active, fsRoot } = useShell();
    const programActive = !!state.program;

    // refocus when a program releases the terminal
    useEffect(() => {
        if (!programActive && !disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [programActive, disabled]);

    const onChange = (e) => {
        setCommandValue(e.target.value);
        setHistIdx(null);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            actions.addHistory(commandValue.trim());
            setCmd(parseCommand(commandValue));
            setDisabled(true);
            return;
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            const cwdNode = getNode(fsRoot, active.cwd);
            const entries = cwdNode && cwdNode.children ? Object.keys(cwdNode.children) : [];
            const completed = complete(commandValue, COMMAND_NAMES, entries);
            if (completed) setCommandValue(completed);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const h = state.history;
            if (h.length === 0) return;
            const idx = histIdx === null ? h.length - 1 : Math.max(0, histIdx - 1);
            setHistIdx(idx);
            setCommandValue(h[idx]);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const h = state.history;
            if (histIdx === null) return;
            const idx = histIdx + 1;
            if (idx >= h.length) {
                setHistIdx(null);
                setCommandValue('');
            } else {
                setHistIdx(idx);
                setCommandValue(h[idx]);
            }
            return;
        }
        if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            actions.addHistory('clear');
            setCmd(parseCommand('clear'));
            setDisabled(true);
        }
    };

    return (
        <CommandInput
            ref={inputRef}
            autoFocus
            spellCheck={false}
            value={commandValue}
            disabled={disabled || programActive}
            onChange={onChange}
            onKeyDown={onKeyDown}
        />
    );
}

export default CommandBox;
```

- [ ] **Step 6: Restructure App.js around the provider**

```js
// src/App.js  (full replacement)
import { ThemeProvider, Global } from '@emotion/react';
import { themes } from './styles/_themes';
import { globalCss } from './styles/_globalStyles';
import './styles/globals.css';

import TitleBar from './components/TitleBar';
import Clock from './components/Clock';
import Prompts from './components/Prompt';
import { ShellProvider, useShell } from './helpers/shell/ShellContext';

function ThemedShell() {
    const { state, actions, active } = useShell();
    const program = state.program;
    const Program = program ? program.Component : null;

    const handleProgramExit = (farewell) => {
        const onExit = program && program.onExit;
        actions.exitProgram();
        if (onExit) onExit(farewell);
    };

    return (
        <ThemeProvider theme={themes[active.themeName]}>
            <Global styles={globalCss} />
            <TitleBar />
            <Clock />
            <Prompts />
            {Program ? <Program exit={handleProgramExit} /> : null}
        </ThemeProvider>
    );
}

function App() {
    return (
        <ShellProvider>
            <ThemedShell />
        </ShellProvider>
    );
}

export default App;
```

- [ ] **Step 7: LsOutput — trailing slash on directories**

In `src/components/output/LsOutput.js`, change the item render line (currently `{file.name}`) to:

```js
{file.name}{file.type === fileType.dir ? '/' : ''}
```

- [ ] **Step 8: Delete home.js**

```bash
git rm src/content/home.js
```

`actions.js` no longer imports it (Step 3 replaced the import with `fs.js` usage via the shell adapter). Search for stragglers: `grep -rn "content/home" src/` must return nothing.

- [ ] **Step 9: Run all tests, then a production build**

Run: `CI=true yarn test --watchAll=false`
Expected: all suites pass.

Run: `NODE_OPTIONS=--openssl-legacy-provider yarn build`
Expected: `Compiled successfully.` (react-scripts 4 may print `Compiled with warnings` for pre-existing lint warnings — acceptable; errors are not.)

- [ ] **Step 10: Manual smoke test**

Run the dev server (`NODE_OPTIONS=--openssl-legacy-provider yarn start`) or use the built app. Verify: `ls` shows `projects/` colored as a dir; `ls -la` reveals `.plan` and `.secrets/`; `cd projects` + `pwd` → `~/projects`, prompt dir updates on the next row; `cat epicarc.txt` works; `cat ~/.plan` works from anywhere; up-arrow recalls; Tab completes `cat ab` → `cat about.txt`; `sh cowsay "Hello World"` prints mixed case; `clear` works; unknown command message unchanged.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(shell): session-stack shell core with dirs, history, and tab completion"
```

---

### Task 7: One-shot easter eggs — sudo, fortune, git, exit, neofetch

**Files:**
- Create: `src/components/output/NeofetchOutput.js`
- Modify: `src/helpers/commands/actions.js` (add handlers + registry entries)

**Interfaces:**
- Consumes: `FORTUNES`, `CAREER_LOG`, `NEOFETCH_ART`, `NEOFETCH_INFO` from `src/content/eggs.js`; shell adapter (`sessions`, `popSession`).
- Produces: commands `sudo`, `fortune`, `git`, `exit`, `neofetch` in the actions map (COMMAND_NAMES picks them up automatically).

- [ ] **Step 1: Write NeofetchOutput**

```js
// src/components/output/NeofetchOutput.js
import styled from '@emotion/styled';

import { regularLightTextStyle } from '../../styles/_typographies';

const Row = styled.div`
    display: flex;
    flex-direction: row;
    gap: 30px;
    padding-left: 10px;
    align-items: flex-start;
    flex-wrap: wrap;
`;

const Art = styled.pre`
    color: ${(props) => props.theme.colors.fireOpal};
    margin: 0;
    line-height: 1.15;
    ${regularLightTextStyle};
`;

const Info = styled.div`
    color: ${(props) => props.theme.colors.white};
    ${regularLightTextStyle};
`;

const Label = styled.span`
    color: ${(props) => props.theme.colors.ruby};
`;

export default function NeofetchOutput({ art, info, title }) {
    return (
        <Row>
            <Art>{art.join('\n')}</Art>
            <Info>
                <div><Label>{title}</Label></div>
                <div>{'-'.repeat(title.length)}</div>
                {info.map(([label, value]) => (
                    <div key={label}><Label>{label}:</Label> {value}</div>
                ))}
            </Info>
        </Row>
    );
}
```

- [ ] **Step 2: Add the handlers to actions.js**

Add these imports at the top of `src/helpers/commands/actions.js`:

```js
import NeofetchOutput from '../../components/output/NeofetchOutput';
import { FORTUNES, CAREER_LOG, NEOFETCH_ART, NEOFETCH_INFO } from '../../content/eggs';
```

Add these handlers above the `actions` map:

```js
const sudo = (args) => {
    if (!args || args.length === 0) {
        return txt(['usage: sudo <command>']);
    }
    if (args.join(' ').toLowerCase() === 'make me a sandwich') {
        return txt(['Okay.']);
    }
    return txt(['guest is not in the sudoers file.', 'This incident will be reported.']);
};

const fortune = () =>
    txt([FORTUNES[Math.floor(Math.random() * FORTUNES.length)]]);

const git = (args) => {
    const sub = args[0];
    if (sub === 'log') return txt(CAREER_LOG);
    if (sub === 'status') {
        return txt(['HEAD detached at a beach somewhere', 'nothing to commit, working life clean']);
    }
    if (sub === 'push') return txt(['Everything up-to-date (life)']);
    return txt(["git: try 'git log'"]);
};

const exitCmd = (args, shell) => {
    if (shell.sessions.length > 1) {
        const host = shell.sessions[shell.sessions.length - 1].host;
        shell.popSession();
        return txt([`Connection to ${host} closed.`]);
    }
    return txt(['There is no escape.', "(If you're feeling brave, try 'rm -rf /'.)"]);
};

const neofetch = (args, shell) => {
    const user = shell.sessions[shell.sessions.length - 1].user;
    return (
        <NeofetchOutput
            art={NEOFETCH_ART}
            info={NEOFETCH_INFO}
            title={`${user}@klimovski.io`}
        />
    );
};
```

Add to the `actions` map:

```js
    'sudo': sudo,
    'fortune': fortune,
    'git': git,
    'exit': exitCmd,
    'neofetch': neofetch,
```

- [ ] **Step 3: Verify**

Run: `CI=true yarn test --watchAll=false` — all pass.
Manual: `sudo ls` scolds; `sudo make me a sandwich` → `Okay.`; `fortune` varies; `git log` shows the career; `exit` refuses; `neofetch` renders art beside the card; `help` still doesn't mention any of them.

- [ ] **Step 4: Commit**

```bash
git add src/components/output/NeofetchOutput.js src/helpers/commands/actions.js
git commit -m "feat(eggs): sudo, fortune, git log career, exit gag, neofetch"
```

---

### Task 8: Program plumbing proof — Boot, reboot, first-visit wiring

**Files:**
- Create: `src/components/programs/Boot.js`
- Modify: `src/components/Prompt.js` (add `'reboot'` chain branch to `runProgram`)
- Modify: `src/helpers/commands/actions.js` (add `reboot` command)
- Modify: `src/App.js` (first-visit auto-boot)

**Interfaces:**
- Consumes: `BOOT_LINES` from eggs.js; program contract `Component({exit})`; `state.bootPlayed`, `actions.markBootPlayed`, `actions.startProgram`.
- Produces: `Boot` default export; `reboot` action returning `{ program: { Component: Boot, andThen: 'clear' } }`; Prompt's `runProgram` understands `andThen: 'reboot'` (used by Meltdown in Task 10): on exit it launches Boot with `andThen:'clear'` instead of finishing.

- [ ] **Step 1: Write Boot.js**

```js
// src/components/programs/Boot.js
import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';

import { regularLightTextStyle } from '../../styles/_typographies';
import { BOOT_LINES } from '../../content/eggs';

const Screen = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10;
    padding: 24px;
    background-color: ${(props) => props.theme.colors.backgroundColor};
    color: ${(props) => props.theme.colors.opal};
    white-space: pre-wrap;
    ${regularLightTextStyle};
`;

const LINE_MS = 280;

export default function Boot({ exit }) {
    const reduced = typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const [shown, setShown] = useState(reduced ? BOOT_LINES.length : 0);
    const exitedRef = useRef(false);

    const finish = () => {
        if (exitedRef.current) return;
        exitedRef.current = true;
        exit();
    };

    useEffect(() => {
        const timers = [];
        if (reduced) {
            timers.push(setTimeout(finish, 500));
        } else {
            for (let i = 1; i <= BOOT_LINES.length; i++) {
                timers.push(setTimeout(() => setShown(i), i * LINE_MS));
            }
            timers.push(setTimeout(finish, BOOT_LINES.length * LINE_MS + 400));
        }
        const skip = () => finish();
        document.addEventListener('keydown', skip);
        document.addEventListener('touchstart', skip);
        return () => {
            timers.forEach(clearTimeout);
            document.removeEventListener('keydown', skip);
            document.removeEventListener('touchstart', skip);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Screen>
            {BOOT_LINES.slice(0, shown).join('\n')}
        </Screen>
    );
}
```

- [ ] **Step 2: Teach Prompt's runProgram the reboot chain**

In `src/components/Prompt.js`, add the import:

```js
import Boot from './programs/Boot';
```

and replace the `runProgram` helper with:

```js
        const runProgram = (prog) => {
            shellActions.startProgram({
                name: prog.Component.name,
                Component: prog.Component,
                onExit: (farewell) => {
                    if (prog.andThen === 'reboot') {
                        runProgram({ Component: Boot, andThen: 'clear' });
                        return;
                    }
                    if (farewell) setOutput(farewell);
                    if (prog.andThen === 'clear') setClear(true);
                    setRenderNext(true);
                },
            });
        };
```

- [ ] **Step 3: Add the reboot command**

In `src/helpers/commands/actions.js`, add:

```js
import Boot from '../../components/programs/Boot';

const reboot = () => ({ program: { Component: Boot, andThen: 'clear' } });
```

and register `'reboot': reboot,` in the actions map. Remove `'reboot'` from the extras in `COMMAND_NAMES` (it's now a real key):

```js
export const COMMAND_NAMES = [...Object.keys(actions), 'clear'];
```

- [ ] **Step 4: First-visit auto-boot in App.js**

In `ThemedShell` (src/App.js), add:

```js
import { useEffect, useRef } from 'react';
```

and inside the component:

```js
    const bootLaunched = useRef(false);
    useEffect(() => {
        if (!state.bootPlayed && !bootLaunched.current) {
            bootLaunched.current = true;
            actions.startProgram({
                name: 'boot',
                Component: Boot,
                onExit: () => actions.markBootPlayed(),
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
```

with `import Boot from './components/programs/Boot';` at the top. Also call `actions.markBootPlayed()` inside the `reboot`-launched path? No — `reboot` is manual replay; only the first-visit path marks the flag.

- [ ] **Step 5: Verify**

Run: `CI=true yarn test --watchAll=false` — all pass.
Manual: clear localStorage (`localStorage.clear()` in devtools) and reload → boot plays once, any key skips, prompt is focused after; reload again → no boot; `reboot` → boot plays then screen clears to a single fresh prompt; input is inert during boot.

- [ ] **Step 6: Commit**

```bash
git add src/components/programs/Boot.js src/components/Prompt.js src/helpers/commands/actions.js src/App.js
git commit -m "feat(retro): boot sequence program, first-visit wiring, reboot command"
```

---

### Task 9: vim — the trap

**Files:**
- Create: `src/components/programs/Vim.js`
- Modify: `src/helpers/commands/actions.js` (add `vim`/`vi`)

**Interfaces:**
- Consumes: program contract; `TxtOutput` for the farewell.
- Produces: `vim` and `vi` commands returning `{ program: { Component: Vim } }`. On `:q!` the program exits with farewell `You escaped vim after Ns. Not everyone does.`

- [ ] **Step 1: Write Vim.js**

```js
// src/components/programs/Vim.js
import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';

import { regularLightTextStyle } from '../../styles/_typographies';
import TxtOutput from '../output/TxtOutput';

const Screen = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    background-color: ${(props) => props.theme.colors.backgroundColor};
    color: ${(props) => props.theme.colors.white};
    ${regularLightTextStyle};
`;

const Buffer = styled.div`
    flex: 1;
    padding: 8px 12px;
    overflow: hidden;
    white-space: pre-wrap;
`;

const Tilde = styled.div`
    color: ${(props) => props.theme.colors.opal};
`;

const StatusLine = styled.div`
    background-color: ${(props) => props.theme.colors.papayaWhip};
    color: ${(props) => props.theme.colors.backgroundColor};
    padding: 0 12px;
`;

const CmdLine = styled.div`
    padding: 0 12px;
    min-height: 28px;
`;

const TILDE_ROWS = 22;

export default function Vim({ exit }) {
    const [text, setText] = useState('');
    const [insert, setInsert] = useState(false);
    const [cmdBuf, setCmdBuf] = useState('');
    const [message, setMessage] = useState('');
    const startRef = useRef(Date.now());

    useEffect(() => {
        const onKey = (e) => {
            e.preventDefault();
            const key = e.key;

            if (insert) {
                if (key === 'Escape') { setInsert(false); return; }
                if (key === 'Backspace') { setText((t) => t.slice(0, -1)); return; }
                if (key === 'Enter') { setText((t) => t + '\n'); return; }
                if (key.length === 1 && !e.ctrlKey && !e.metaKey) { setText((t) => t + key); }
                return;
            }

            if (cmdBuf) {
                if (key === 'Escape') { setCmdBuf(''); return; }
                if (key === 'Backspace') { setCmdBuf((c) => c.slice(0, -1)); return; }
                if (key === 'Enter') {
                    const c = cmdBuf;
                    setCmdBuf('');
                    if (c === ':q!') {
                        const secs = Math.round((Date.now() - startRef.current) / 1000);
                        exit(<TxtOutput lines={[`You escaped vim after ${secs}s. Not everyone does.`]} />);
                        return;
                    }
                    if (c === ':q') { setMessage('E37: No write since last change (add ! to override)'); return; }
                    if (c === ':w' || c === ':wq' || c === ':x') { setMessage("E45: 'readonly' option is set (add ! to override)"); return; }
                    setMessage(`E492: Not an editor command: ${c.slice(1)}`);
                    return;
                }
                if (key.length === 1 && !e.ctrlKey && !e.metaKey) { setCmdBuf((c) => c + key); }
                return;
            }

            if (key === ':') { setMessage(''); setCmdBuf(':'); return; }
            if (key === 'i') { setMessage(''); setInsert(true); return; }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [insert, cmdBuf, exit]);

    return (
        <Screen>
            <Buffer>
                {text}
                {Array.from({ length: TILDE_ROWS }, (_, i) => <Tilde key={i}>~</Tilde>)}
            </Buffer>
            <StatusLine>"~/thoughts.txt" [New File]{insert ? '  -- INSERT --' : ''}</StatusLine>
            <CmdLine>{cmdBuf || message || '(hint for the trapped: it rhymes with "colon q bang")'}</CmdLine>
        </Screen>
    );
}
```

- [ ] **Step 2: Register vim/vi**

In `src/helpers/commands/actions.js`:

```js
import Vim from '../../components/programs/Vim';

const vim = () => ({ program: { Component: Vim } });
```

and in the map:

```js
    'vim': vim,
    'vi': vim,
```

- [ ] **Step 3: Verify**

Run: `CI=true yarn test --watchAll=false` — all pass.
Manual: `vim` opens the trap; `i` shows `-- INSERT --` and typing appears; Escape leaves insert; `:wq` scolds; `:q` scolds harder; `:q!` exits and prints the escape time; the shell prompt returns focused.

- [ ] **Step 4: Commit**

```bash
git add src/components/programs/Vim.js src/helpers/commands/actions.js
git commit -m "feat(eggs): vim trap with :q! escape"
```

---

### Task 10: cmatrix and snake

**Files:**
- Create: `src/components/programs/Cmatrix.js`
- Create: `src/components/programs/Snake.js`
- Modify: `src/helpers/commands/actions.js` (register both)

**Interfaces:**
- Consumes: program contract; `TxtOutput` for snake's farewell.
- Produces: `cmatrix` and `snake` commands returning `{ program: { Component } }`. Snake exits with `snake: game over — N pipelines eaten.`

- [ ] **Step 1: Write Cmatrix.js**

```js
// src/components/programs/Cmatrix.js
import styled from '@emotion/styled';
import { useEffect, useRef } from 'react';

const Screen = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10;
    background-color: #000;
`;

const CHARS = 'アイウエオカキクケコサシスセソABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&';

export default function Cmatrix({ exit }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        const fontSize = 16;
        const cols = Math.floor(canvas.width / fontSize);
        const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -40));

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const interval = setInterval(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff41';
            ctx.font = `${fontSize}px RobotoMono, monospace`;
            for (let i = 0; i < drops.length; i++) {
                const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
                ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }, 60);

        const onKey = (e) => { e.preventDefault(); exit(); };
        document.addEventListener('keydown', onKey);
        document.addEventListener('touchstart', onKey);
        return () => {
            clearInterval(interval);
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('touchstart', onKey);
        };
    }, [exit]);

    return <Screen><canvas ref={canvasRef} /></Screen>;
}
```

- [ ] **Step 2: Write Snake.js**

```js
// src/components/programs/Snake.js
import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';

import { regularLightTextStyle } from '../../styles/_typographies';
import TxtOutput from '../output/TxtOutput';

const Screen = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background-color: ${(props) => props.theme.colors.backgroundColor};
    color: ${(props) => props.theme.colors.opal};
    ${regularLightTextStyle};
`;

const CELL = 20;
const COLS = 24;
const ROWS = 16;
const TICK_MS = 120;

export default function Snake({ exit }) {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = COLS * CELL;
        canvas.height = ROWS * CELL;
        const ctx = canvas.getContext('2d');

        let snake = [{ x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }];
        let dir = { x: 1, y: 0 };
        let nextDir = dir;
        let food = { x: 15, y: 8 };
        let points = 0;
        let alive = true;

        const placeFood = () => {
            do {
                food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
            } while (snake.some((s) => s.x === food.x && s.y === food.y));
        };

        const gameOver = () => {
            alive = false;
            exit(<TxtOutput lines={[`snake: game over — ${points} pipeline${points === 1 ? '' : 's'} eaten.`]} />);
        };

        const draw = () => {
            ctx.fillStyle = '#1e1a1b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#eb5e55';
            ctx.fillRect(food.x * CELL + 4, food.y * CELL + 4, CELL - 8, CELL - 8);
            ctx.fillStyle = '#c6d8d3';
            snake.forEach((s) => ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2));
        };

        const tick = () => {
            if (!alive) return;
            dir = nextDir;
            const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
            if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS
                || snake.some((s) => s.x === head.x && s.y === head.y)) {
                gameOver();
                return;
            }
            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
                points++;
                setScore(points);
                placeFood();
            } else {
                snake.pop();
            }
            draw();
        };

        draw();
        const interval = setInterval(tick, TICK_MS);

        const onKey = (e) => {
            const k = e.key;
            if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
                e.preventDefault();
            }
            if (k === 'ArrowUp' && dir.y === 0) nextDir = { x: 0, y: -1 };
            else if (k === 'ArrowDown' && dir.y === 0) nextDir = { x: 0, y: 1 };
            else if (k === 'ArrowLeft' && dir.x === 0) nextDir = { x: -1, y: 0 };
            else if (k === 'ArrowRight' && dir.x === 0) nextDir = { x: 1, y: 0 };
            else if (k === 'q' || k === 'Escape') gameOver();
        };
        document.addEventListener('keydown', onKey);
        return () => {
            clearInterval(interval);
            document.removeEventListener('keydown', onKey);
        };
    }, [exit]);

    return (
        <Screen>
            <div>snake — pipelines eaten: {score}</div>
            <canvas ref={canvasRef} />
            <div>arrows to steer · q to quit · best with a keyboard</div>
        </Screen>
    );
}
```

(Write the `—`/`·` as real `—`/`·` characters in the JSX text.)

- [ ] **Step 3: Register both**

In `src/helpers/commands/actions.js`:

```js
import Cmatrix from '../../components/programs/Cmatrix';
import Snake from '../../components/programs/Snake';

const cmatrix = () => ({ program: { Component: Cmatrix } });
const snake = () => ({ program: { Component: Snake } });
```

Map entries: `'cmatrix': cmatrix,` and `'snake': snake,`.

- [ ] **Step 4: Verify**

Run: `CI=true yarn test --watchAll=false` — all pass.
Manual: `cmatrix` rains, any key exits; `snake` plays, eats, dies on wall/self, `q` quits, farewell prints the score; arrows don't scroll the page during play.

- [ ] **Step 5: Commit**

```bash
git add src/components/programs/Cmatrix.js src/components/programs/Snake.js src/helpers/commands/actions.js
git commit -m "feat(arcade): cmatrix rain and snake"
```

---

### Task 11: rm -rf / — the meltdown

**Files:**
- Create: `src/components/programs/Meltdown.js`
- Modify: `src/helpers/commands/actions.js` (add `rm`)

**Interfaces:**
- Consumes: `MELTDOWN_LINES` from eggs.js; the `andThen: 'reboot'` chain from Task 8.
- Produces: `rm` command. `rm -rf /` (flags `-rf`/`-fr`/`-r -f` in any order, target `/` or `~` or `*`) → `{ program: { Component: Meltdown, andThen: 'reboot' } }`. Any other `rm` → quip.

- [ ] **Step 1: Write Meltdown.js**

```js
// src/components/programs/Meltdown.js
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useEffect, useRef, useState } from 'react';

import { regularLightTextStyle } from '../../styles/_typographies';
import { MELTDOWN_LINES } from '../../content/eggs';

const glitch = keyframes`
    0% { transform: translate(0, 0) skewX(0deg); filter: none; }
    20% { transform: translate(-6px, 2px) skewX(-4deg); filter: invert(1); }
    40% { transform: translate(4px, -3px) skewX(3deg); filter: none; }
    60% { transform: translate(-3px, 1px) skewX(-2deg); filter: invert(1); }
    80% { transform: translate(5px, -2px) skewX(5deg); filter: none; }
    100% { transform: translate(0, 0) skewX(0deg); filter: invert(1); }
`;

const Screen = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10;
    padding: 24px;
    background-color: ${(props) => props.theme.colors.backgroundColor};
    color: ${(props) => props.theme.colors.fireOpal};
    white-space: pre-wrap;
    ${regularLightTextStyle};
    ${({ phase }) => phase === 'glitch' ? `animation: ${'' /* set below */}` : ''}
`;

const GlitchScreen = styled(Screen)`
    animation: ${glitch} 0.12s infinite;
`;

const Halted = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 11;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #000;
    color: ${(props) => props.theme.colors.fireOpal};
    font-size: 40px;
    font-family: RobotoMono;
`;

const LINE_MS = 90;

export default function Meltdown({ exit }) {
    const [shown, setShown] = useState(0);
    const [phase, setPhase] = useState('deleting'); // deleting -> glitch -> halted
    const exitedRef = useRef(false);

    const finish = () => {
        if (exitedRef.current) return;
        exitedRef.current = true;
        exit();
    };

    useEffect(() => {
        const timers = [];
        for (let i = 1; i <= MELTDOWN_LINES.length; i++) {
            timers.push(setTimeout(() => setShown(i), i * LINE_MS));
        }
        const tAll = MELTDOWN_LINES.length * LINE_MS;
        timers.push(setTimeout(() => setPhase('glitch'), tAll + 200));
        timers.push(setTimeout(() => setPhase('halted'), tAll + 900));
        timers.push(setTimeout(finish, tAll + 1800));
        timers.push(setTimeout(finish, 6000)); // failsafe: always reboot
        return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (phase === 'halted') {
        return <Halted>SYSTEM HALTED</Halted>;
    }
    const Comp = phase === 'glitch' ? GlitchScreen : Screen;
    return <Comp>{MELTDOWN_LINES.slice(0, shown).join('\n')}</Comp>;
}
```

Simplification while implementing: the `Screen` template's inline `phase` conditional is vestigial — remove it and keep `Screen` clean; `GlitchScreen` extends it with the animation. The final `Screen` must not reference `phase`.

- [ ] **Step 2: Add rm to actions.js**

```js
import Meltdown from '../../components/programs/Meltdown';

const rm = (args) => {
    const flags = args.filter((a) => a.startsWith('-')).join('');
    const targets = args.filter((a) => !a.startsWith('-'));
    const recursive = flags.includes('r') && flags.includes('f');
    const nuking = targets.some((t) => t === '/' || t === '~' || t === '*' || t === '/*');
    if (recursive && nuking) {
        return { program: { Component: Meltdown, andThen: 'reboot' } };
    }
    if (args.length === 0) return txt(['usage: rm [-rf] <target>']);
    return txt([`rm: cannot remove '${targets[0] || args[0]}': Permission denied (nice try)`]);
};
```

Map entry: `'rm': rm,`.

- [ ] **Step 3: Verify**

Run: `CI=true yarn test --watchAll=false` — all pass.
Manual: `rm -rf /` → deletions scroll, glitch, SYSTEM HALTED, boot sequence, cleared fresh shell; `rm about.txt` → permission quip; `rm` → usage.

- [ ] **Step 4: Commit**

```bash
git add src/components/programs/Meltdown.js src/helpers/commands/actions.js
git commit -m "feat(eggs): rm -rf / meltdown that reboots the site"
```

---

### Task 12: ssh to TectoniQ

**Files:**
- Modify: `src/helpers/commands/actions.js` (add `ssh`)

**Interfaces:**
- Consumes: `TECTONIQ_SESSION` from `src/helpers/shell/ShellContext.js`; `shell.pushSession`; `exit` from Task 7 already pops sessions; theme flip is automatic (App renders `themes[active.themeName]`; new prompt rows snapshot the active session).
- Produces: `ssh` command.

- [ ] **Step 1: Add ssh to actions.js**

```js
import { TECTONIQ_SESSION } from '../shell/ShellContext';

const TECTONIQ_TARGETS = ['tiq@tectoniq.com.au', 'tectoniq', 'tectoniq.com.au'];

const ssh = (args, shell) => {
    if (!args || args.length === 0) {
        return txt(['usage: ssh tiq@tectoniq.com.au']);
    }
    const target = args[0].toLowerCase();
    if (TECTONIQ_TARGETS.includes(target)) {
        if (shell.sessions.length > 1) {
            return txt(["ssh: already connected. 'exit' first."]);
        }
        shell.pushSession(TECTONIQ_SESSION);
        return txt([
            'Connecting to tectoniq.com.au ... connected.',
            'Welcome to TIQ — unified talent intelligence.',
            "Type 'ls' to look around, 'exit' to disconnect.",
        ]);
    }
    return txt([`ssh: connect to host ${target}: Connection refused`]);
};
```

Map entry: `'ssh': ssh,`. (Write `—` as a real `—`.)

Circular-import check: `actions.js` → `ShellContext.js` → `content/fs.js` → `execs.js` → output components only. `execs.js` does not import `actions.js`, so there is no cycle. If CRA still complains, move `TECTONIQ_SESSION` into `shellReducer.js` (which imports nothing) and update the import here and in ShellContext.

- [ ] **Step 2: Verify**

Run: `CI=true yarn test --watchAll=false` — all pass.
Manual: `ssh tectoniq` → banner; next prompt reads `tiq@tectoniq.com.au ~` in the TectoniQ palette (navy background, teal accents); `ls` shows about.txt and team.txt only; `cat about.txt` shows the independent-venture copy; `exit` → "Connection ... closed." and the home theme returns; `exit` again → the no-escape gag; `ssh nsa.gov` → refused.

- [ ] **Step 3: Commit**

```bash
git add src/helpers/commands/actions.js
git commit -m "feat(eggs): ssh into the TectoniQ sub-shell with its own theme"
```

---

### Task 13: CRT mode, README, final gate

**Files:**
- Create: `src/components/CrtOverlay.js`
- Modify: `src/helpers/commands/actions.js` (add `crt`)
- Modify: `src/App.js` (render overlay)
- Modify: `README.md`

**Interfaces:**
- Consumes: `shell.crt`, `shell.setCrt` (persisted via ShellContext).
- Produces: `crt` command; `CrtOverlay` rendered above everything (z-index 30, pointer-events none).

- [ ] **Step 1: Write CrtOverlay.js**

```js
// src/components/CrtOverlay.js
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const flicker = keyframes`
    0% { opacity: 0.97; }
    50% { opacity: 1; }
    100% { opacity: 0.98; }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 30;
    pointer-events: none;
    background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.18) 0px,
        rgba(0, 0, 0, 0.18) 1px,
        transparent 1px,
        transparent 3px
    );
    box-shadow: inset 0 0 140px rgba(0, 0, 0, 0.6);
    animation: ${flicker} 0.12s infinite;
    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

export default function CrtOverlay() {
    return <Overlay />;
}
```

- [ ] **Step 2: Add the crt command**

In `src/helpers/commands/actions.js`:

```js
const crt = (args, shell) => {
    const on = !shell.crt;
    shell.setCrt(on);
    return txt([on ? 'crt: on — welcome to 1987' : 'crt: off — back to the future']);
};
```

Map entry: `'crt': crt,`. (Real `—` characters.)

- [ ] **Step 3: Render the overlay in App.js**

In `ThemedShell`, after the program render:

```js
            {state.crt ? <CrtOverlay /> : null}
```

with `import CrtOverlay from './components/CrtOverlay';`.

- [ ] **Step 4: Update README.md**

Append after the existing content:

```markdown
## Commands

`help` lists the polite ones. The rest — `neofetch`, `fortune`, `git log`,
`sudo`, `vim`, `snake`, `cmatrix`, `crt`, `reboot`, `ssh tiq@tectoniq.com.au`,
and one you really shouldn't run — you'll have to find yourself.

### Development

Node 17+ needs the OpenSSL legacy provider for react-scripts 4:

    NODE_OPTIONS=--openssl-legacy-provider yarn start
    NODE_OPTIONS=--openssl-legacy-provider yarn build
    CI=true yarn test --watchAll=false
```

- [ ] **Step 5: Full verification gate**

Run: `CI=true yarn test --watchAll=false`
Expected: all suites pass (parser, fsUtils, shellReducer, completion).

Run: `NODE_OPTIONS=--openssl-legacy-provider yarn build`
Expected: compiles (warnings acceptable, errors not).

Manual sweep (dev server or build): boot (fresh localStorage) → skippable; `help`; `ls -la`; `cd projects && cat epicarc.txt`; `cat ~/.secrets/dont-tell-anyone.txt`; tab + arrows; `neofetch`; `fortune`; `git log`; `sudo make me a sandwich`; `vim` → `:q!`; `snake`; `cmatrix`; `crt` on and off (persists across reload); `ssh tectoniq` → look around → `exit`; `rm -rf /` → meltdown → boot → clean shell; `exit` gag; `sh cowsay "Hello World"`.

- [ ] **Step 6: Commit**

```bash
git add src/components/CrtOverlay.js src/helpers/commands/actions.js src/App.js README.md
git commit -m "feat(retro): CRT mode and command documentation"
```
