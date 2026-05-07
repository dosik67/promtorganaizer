import React, { useEffect, useRef } from 'react';

export const StarryBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: { x: number; y: number; z: number; size: number }[] = [];

    const initializeStars = () => {
      stars = [];
      const numStars = window.innerWidth < 768 ? 400 : 800; // Less stars on mobile
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width - canvas.width / 2,
          y: Math.random() * canvas.height - canvas.height / 2,
          z: Math.random() * 1000,
          size: Math.random() * 1.5 + 0.5,
        });
      }
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeStars();
    };

    const draw = () => {
      ctx.fillStyle = '#050510'; // Deep dark space color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.save();
      ctx.translate(centerX, centerY);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        
        // Move stars closer to create "walking through" effect
        star.z -= 2; 

        if (star.z <= 0) {
          star.x = Math.random() * canvas.width - centerX;
          star.y = Math.random() * canvas.height - centerY;
          star.z = 1000;
        }

        const projectX = (star.x / star.z) * 1000;
        const projectY = (star.y / star.z) * 1000;
        const scale = 1000 / star.z;
        const projectedSize = star.size * scale;

        ctx.globalAlpha = Math.min(1, Math.max(0, 1 - star.z / 1000));
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, Math.max(0, 1.2 - star.z/1000))})`; // Glow effect
        ctx.beginPath();
        ctx.arc(projectX, projectY, projectedSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    handleResize();
    draw();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1]"
    />
  );
};
