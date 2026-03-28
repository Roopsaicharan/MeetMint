import React, { useEffect, useRef } from 'react';

const BackgroundParticles = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const COLORS = ['rgba(59,130,246,', 'rgba(6,182,212,', 'rgba(139,92,246,'];
        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.r = Math.random() * 1.8 + .3;
                this.vx = (Math.random() - .5) * .3;
                this.vy = (Math.random() - .5) * .2 - .05;
                this.life = Math.random();
                this.speed = Math.random() * 0.008 + 0.003;
                this.c = COLORS[Math.floor(Math.random() * COLORS.length)];
                this.pulse = Math.random() * Math.PI * 2;
            }
            update() {
                this.life += this.speed;
                this.x += this.vx;
                this.y += this.vy;
                this.pulse += 0.02;
                if (this.life > 1 || this.y < -10) this.reset();
            }
            draw() {
                const a = Math.sin(this.life * Math.PI) * (0.6 + Math.sin(this.pulse) * 0.2);
                const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4);
                g.addColorStop(0, this.c + a + ')');
                g.addColorStop(1, this.c + '0)');
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
                ctx.fillStyle = g;
                ctx.fill();
            }
        }

        const particles = Array.from({ length: 80 }, () => new Particle());

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', mixBlendMode: 'screen' }}
        />
    );
};

export default BackgroundParticles;
