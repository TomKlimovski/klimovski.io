import styled from '@emotion/styled';
import { useState, useEffect } from 'react';

import { regularLightTextStyle, regularTextStyle } from '../styles/_typographies';
import CommandBox from './CommandBox';
import actions from '../helpers/commands/actions';
import { genUuid } from '../helpers/utils';
import { formatPath } from '../helpers/commands/fsUtils';
import { useShell } from '../helpers/shell/ShellContext';
import Boot from './programs/Boot';

const UserHostDiv = styled.div`
    color: ${(props) => props.theme.colors.ruby};
`;

const DirDiv = styled.div`
    color: ${(props) => props.theme.colors.papayaWhip};
`;

const ShellPromptDiv = styled.div`
    color: ${(props) => props.theme.colors.white};
`;

const NotFoundDiv = styled.div`
    padding-left: 10px;
    color: ${(props) => props.theme.colors.white};
    ${regularLightTextStyle};
`;

const PromptDiv = styled.div`
    display: flex;
    height: 32px;
    align-items: center;
    justify-content: left;
    padding-left: 10px;
    gap: 10px;
    ${regularTextStyle};
`;

const PromptsContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: left;
`;

function Prompt({ user, host, dir, setClear, setRenderNext }) {
    const [cmd, setCmd] = useState({});
    const [output, setOutput] = useState();
    const shellCtx = useShell();

    useEffect(() => {
        if (!cmd.command) return;
        const { state, actions: shellActions, active, fsRoot } = shellCtx;

        const shell = {
            cwd: active.cwd,
            fsRoot,
            sessions: state.sessions,
            history: state.history,
            crt: state.crt,
            setCwd: shellActions.setCwd,
            pushSession: shellActions.pushSession,
            popSession: shellActions.popSession,
            setCrt: shellActions.setCrt,
        };

        const runProgram = (prog) => {
            shellActions.startProgram({
                name: prog.Component.name,
                Component: prog.Component,
                onExit: (farewell) => {
                    if (prog.andThen === 'reboot') {
                        runProgram({ Component: Boot, andThen: 'clear' });
                        return;
                    }
                    if (farewell) setOutput(farewell);
                    if (prog.andThen === 'clear') setClear(true);
                    setRenderNext(true);
                },
            });
        };

        if (cmd.command === 'clear') {
            setClear(true);
            setRenderNext(true);
            return;
        }
        if (actions[cmd.command]) {
            const result = actions[cmd.command](cmd.args, shell);
            if (result && result.program) {
                runProgram(result.program);
                return; // renderNext fires when the program exits
            }
            setOutput(result);
        } else {
            setOutput(
                <NotFoundDiv>
                    Command not found : '{cmd.command}'. Type 'help' for available commands.
                </NotFoundDiv>
            );
        }
        setRenderNext(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cmd]);

    return (
        <>
        <PromptDiv>
            <UserHostDiv>{user}@{host}</UserHostDiv>
            <DirDiv>{dir}</DirDiv>
            <ShellPromptDiv>%</ShellPromptDiv>
            <CommandBox setCmd={setCmd} />
        </PromptDiv>
        <div>
            {output}
        </div>
        </>
    );
}

function Prompts() {
    const [renderNext, setRenderNext] = useState(false);
    const [clear, setClear] = useState(false);
    const { active } = useShell();

    const nextPrompt = () => ({
        key: genUuid(),
        user: active.user,
        host: active.host,
        dir: formatPath(active.cwd),
    });

    const [prompts, setPrompts] = useState([{
        key: 'first',
        user: 'guest',
        host: 'internet',
        dir: '~',
    }]);

    useEffect(() => {
        if (renderNext) {
            setRenderNext(false);
            if (clear) {
                setClear(false);
                setPrompts([nextPrompt()]);
                return;
            }
            setPrompts((prev) => prev.concat(nextPrompt()));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renderNext]);

    return (
        <PromptsContainer>
            {prompts.map((prompt) => (
                <Prompt
                    key={prompt.key}
                    user={prompt.user}
                    host={prompt.host}
                    dir={prompt.dir}
                    setClear={setClear}
                    setRenderNext={setRenderNext}
                />
            ))}
        </PromptsContainer>
    );
}

export default Prompts;
