import styled from '@emotion/styled';
import { useEffect, useRef } from 'react';

const Screen = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10;
    background-color: #000;
`;

const CHARS = 'アイウエオカキクケコサシスセソABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&';

export default function Cmatrix({ exit }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        const fontSize = 16;
        const cols = Math.floor(canvas.width / fontSize);
        const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -40));

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const interval = setInterval(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff41';
            ctx.font = `${fontSize}px RobotoMono, monospace`;
            for (let i = 0; i < drops.length; i++) {
                const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
                ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }, 60);

        const onKey = (e) => { e.preventDefault(); exit(); };
        document.addEventListener('keydown', onKey);
        document.addEventListener('touchstart', onKey);
        return () => {
            clearInterval(interval);
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('touchstart', onKey);
        };
    }, [exit]);

    return <Screen><canvas ref={canvasRef} /></Screen>;
}
