import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const flicker = keyframes`
    0% { opacity: 0.97; }
    50% { opacity: 1; }
    100% { opacity: 0.98; }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 30;
    pointer-events: none;
    background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.18) 0px,
        rgba(0, 0, 0, 0.18) 1px,
        transparent 1px,
        transparent 3px
    );
    box-shadow: inset 0 0 140px rgba(0, 0, 0, 0.6);
    animation: ${flicker} 0.12s infinite;
    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

export default function CrtOverlay() {
    return <Overlay />;
}
