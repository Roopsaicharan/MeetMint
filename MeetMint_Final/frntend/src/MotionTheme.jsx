import React, { useEffect, useRef } from 'react';

const MotionTheme = () => {
    const dotRef = useRef(null);
    const ringRef = useRef(null);
    const trailsRef = useRef([]);
    const bgIRef = useRef(null);
    const bgWRef = useRef(null);

    useEffect(() => {
        let mx = window.innerWidth / 2;
        let my = window.innerHeight / 2;
        let rx = mx;
        let ry = my;
        let prevMx = mx;
        let prevMy = my;
        const TRAIL_COUNT = 8;

        // Initialize trails
        const trails = [];
        for (let i = 0; i < TRAIL_COUNT; i++) {
            const tr = { x: mx, y: my, el: null };
            trails.push(tr);
        }
        trailsRef.current = trails;

        const handleMouseMove = (e) => {
            mx = e.clientX;
            my = e.clientY;

            // Parallax and Wash logic
            const bgI = document.getElementById('bgI');
            const bgW = document.getElementById('bgW');

            if (bgI) {
                const lx = mx / window.innerWidth;
                const ly = my / window.innerHeight;
                bgI.style.transform = `translate(${(lx - 0.5) * -22}px, ${(ly - 0.5) * -14}px) scale(1.1)`;
                bgI.style.transition = 'transform .08s linear';
            }

            if (bgW) {
                const lx = (mx / window.innerWidth) * 100;
                const ly = (my / window.innerHeight) * 100;
                bgW.style.background = `radial-gradient(circle 700px at ${lx.toFixed(1)}% ${ly.toFixed(1)}%, rgba(96, 165, 250, 0.08) 0%, transparent 65%)`;
            }
        };

        const handleMouseOver = (e) => {
            if (e.target.closest('a, button, input, textarea, [role="button"]')) {
                document.body.classList.add('big-cur');
            } else {
                document.body.classList.remove('big-cur');
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseover', handleMouseOver);

        const tick = () => {
            // Ring Smoothing
            rx += (mx - rx) * 0.1;
            ry += (my - ry) * 0.1;

            if (dotRef.current) {
                dotRef.current.style.left = `${mx}px`;
                dotRef.current.style.top = `${my}px`;
            }
            if (ringRef.current) {
                ringRef.current.style.left = `${rx}px`;
                ringRef.current.style.top = `${ry}px`;
            }

            // Trail logic
            const currentTrails = trailsRef.current;
            if (currentTrails.length > 0) {
                currentTrails[0].x += (mx - currentTrails[0].x) * 0.35;
                currentTrails[0].y += (my - currentTrails[0].y) * 0.35;

                for (let i = 1; i < TRAIL_COUNT; i++) {
                    currentTrails[i].x += (currentTrails[i - 1].x - currentTrails[i].x) * (0.28 - i * 0.02);
                    currentTrails[i].y += (currentTrails[i - 1].y - currentTrails[i].y) * (0.28 - i * 0.02);
                }

                const moving = Math.abs(mx - prevMx) + Math.abs(my - prevMy) > 0.5;

                currentTrails.forEach((t, i) => {
                    if (t.el) {
                        t.el.style.left = `${t.x}px`;
                        t.el.style.top = `${t.y}px`;
                        t.el.style.opacity = moving ? (((TRAIL_COUNT - i) / TRAIL_COUNT) * 0.3) : '0';
                    }
                });
            }

            prevMx = mx;
            prevMy = my;
            requestAnimationFrame(tick);
        };

        const rafId = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseover', handleMouseOver);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <>
            <div id="dot" ref={dotRef}></div>
            <div id="ring" ref={ringRef}></div>
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className="tr-dot"
                    ref={el => { if (trailsRef.current[i]) trailsRef.current[i].el = el; }}
                    style={{
                        width: `${2 + i * 0.3}px`,
                        height: `${2 + i * 0.3}px`
                    }}
                ></div>
            ))}
        </>
    );
};

export default MotionTheme;
