import { ThemeProvider, Global } from '@emotion/react';
import { themes } from './styles/_themes';
import { globalCss } from './styles/_globalStyles';
import './styles/globals.css';

import TitleBar from './components/TitleBar';
import Clock from './components/Clock';
import Prompts from './components/Prompt';
import { ShellProvider, useShell } from './helpers/shell/ShellContext';

function ThemedShell() {
    const { state, actions, active } = useShell();
    const program = state.program;
    const Program = program ? program.Component : null;

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
