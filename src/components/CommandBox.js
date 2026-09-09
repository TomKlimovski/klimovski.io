import styled from '@emotion/styled';
import { useState, useRef, useEffect } from 'react';

import { regularTextStyle } from '../styles/_typographies';
import parseCommand from '../helpers/commands/parser';
import { complete } from '../helpers/commands/completion';
import { getNode } from '../helpers/commands/fsUtils';
import { COMMAND_NAMES } from '../helpers/commands/actions';
import { useShell } from '../helpers/shell/ShellContext';

// commands whose argument is another command name
const COMMAND_ARG_COMMANDS = ['man', 'sudo'];

const CommandInput = styled.input`
    flex: 1;
    border: none;
    display: flex;
    align-items: center;
    caret-color: ${(props) => props.theme.colors.opal};
    background-color: ${(props) => props.theme.colors.backgroundColor};
    color: ${(props) => props.theme.colors.white};
    &:focus {
        outline: none;
    }
    ${regularTextStyle};
`;

function CommandBox({ setCmd }) {
    const [disabled, setDisabled] = useState(false);
    const [commandValue, setCommandValue] = useState('');
    const [histIdx, setHistIdx] = useState(null);
    const inputRef = useRef(null);
    const { state, actions, active, fsRoot } = useShell();
    const programActive = !!state.program;

    // refocus when a program releases the terminal
    useEffect(() => {
        if (!programActive && !disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [programActive, disabled]);

    const onChange = (e) => {
        setCommandValue(e.target.value);
        setHistIdx(null);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            actions.addHistory(commandValue.trim());
            setCmd(parseCommand(commandValue));
            setDisabled(true);
            return;
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            const cwdNode = getNode(fsRoot, active.cwd);
            const entries = cwdNode && cwdNode.children ? Object.keys(cwdNode.children) : [];
            const completed = complete(commandValue, COMMAND_NAMES, entries, COMMAND_ARG_COMMANDS);
            if (completed) setCommandValue(completed);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const h = state.history;
            if (h.length === 0) return;
            const idx = histIdx === null ? h.length - 1 : Math.max(0, histIdx - 1);
            setHistIdx(idx);
            setCommandValue(h[idx]);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const h = state.history;
            if (histIdx === null) return;
            const idx = histIdx + 1;
            if (idx >= h.length) {
                setHistIdx(null);
                setCommandValue('');
            } else {
                setHistIdx(idx);
                setCommandValue(h[idx]);
            }
            return;
        }
        if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            actions.addHistory('clear');
            setCmd(parseCommand('clear'));
            setDisabled(true);
        }
    };

    return (
        <CommandInput
            ref={inputRef}
            autoFocus
            spellCheck={false}
            value={commandValue}
            disabled={disabled || programActive}
            onChange={onChange}
            onKeyDown={onKeyDown}
        />
    );
}

export default CommandBox;
