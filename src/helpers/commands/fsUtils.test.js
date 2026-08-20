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
