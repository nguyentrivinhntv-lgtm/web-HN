import { useEffect, useRef } from 'react';

export default function Warp({ onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;
    c.width = W;
    c.height = H;

    const stars = Array.from({ length: 400 }, () => ({
      x: (Math.random() - 0.5) * W * 2,
      y: (Math.random() - 0.5) * H * 2,
      z: Math.random() * 1000,
      pz: Math.random() * 1000
    }));

    let speed = 0;
    let raf;

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      
      speed += 1.5; // Tăng tốc độ

      stars.forEach(s => {
        s.pz = s.z;
        s.z -= speed;
        if (s.z <= 0) {
          s.z = 1000;
          s.pz = 1000;
          s.x = (Math.random() - 0.5) * W * 2;
          s.y = (Math.random() - 0.5) * H * 2;
        }

        const x = cx + (s.x / s.z) * 500;
        const y = cy + (s.y / s.z) * 500;
        const px = cx + (s.x / s.pz) * 500;
        const py = cy + (s.y / s.pz) * 500;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        
        ctx.lineWidth = Math.max(0.5, (1000 - s.z) / 150);
        const hue = 180 + Math.random() * 100; // Cyan to purple
        ctx.strokeStyle = `hsl(${hue}, 100%, 75%)`;
        ctx.stroke();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();

    // End transition
    const timer = setTimeout(() => {
      onComplete && onComplete();
    }, 1500);

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      c.width = W;
      c.height = H;
    };
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', resize);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[99999] bg-black pointer-events-auto">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Màn hình chớp trắng lúc cuối */}
      <div 
        className="absolute inset-0 bg-white opacity-0"
        style={{
          animation: 'warp-flash 1.5s forwards'
        }}
      />
      <style>{`
        @keyframes warp-flash {
          0% { opacity: 0; }
          80% { opacity: 0; }
          95% { opacity: 1; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
