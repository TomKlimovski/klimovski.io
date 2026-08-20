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
