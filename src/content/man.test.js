import { getManPage, TOUR, ENTRIES } from './man';
import { COMMAND_NAMES } from '../helpers/commands/actions';
import { homeFs } from './fs';
import { fileType } from '../helpers/utils';

const headings = (page) => page.sections.map((s) => s.heading);

test('no name, or a site alias, returns the main page', () => {
    for (const name of [undefined, '', 'klimovski', 'klimovski.io', 'tom', 'intro']) {
        const page = getManPage(name);
        expect(page.title).toBe('KLIMOVSKI(1)');
        expect(headings(page)).toEqual(expect.arrayContaining(['NAME', 'GETTING STARTED', 'COMMANDS', 'KEYS']));
    }
});

test('lookup is case-insensitive and resolves aliases', () => {
    expect(getManPage('LS').title).toBe('LS(1)');
    expect(getManPage('vi').title).toBe('VIM(1)');
    expect(getManPage('./cowsay').title).toBe('COWSAY(1)');
});

test('unknown names have no manual entry', () => {
    expect(getManPage('nope')).toBeNull();
});

test('every registered command has a man entry', () => {
    for (const cmd of COMMAND_NAMES) {
        expect({ cmd, page: getManPage(cmd) }).toEqual({ cmd, page: expect.objectContaining({ title: expect.any(String) }) });
    }
});

test('every home executable has a man entry', () => {
    const execs = Object.values(homeFs.children).filter((n) => n.type === fileType.exec);
    expect(execs.length).toBeGreaterThan(0);
    for (const e of execs) {
        expect(getManPage(e.name)).not.toBeNull();
    }
});

test('every tour step runs a real command or executable', () => {
    const execs = Object.values(homeFs.children).filter((n) => n.type === fileType.exec).map((n) => n.name);
    expect(TOUR.length).toBeGreaterThan(10);
    for (const step of TOUR) {
        const first = step.cmd.split(/\s+/)[0];
        const ok = first.startsWith('./') ? execs.includes(first.slice(2)) : COMMAND_NAMES.includes(first);
        expect({ cmd: step.cmd, ok }).toEqual({ cmd: step.cmd, ok: true });
    }
});

test('entries carry a summary, synopsis and description', () => {
    for (const [name, entry] of Object.entries(ENTRIES)) {
        expect({ name, hasSummary: !!entry.summary, hasSynopsis: !!entry.synopsis, hasDescription: entry.description.length > 0 })
            .toEqual({ name, hasSummary: true, hasSynopsis: true, hasDescription: true });
    }
});

test('per-command NAME line uses the short summary', () => {
    expect(getManPage('vim').sections[0].lines).toEqual(['vim — an editor you cannot leave']);
});
