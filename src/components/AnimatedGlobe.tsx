
"use client";

import { useEffect, useRef } from 'react';

export function AnimatedGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Função para redimensionar canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Redimensiona inicialmente
    resizeCanvas();

    // Adiciona listener para redimensionamento
    window.addEventListener('resize', resizeCanvas);

    // Configurações
    const getCenterAndRadius = () => ({
      centerX: canvas.width / 2,
      centerY: canvas.height / 2,
      radius: Math.min(canvas.width, canvas.height) * 0.4 // 40% do menor lado
    });

    let rotation = 0;
    let frameTime = 0;

    // Função de animação
    const animate = () => {
      const { centerX, centerY, radius } = getCenterAndRadius();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Salva o contexto
      ctx.save();

      // Translada para o centro
      ctx.translate(centerX, centerY);

      // Rotação base
      ctx.rotate(rotation);

      // Animação de frames - efeito pulsante nas linhas
      const pulseOpacity = (Math.sin(frameTime * 0.01) + 1) * 0.5; // 0-1

      // Desenha linhas de latitude (círculos horizontais) com efeito frame
      for (let i = 1; i <= 5; i++) {
        const latRadius = (i / 6) * radius;
        const lineOpacity = 0.2 + (pulseOpacity * 0.3) + (i * 0.1);

        ctx.strokeStyle = `rgba(204, 204, 204, ${Math.min(lineOpacity, 0.8)})`;
        ctx.lineWidth = 1 + (pulseOpacity * 0.5);

        ctx.beginPath();
        ctx.arc(0, 0, latRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Desenha linhas de longitude com efeito sequencial
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const linePhase = (frameTime * 0.005 + i * 0.5) % (Math.PI * 2);
        const lineOpacity = 0.3 + (Math.sin(linePhase) + 1) * 0.2;

        ctx.strokeStyle = `rgba(204, 204, 204, ${Math.min(lineOpacity, 0.7)})`;
        ctx.lineWidth = 1 + (Math.sin(linePhase) * 0.3);

        ctx.beginPath();

        // Cria pontos ao longo da longitude com efeito de onda
        for (let t = -Math.PI/2; t <= Math.PI/2; t += 0.05) {
          const waveOffset = Math.sin(t * 3 + frameTime * 0.01) * 5;
          const x = Math.cos(t) * Math.cos(angle) * radius + waveOffset;
          const y = Math.sin(t) * radius;

          if (t === -Math.PI/2) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Adiciona efeito de "frame" com linhas radiais
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + rotation * 2; // Rotação mais rápida
        const frameOpacity = (Math.sin(frameTime * 0.02 + i) + 1) * 0.15;

        ctx.strokeStyle = `rgba(204, 204, 204, ${frameOpacity})`;
        ctx.lineWidth = 0.5;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * radius * 0.8, Math.sin(angle) * radius * 0.8);
        ctx.stroke();
      }

      // Restaura o contexto
      ctx.restore();

      // Incrementa animações
      rotation += 0.002; // Rotação mais lenta
      frameTime += 1;

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="fixed inset-0 -z-5 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-15"
      />
    </div>
  );
}
