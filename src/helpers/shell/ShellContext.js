import { createContext, useContext, useReducer, useMemo } from 'react';
import { shellReducer, initShellState } from './shellReducer';
import { homeFs } from '../../content/fs';
import { tectoniqFs } from '../../content/tectoniq';

export const TECTONIQ_SESSION = {
    user: 'tiq',
    host: 'tectoniq.com.au',
    fsName: 'tectoniq',
    themeName: 'tectoniq',
    cwd: ['~'],
};

const FS_ROOTS = {
    home: homeFs,
    tectoniq: tectoniqFs,
};

const storage = {
    get(key) {
        try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
        try { window.localStorage.setItem(key, value); } catch (e) { /* private browsing */ }
    },
};

const ShellContext = createContext(null);

export function ShellProvider({ children }) {
    const [state, dispatch] = useReducer(shellReducer, {
        crt: storage.get('klimovski.crt') === '1',
        bootPlayed: storage.get('klimovski.bootPlayed') === '1',
    }, initShellState);

    const actions = useMemo(() => ({
        pushSession: (session) => dispatch({ type: 'PUSH_SESSION', session }),
        popSession: () => dispatch({ type: 'POP_SESSION' }),
        setCwd: (cwd) => dispatch({ type: 'SET_CWD', cwd }),
        addHistory: (line) => dispatch({ type: 'ADD_HISTORY', line }),
        startProgram: (program) => dispatch({ type: 'START_PROGRAM', program }),
        exitProgram: () => dispatch({ type: 'EXIT_PROGRAM' }),
        setCrt: (on) => {
            storage.set('klimovski.crt', on ? '1' : '0');
            dispatch({ type: 'SET_CRT', on });
        },
        markBootPlayed: () => {
            storage.set('klimovski.bootPlayed', '1');
            dispatch({ type: 'MARK_BOOT_PLAYED' });
        },
    }), []);

    const active = state.sessions[state.sessions.length - 1];
    const value = { state, actions, active, fsRoot: FS_ROOTS[active.fsName] };

    return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export const useShell = () => useContext(ShellContext);
