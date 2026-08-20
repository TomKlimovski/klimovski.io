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
