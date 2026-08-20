import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';

import { regularLightTextStyle } from '../../styles/_typographies';
import { BOOT_LINES } from '../../content/eggs';

const Screen = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10;
    padding: 24px;
    background-color: ${(props) => props.theme.colors.backgroundColor};
    color: ${(props) => props.theme.colors.opal};
    white-space: pre-wrap;
    ${regularLightTextStyle};
`;

const LINE_MS = 280;

export default function Boot({ exit }) {
    const reduced = typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const [shown, setShown] = useState(reduced ? BOOT_LINES.length : 0);
    const exitedRef = useRef(false);

    useEffect(() => {
        const finish = () => {
            if (exitedRef.current) return;
            exitedRef.current = true;
            exit();
        };
        const timers = [];
        if (reduced) {
            timers.push(setTimeout(finish, 500));
        } else {
            for (let i = 1; i <= BOOT_LINES.length; i++) {
                timers.push(setTimeout(() => setShown(i), i * LINE_MS));
            }
            timers.push(setTimeout(finish, BOOT_LINES.length * LINE_MS + 400));
        }
        const skip = () => finish();
        document.addEventListener('keydown', skip);
        document.addEventListener('touchstart', skip);
        return () => {
            timers.forEach(clearTimeout);
            document.removeEventListener('keydown', skip);
            document.removeEventListener('touchstart', skip);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Screen>
            {BOOT_LINES.slice(0, shown).join('\n')}
        </Screen>
    );
}
