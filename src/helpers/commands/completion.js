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
