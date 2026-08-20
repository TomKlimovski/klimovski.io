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
