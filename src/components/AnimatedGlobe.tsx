
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

      // Rotação equatorial - como se estivéssemos no plano do equador
      ctx.rotate(rotation);

      // Animação de frames - efeito pulsante nas linhas
      const pulseOpacity = (Math.sin(frameTime * 0.01) + 1) * 0.5; // 0-1

      // Desenha linhas de latitude (círculos horizontais) - ESTAS FICAM FIXAS
      for (let i = 1; i <= 5; i++) {
        const latRadius = (i / 6) * radius;
        const lineOpacity = 0.3 + (pulseOpacity * 0.2);

        ctx.strokeStyle = `rgba(204, 204, 204, ${Math.min(lineOpacity, 0.6)})`;
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(0, 0, latRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Desenha linhas de longitude (linhas verticais/curvas) - ESTAS GIRAM
      for (let i = 0; i < 12; i++) {
        const baseAngle = (i / 12) * Math.PI * 2;
        // Adiciona rotação equatorial
        const equatorialAngle = baseAngle + rotation * 0.5;

        const linePhase = (frameTime * 0.008 + i * 0.3) % (Math.PI * 2);
        const lineOpacity = 0.4 + (Math.sin(linePhase) + 1) * 0.15;

        ctx.strokeStyle = `rgba(204, 204, 204, ${Math.min(lineOpacity, 0.7)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();

        // Cria a linha de longitude como um semicírculo (visão equatorial)
        for (let t = 0; t <= Math.PI; t += 0.05) {
          // Projeção equatorial: longitude como semicírculo
          const x = Math.sin(t) * Math.cos(equatorialAngle) * radius;
          const y = Math.cos(t) * radius;

          if (t === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Adiciona linhas equatoriais de referência (linhas que "atravessam")
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + rotation * 1.5; // Rotação mais rápida
        const crossOpacity = (Math.sin(frameTime * 0.015 + i * 0.8) + 1) * 0.12;

        ctx.strokeStyle = `rgba(204, 204, 204, ${crossOpacity})`;
        ctx.lineWidth = 0.8;

        ctx.beginPath();
        // Linha equatorial que atravessa
        ctx.moveTo(-radius * 0.9, 0);
        ctx.lineTo(radius * 0.9, 0);
        ctx.moveTo(0, -radius * 0.9);
        ctx.lineTo(0, radius * 0.9);
        ctx.stroke();

        // Pequenas marcas equatoriais
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.05, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Restaura o contexto
      ctx.restore();

      // Incrementa animações
      rotation += 0.003; // Rotação equatorial suave
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
