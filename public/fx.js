// Partículas roxas flutuantes (estilo vaga-lumes do End)
(function () {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w, h, dpr, particles = [];

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(70, Math.floor((w * h) / 20000));
        particles = Array.from({ length: count }, () => make(true));
    }

    function make(randomY) {
        return {
            x: Math.random() * w,
            y: randomY ? Math.random() * h : h + 10,
            r: Math.random() * 2.2 + 0.6,
            vy: Math.random() * 0.35 + 0.1,
            vx: (Math.random() - 0.5) * 0.25,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.02 + 0.008,
            hue: 255 + Math.random() * 35
        };
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
            p.phase += p.speed;
            p.x += p.vx + Math.sin(p.phase) * 0.25;
            p.y -= p.vy;
            if (p.y < -10 || p.x < -10 || p.x > w + 10) Object.assign(p, make(false));
            const a = 0.35 + Math.sin(p.phase * 2) * 0.35;
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
            g.addColorStop(0, `hsla(${p.hue}, 95%, 75%, ${a})`);
            g.addColorStop(1, `hsla(${p.hue}, 95%, 60%, 0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
            ctx.fill();
        }
        if (!reduce) requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
})();
