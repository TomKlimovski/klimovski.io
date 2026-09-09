import { complete } from './completion';

const CMDS = ['ls', 'cat', 'cd', 'clear', 'cowsay'];
const ENTRIES = ['about.txt', 'projects', '.plan', '.secrets', 'cowsay'];

test('completes a unique command with trailing space', () => {
    expect(complete('l', CMDS, ENTRIES)).toBe('ls ');
});

test('ambiguous command with no progress returns null', () => {
    expect(complete('c', CMDS, ENTRIES)).toBeNull();
});

test('completes file args', () => {
    expect(complete('cat ab', CMDS, ENTRIES)).toBe('cat about.txt');
});

test('hidden entries only offered for dot-prefixed tokens', () => {
    expect(complete('cat .p', CMDS, ENTRIES)).toBe('cat .plan');
    expect(complete('cat p', CMDS, ENTRIES)).toBe('cat projects');
});

test('ambiguous dot token makes no progress; unique dot token completes', () => {
    expect(complete('cat .', CMDS, ENTRIES)).toBeNull();
    expect(complete('ls .s', CMDS, ENTRIES)).toBe('ls .secrets');
});

test('returns null when no match, empty token, or slash in token', () => {
    expect(complete('cat zz', CMDS, ENTRIES)).toBeNull();
    expect(complete('cat ', CMDS, ENTRIES)).toBeNull();
    expect(complete('cat projects/e', CMDS, ENTRIES)).toBeNull();
    expect(complete('', CMDS, ENTRIES)).toBeNull();
});

test('commandArgFor commands complete command names as their argument', () => {
    const cmds = [...CMDS, 'man', 'snake', 'sudo'];
    expect(complete('man sn', cmds, ENTRIES, ['man'])).toBe('man snake');
    expect(complete('sudo sn', cmds, ENTRIES, ['man', 'sudo'])).toBe('sudo snake');
    // without opting in, the argument still completes against fs entries
    expect(complete('man sn', cmds, ENTRIES)).toBeNull();
    // fs entries never leak into a command-arg completion
    expect(complete('man ab', cmds, ENTRIES, ['man'])).toBeNull();
});
