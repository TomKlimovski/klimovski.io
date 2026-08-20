import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';

import { regularLightTextStyle } from '../../styles/_typographies';
import TxtOutput from '../output/TxtOutput';

const Screen = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    background-color: ${(props) => props.theme.colors.backgroundColor};
    color: ${(props) => props.theme.colors.white};
    ${regularLightTextStyle};
`;

const Buffer = styled.div`
    flex: 1;
    padding: 8px 12px;
    overflow: hidden;
    white-space: pre-wrap;
`;

const Tilde = styled.div`
    color: ${(props) => props.theme.colors.opal};
`;

const StatusLine = styled.div`
    background-color: ${(props) => props.theme.colors.papayaWhip};
    color: ${(props) => props.theme.colors.backgroundColor};
    padding: 0 12px;
`;

const CmdLine = styled.div`
    padding: 0 12px;
    min-height: 28px;
`;

const TILDE_ROWS = 22;

export default function Vim({ exit }) {
    const [text, setText] = useState('');
    const [insert, setInsert] = useState(false);
    const [cmdBuf, setCmdBuf] = useState('');
    const [message, setMessage] = useState('');
    const startRef = useRef(Date.now());
    // refs mirror insert/cmdBuf so the once-registered listener never sees
    // stale values between renders (fast keystrokes outrun effect re-runs)
    const insertRef = useRef(false);
    const cmdRef = useRef('');
    const exitRef = useRef(exit);
    exitRef.current = exit;

    useEffect(() => {
        const setInsertBoth = (v) => { insertRef.current = v; setInsert(v); };
        const setCmdBoth = (v) => { cmdRef.current = v; setCmdBuf(v); };

        const onKey = (e) => {
            e.preventDefault();
            const key = e.key;

            if (insertRef.current) {
                if (key === 'Escape') { setInsertBoth(false); return; }
                if (key === 'Backspace') { setText((t) => t.slice(0, -1)); return; }
                if (key === 'Enter') { setText((t) => t + '\n'); return; }
                if (key.length === 1 && !e.ctrlKey && !e.metaKey) { setText((t) => t + key); }
                return;
            }

            if (cmdRef.current) {
                if (key === 'Escape') { setCmdBoth(''); return; }
                if (key === 'Backspace') { setCmdBoth(cmdRef.current.slice(0, -1)); return; }
                if (key === 'Enter') {
                    const c = cmdRef.current;
                    setCmdBoth('');
                    if (c === ':q!') {
                        const secs = Math.round((Date.now() - startRef.current) / 1000);
                        exitRef.current(<TxtOutput lines={[`You escaped vim after ${secs}s. Not everyone does.`]} />);
                        return;
                    }
                    if (c === ':q') { setMessage('E37: No write since last change (add ! to override)'); return; }
                    if (c === ':w' || c === ':wq' || c === ':x') { setMessage("E45: 'readonly' option is set (add ! to override)"); return; }
                    setMessage(`E492: Not an editor command: ${c.slice(1)}`);
                    return;
                }
                if (key.length === 1 && !e.ctrlKey && !e.metaKey) { setCmdBoth(cmdRef.current + key); }
                return;
            }

            if (key === ':') { setMessage(''); setCmdBoth(':'); return; }
            if (key === 'i') { setMessage(''); setInsertBoth(true); return; }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    return (
        <Screen>
            <Buffer>
                {text}
                {Array.from({ length: TILDE_ROWS }, (_, i) => <Tilde key={i}>~</Tilde>)}
            </Buffer>
            <StatusLine>"~/thoughts.txt" [New File]{insert ? '  -- INSERT --' : ''}</StatusLine>
            <CmdLine>{cmdBuf || message || '(hint for the trapped: it rhymes with "colon q bang")'}</CmdLine>
        </Screen>
    );
}
