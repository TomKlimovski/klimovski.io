import { LAST_LOGIN_FROM, pickFrom, formatLastLogin, lastLoginLine, homeMotd, takeLastLogin } from './motd';

test('the from-list is a decent, deduplicated pool', () => {
    expect(LAST_LOGIN_FROM.length).toBeGreaterThanOrEqual(25);
    expect(new Set(LAST_LOGIN_FROM).size).toBe(LAST_LOGIN_FROM.length);
    for (const h of LAST_LOGIN_FROM) expect(h).toMatch(/^\S+$/);
});

test('pickFrom covers the whole list', () => {
    expect(pickFrom(() => 0)).toBe(LAST_LOGIN_FROM[0]);
    expect(pickFrom(() => 0.999999)).toBe(LAST_LOGIN_FROM[LAST_LOGIN_FROM.length - 1]);
});

test('formats like the date(1) command', () => {
    expect(formatLastLogin(new Date(2026, 8, 9, 19, 1, 11))).toBe('Wed Sep  9 19:01:11 2026');
    expect(formatLastLogin(new Date(2026, 11, 25, 0, 0, 0))).toBe('Fri Dec 25 00:00:00 2026');
});

test('last-login line and home motd point at help and man', () => {
    const d = new Date(2026, 8, 9, 19, 1, 11);
    expect(lastLoginLine(d, 'chiba.city')).toBe('Last login: Wed Sep  9 19:01:11 2026 from chiba.city');
    const lines = homeMotd(d, 'chiba.city');
    expect(lines[0]).toMatch(/^Last login: .* from chiba\.city$/);
    expect(lines.join('\n')).toMatch(/'help'/);
    expect(lines.join('\n')).toMatch(/'man klimovski'/);
});

test('takeLastLogin returns the previous visit and stamps this one', () => {
    const store = {};
    const storage = { get: (k) => store[k] ?? null, set: (k, v) => { store[k] = v; } };
    const first = takeLastLogin(storage, 1000);
    expect(first.getTime()).toBe(1000);
    expect(store['klimovski.lastLogin']).toBe('1000');
    const second = takeLastLogin(storage, 5000);
    expect(second.getTime()).toBe(1000);
    expect(store['klimovski.lastLogin']).toBe('5000');
});
