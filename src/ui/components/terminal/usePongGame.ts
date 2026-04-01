import { useEffect } from 'react';

interface PongGameProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  theme: 'green' | 'amber';
  keyboardLayout: 'azerty' | 'qwerty';
  onGameOver: (message: string) => void;
}

export function usePongGame({ canvasRef, theme, keyboardLayout, onGameOver }: PongGameProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const paddleHeight = 80;
    const paddleWidth = 10;
    const leftPaddle = { x: 10, y: 160 };
    const rightPaddle = { x: 380, y: 160 };
    let ball = { x: 200, y: 200, dx: 3, dy: 3 };
    const score = { left: 0, right: 0 };
    let gameOver = false;

    const keys: Record<string, boolean> = {};
    const fwd = keyboardLayout === 'azerty' ? 'z' : 'w';

    const handleGameKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        gameOver = true;
        onGameOver(`Game Over! Score: ${score.left} - ${score.right}`);
        return;
      }
      keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleGameKey);
    window.addEventListener('keyup', handleKeyUp);

    const color = theme === 'green' ? '#00FF00' : '#FFBF00';

    const gameLoop = setInterval(() => {
      if (gameOver) return;

      if (keys[fwd] && leftPaddle.y > 0) leftPaddle.y -= 5;
      if (keys['s'] && leftPaddle.y < 400 - paddleHeight) leftPaddle.y += 5;
      if (keys['arrowup'] && rightPaddle.y > 0) rightPaddle.y -= 5;
      if (keys['arrowdown'] && rightPaddle.y < 400 - paddleHeight) rightPaddle.y += 5;

      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.y <= 0 || ball.y >= 400) ball.dy = -ball.dy;

      if (
        ball.x <= leftPaddle.x + paddleWidth &&
        ball.y >= leftPaddle.y &&
        ball.y <= leftPaddle.y + paddleHeight
      )
        ball.dx = Math.abs(ball.dx);

      if (
        ball.x >= rightPaddle.x - 10 &&
        ball.y >= rightPaddle.y &&
        ball.y <= rightPaddle.y + paddleHeight
      )
        ball.dx = -Math.abs(ball.dx);

      if (ball.x < 0) {
        score.right++;
        ball = { x: 200, y: 200, dx: 3, dy: 3 };
      }
      if (ball.x > 400) {
        score.left++;
        ball = { x: 200, y: 200, dx: -3, dy: 3 };
      }

      if (score.left >= 5 || score.right >= 5) {
        gameOver = true;
        const winner = score.left >= 5 ? 'Left Player' : 'Right Player';
        onGameOver(`🏆 ${winner} Wins! Final Score: ${score.left} - ${score.right}`);
        return;
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = color;
      ctx.fillRect(leftPaddle.x, leftPaddle.y, paddleWidth, paddleHeight);
      ctx.fillRect(rightPaddle.x, rightPaddle.y, paddleWidth, paddleHeight);
      ctx.fillRect(ball.x, ball.y, 10, 10);

      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(200, 0);
      ctx.lineTo(200, 400);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '24px "Courier New"';
      ctx.fillText(`${score.left}`, 150, 40);
      ctx.fillText(`${score.right}`, 230, 40);
    }, 1000 / 60);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener('keydown', handleGameKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvasRef, theme, keyboardLayout, onGameOver]);
}
