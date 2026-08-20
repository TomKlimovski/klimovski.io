import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useEffect, useRef, useState } from 'react';

import { regularLightTextStyle } from '../../styles/_typographies';
import { MELTDOWN_LINES } from '../../content/eggs';

const glitch = keyframes`
    0% { transform: translate(0, 0) skewX(0deg); filter: none; }
    20% { transform: translate(-6px, 2px) skewX(-4deg); filter: invert(1); }
    40% { transform: translate(4px, -3px) skewX(3deg); filter: none; }
    60% { transform: translate(-3px, 1px) skewX(-2deg); filter: invert(1); }
    80% { transform: translate(5px, -2px) skewX(5deg); filter: none; }
    100% { transform: translate(0, 0) skewX(0deg); filter: invert(1); }
`;

const Screen = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10;
    padding: 24px;
    background-color: ${(props) => props.theme.colors.backgroundColor};
    color: ${(props) => props.theme.colors.fireOpal};
    white-space: pre-wrap;
    ${regularLightTextStyle};
`;

const GlitchScreen = styled(Screen)`
    animation: ${glitch} 0.12s infinite;
`;

const Halted = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 11;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #000;
    color: ${(props) => props.theme.colors.fireOpal};
    font-size: 40px;
    font-family: RobotoMono;
`;

const LINE_MS = 90;

export default function Meltdown({ exit }) {
    const [shown, setShown] = useState(0);
    const [phase, setPhase] = useState('deleting'); // deleting -> glitch -> halted
    const exitedRef = useRef(false);

    useEffect(() => {
        const finish = () => {
            if (exitedRef.current) return;
            exitedRef.current = true;
            exit();
        };
        const timers = [];
        for (let i = 1; i <= MELTDOWN_LINES.length; i++) {
            timers.push(setTimeout(() => setShown(i), i * LINE_MS));
        }
        const tAll = MELTDOWN_LINES.length * LINE_MS;
        timers.push(setTimeout(() => setPhase('glitch'), tAll + 200));
        timers.push(setTimeout(() => setPhase('halted'), tAll + 900));
        timers.push(setTimeout(finish, tAll + 1800));
        timers.push(setTimeout(finish, 6000)); // failsafe: always reach the reboot
        return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (phase === 'halted') {
        return <Halted>SYSTEM HALTED</Halted>;
    }
    const Comp = phase === 'glitch' ? GlitchScreen : Screen;
    return <Comp>{MELTDOWN_LINES.slice(0, shown).join('\n')}</Comp>;
}
