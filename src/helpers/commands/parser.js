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
