export const HOME_SESSION = {
    user: 'guest',
    host: 'internet',
    fsName: 'home',
    themeName: 'dark',
    cwd: ['~'],
};

export const initShellState = ({ crt = false, bootPlayed = false } = {}) => ({
    sessions: [HOME_SESSION],
    history: [],
    crt,
    bootPlayed,
    program: null,
});

export const shellReducer = (state, action) => {
    switch (action.type) {
        case 'PUSH_SESSION':
            return { ...state, sessions: [...state.sessions, action.session] };
        case 'POP_SESSION':
            if (state.sessions.length <= 1) return state;
            return { ...state, sessions: state.sessions.slice(0, -1) };
        case 'SET_CWD': {
            const sessions = [...state.sessions];
            const top = sessions[sessions.length - 1];
            sessions[sessions.length - 1] = { ...top, cwd: action.cwd };
            return { ...state, sessions };
        }
        case 'ADD_HISTORY':
            if (!action.line || !action.line.trim()) return state;
            return { ...state, history: [...state.history, action.line] };
        case 'START_PROGRAM':
            return { ...state, program: action.program };
        case 'EXIT_PROGRAM':
            return { ...state, program: null };
        case 'SET_CRT':
            return { ...state, crt: action.on };
        case 'MARK_BOOT_PLAYED':
            return { ...state, bootPlayed: true };
        default:
            return state;
    }
};
