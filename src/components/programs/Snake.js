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
    align-items: center;
    justify-content: center;
    gap: 12px;
    background-color: ${(props) => props.theme.colors.backgroundColor};
    color: ${(props) => props.theme.colors.opal};
    ${regularLightTextStyle};
`;

const CELL = 20;
const COLS = 24;
const ROWS = 16;
const TICK_MS = 120;

export default function Snake({ exit }) {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = COLS * CELL;
        canvas.height = ROWS * CELL;
        const ctx = canvas.getContext('2d');

        let snake = [{ x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }];
        let dir = { x: 1, y: 0 };
        let nextDir = dir;
        let food = { x: 15, y: 8 };
        let points = 0;
        let alive = true;

        const placeFood = () => {
            do {
                food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
            } while (snake.some((s) => s.x === food.x && s.y === food.y));
        };

        const gameOver = () => {
            if (!alive) return;
            alive = false;
            exit(<TxtOutput lines={[`snake: game over — ${points} pipeline${points === 1 ? '' : 's'} eaten.`]} />);
        };

        const draw = () => {
            ctx.fillStyle = '#1e1a1b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#eb5e55';
            ctx.fillRect(food.x * CELL + 4, food.y * CELL + 4, CELL - 8, CELL - 8);
            ctx.fillStyle = '#c6d8d3';
            snake.forEach((s) => ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2));
        };

        const tick = () => {
            if (!alive) return;
            dir = nextDir;
            const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
            if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS
                || snake.some((s) => s.x === head.x && s.y === head.y)) {
                gameOver();
                return;
            }
            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
                points++;
                setScore(points);
                placeFood();
            } else {
                snake.pop();
            }
            draw();
        };

        draw();
        const interval = setInterval(tick, TICK_MS);

        const onKey = (e) => {
            const k = e.key;
            if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
                e.preventDefault();
            }
            if (k === 'ArrowUp' && dir.y === 0) nextDir = { x: 0, y: -1 };
            else if (k === 'ArrowDown' && dir.y === 0) nextDir = { x: 0, y: 1 };
            else if (k === 'ArrowLeft' && dir.x === 0) nextDir = { x: -1, y: 0 };
            else if (k === 'ArrowRight' && dir.x === 0) nextDir = { x: 1, y: 0 };
            else if (k === 'q' || k === 'Escape') gameOver();
        };
        document.addEventListener('keydown', onKey);
        return () => {
            clearInterval(interval);
            document.removeEventListener('keydown', onKey);
        };
    }, [exit]);

    return (
        <Screen>
            <div>snake — pipelines eaten: {score}</div>
            <canvas ref={canvasRef} />
            <div>arrows to steer · q to quit · best with a keyboard</div>
        </Screen>
    );
}
