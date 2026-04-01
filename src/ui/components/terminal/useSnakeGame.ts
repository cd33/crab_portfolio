import { useEffect } from 'react';

interface SnakeGameProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  theme: 'green' | 'amber';
  keyboardLayout: 'azerty' | 'qwerty';
  t: (key: string, params?: Record<string, string>) => string;
  onGameOver: (message: string, score: number) => void;
}

export function useSnakeGame({ canvasRef, theme, keyboardLayout, t, onGameOver }: SnakeGameProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gridSize = 20;
    const tileCount = 20;
    const snake = [{ x: 10, y: 10 }];
    let direction = { x: 1, y: 0 };
    let food = { x: 15, y: 15 };
    let score = 0;
    let gameOver = false;

    const handleGameKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        gameOver = true;
        onGameOver(`${t('terminal.games.snake.gameOver')} ${score}`, score);
        return;
      }

      const fwd = keyboardLayout === 'azerty' ? 'z' : 'w';
      const left = keyboardLayout === 'azerty' ? 'q' : 'a';

      if (e.key === fwd && direction.y === 0) direction = { x: 0, y: -1 };
      if (e.key === 's' && direction.y === 0) direction = { x: 0, y: 1 };
      if (e.key === left && direction.x === 0) direction = { x: -1, y: 0 };
      if (e.key === 'd' && direction.x === 0) direction = { x: 1, y: 0 };
    };

    window.addEventListener('keydown', handleGameKey);

    const color = theme === 'green' ? '#00FF00' : '#FFBF00';

    const gameLoop = setInterval(() => {
      if (gameOver) return;

      const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver = true;
        onGameOver(t('terminal.games.snake.deadWall'), score);
        return;
      }

      if (snake.some((s) => s.x === head.x && s.y === head.y)) {
        gameOver = true;
        onGameOver(t('terminal.games.snake.deadSelf'), score);
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score++;
        food = {
          x: Math.floor(Math.random() * tileCount),
          y: Math.floor(Math.random() * tileCount),
        };
      } else {
        snake.pop();
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = color;
      snake.forEach((s) => {
        ctx.fillRect(s.x * gridSize, s.y * gridSize, gridSize - 2, gridSize - 2);
      });

      ctx.fillStyle = '#FF0000';
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

      ctx.fillStyle = color;
      ctx.font = '16px "Courier New"';
      ctx.fillText(`Score: ${score}`, 10, 20);
    }, 150);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener('keydown', handleGameKey);
    };
  }, [canvasRef, theme, keyboardLayout, t, onGameOver]);
}
