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
