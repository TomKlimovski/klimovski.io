import { ThemeProvider, Global } from '@emotion/react';
import { useEffect, useRef } from 'react';
import { themes } from './styles/_themes';
import { globalCss } from './styles/_globalStyles';
import './styles/globals.css';

import TitleBar from './components/TitleBar';
import Clock from './components/Clock';
import Prompts from './components/Prompt';
import Boot from './components/programs/Boot';
import CrtOverlay from './components/CrtOverlay';
import { ShellProvider, useShell } from './helpers/shell/ShellContext';

function ThemedShell() {
    const { state, actions, active } = useShell();
    const program = state.program;
    const Program = program ? program.Component : null;

    const bootLaunched = useRef(false);
    useEffect(() => {
        if (!state.bootPlayed && !bootLaunched.current) {
            bootLaunched.current = true;
            actions.startProgram({
                name: 'boot',
                Component: Boot,
                onExit: () => actions.markBootPlayed(),
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleProgramExit = (farewell) => {
        const onExit = program && program.onExit;
        actions.exitProgram();
        if (onExit) onExit(farewell);
    };

    return (
        <ThemeProvider theme={themes[active.themeName]}>
            <Global styles={globalCss} />
            <TitleBar />
            <Clock />
            <Prompts />
            {Program ? <Program exit={handleProgramExit} /> : null}
            {state.crt ? <CrtOverlay /> : null}
        </ThemeProvider>
    );
}

function App() {
    return (
        <ShellProvider>
            <ThemedShell />
        </ShellProvider>
    );
}

export default App;
