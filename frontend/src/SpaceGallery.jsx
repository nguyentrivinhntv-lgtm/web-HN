import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import './SpaceGallery.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// ============ STARFIELD ============
function Starfield({ mouseRef }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let W, H, stars = [], raf;
    const sm = { x: 0, y: 0 };

    const init = () => {
      W = c.width = window.innerWidth;
      H = c.height = window.innerHeight;
      stars = Array.from({ length: 2000 }, () => {
        const d = Math.random();
        return {
          x: Math.random() * (W + 200) - 100,
          y: Math.random() * (H + 200) - 100,
          r: d < 0.5 ? 0.4 : d < 0.8 ? 1 : 1.8,
          a: Math.random() * 0.6 + 0.4,
          ad: (Math.random() - 0.5) * 0.02,
          pf: d < 0.5 ? 8 : d < 0.8 ? 20 : 40,
          c: ['#fff','#ffe4c4','#c9d6ff','#ffd4e5','#d4f1ff'][Math.floor(Math.random()*5)],
        };
      });
    };
    init();
    window.addEventListener('resize', init);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      sm.x += (mouseRef.current.nx - sm.x) * 0.03;
      sm.y += (mouseRef.current.ny - sm.y) * 0.03;
      for (const s of stars) {
        s.a += s.ad;
        if (s.a > 1 || s.a < 0.2) s.ad *= -1;
        const dx = s.x + sm.x * s.pf, dy = s.y + sm.y * s.pf;
        if (dx < -10 || dx > W+10 || dy < -10 || dy > H+10) continue;
        ctx.globalAlpha = s.a;
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.arc(dx, dy, s.r, 0, 6.28);
        ctx.fill();
        if (s.r > 1.3) {
          const g = ctx.createRadialGradient(dx,dy,0,dx,dy,s.r*3);
          g.addColorStop(0, s.c); g.addColorStop(1, 'transparent');
          ctx.fillStyle = g; ctx.globalAlpha = s.a * 0.15;
          ctx.beginPath(); ctx.arc(dx,dy,s.r*3,0,6.28); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', init); cancelAnimationFrame(raf); };
  }, [mouseRef]);
  return <canvas ref={ref} className="sg-starfield" />;
}

// ============ PARTICLES ============
function Particles() {
  const items = Array.from({length:30},(_,i)=>({
    id:i, e:['❤️','💖','⭐','🌟','✨','🌸','💜','🩷','🪷','💗'][i%10],
    l:Math.random()*100, d:8+Math.random()*14, dl:Math.random()*16,
    sz:14+Math.random()*18, sw:30+Math.random()*80,
  }));
  return (
    <div className="sg-particles">
      {items.map(p=>(
        <div key={p.id} className="sg-particle" style={{
          left:`${p.l}%`, fontSize:`${p.sz}px`,
          animationDuration:`${p.d}s`, animationDelay:`${p.dl}s`,
          '--sw':`${p.sw}px`,
        }}>{p.e}</div>
      ))}
    </div>
  );
}

// ============ LIGHTBOX ============
function Lightbox({ photo, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="sg-lb-overlay" ref={ref} onClick={e => e.target === ref.current && onClose()}>
      <div className="sg-lb-box">
        <button className="sg-lb-close" onClick={onClose}>✕</button>
        <img src={photo.src.replace('300/400','700/900')} alt={photo.title} className="sg-lb-img" />
        <div className="sg-lb-info">
          <h3>{photo.title}</h3>
          <p>{photo.desc}</p>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN ============
export default function SpaceGallery() {
  const sceneRef = useRef(null);
  const cursorRef = useRef(null);
  const mouseRef = useRef({ nx: 0, ny: 0, px: -100, py: -100 });
  const rotRef = useRef({ x: -20, y: 0 });
  const zoomRef = useRef(0);
  const targetZoom = useRef(0);
  const frameRefs = useRef([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(null);

  const [photos, setPhotos] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/gallery`).then(res => {
      if (res.data && res.data.length > 0) {
        const fetched = res.data.map(p => ({
          src: p.src.startsWith('/uploads/') ? API_URL.replace('/api', '') + p.src : p.src,
          title: p.title,
          desc: p.description || '',
          tags: p.tags ? p.tags.split(',') : []
        }));
        setPhotos(fetched);
      } else {
        setPhotos(DEFAULT_PHOTOS);
      }
    }).catch(() => {
      setPhotos(DEFAULT_PHOTOS);
    });
  }, []);

  const DEFAULT_PHOTOS = [
    { src:'https://picsum.photos/seed/a1/300/400', title:'Hoàng Hôn', desc:'Hoàng hôn trên biển Đà Nẵng.' },
    { src:'https://picsum.photos/seed/a2/300/400', title:'Phố Cổ', desc:'Hội An lung linh đèn lồng.' },
    { src:'https://picsum.photos/seed/a3/300/400', title:'Núi Mây', desc:'Fansipan ẩn trong sương.' },
    { src:'https://picsum.photos/seed/a4/300/400', title:'Ruộng Bậc Thang', desc:'Lúa chín vàng Tây Bắc.' },
    { src:'https://picsum.photos/seed/a5/300/400', title:'Sài Gòn Đêm', desc:'Skyline thành phố rực rỡ.' },
    { src:'https://picsum.photos/seed/a6/300/400', title:'Hoa Đào', desc:'Hoa đào nở rộ Đà Lạt.' },
    { src:'https://picsum.photos/seed/a7/300/400', title:'Đường Sắt', desc:'Đường ray cổ kính Huế.' },
    { src:'https://picsum.photos/seed/a8/300/400', title:'Ngân Hà', desc:'Dải ngân hà đêm.' },
    { src:'https://picsum.photos/seed/a9/300/400', title:'Hạ Long', desc:'Vịnh Hạ Long hùng vĩ.' },
    { src:'https://picsum.photos/seed/a10/300/400', title:'Chợ Hoa', desc:'Chợ hoa Tết Hà Nội.' },
    { src:'https://picsum.photos/seed/a11/300/400', title:'Suối Tiên', desc:'Suối trong vắt Quảng Bình.' },
    { src:'https://picsum.photos/seed/a12/300/400', title:'Đèn Lồng', desc:'Lễ hội đèn lồng Hội An.' },
    { src:'https://picsum.photos/seed/a13/300/400', title:'Cầu Vàng', desc:'Cầu Vàng Bà Nà Hills.' },
    { src:'https://picsum.photos/seed/a14/300/400', title:'Phú Quốc', desc:'Bãi biển Phú Quốc.' },
    { src:'https://picsum.photos/seed/a15/300/400', title:'Cà Phê', desc:'Cà phê sáng Đà Lạt.' },
    { src:'https://picsum.photos/seed/a16/300/400', title:'Đồi Chè', desc:'Đồi chè xanh Mộc Châu.' },
    { src:'https://picsum.photos/seed/a17/300/400', title:'Chùa Cổ', desc:'Chùa cổ Ninh Bình.' },
    { src:'https://picsum.photos/seed/a18/300/400', title:'Mưa Phố', desc:'Mưa chiều Sài Gòn.' },
    { src:'https://picsum.photos/seed/a19/300/400', title:'Áo Dài', desc:'Áo dài tím Huế.' },
    { src:'https://picsum.photos/seed/a20/300/400', title:'Hồ Gươm', desc:'Hồ Gươm bình yên.' },
  ];

  // Compute 3D positions dynamically based on photos length
  const positions = useMemo(() => {
    if (!photos) return [];
    return photos.map((_, i) => {
    const N = photos.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const theta = golden * i;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
    const R = 400 + (i % 3) * 70;
    return {
      x: R * Math.sin(phi) * Math.cos(theta),
      y: R * Math.sin(phi) * Math.sin(theta) * 0.55,
      z: R * Math.cos(phi) * 0.65,
      ry: Math.atan2(R * Math.sin(phi) * Math.cos(theta), R * Math.cos(phi) * 0.65) * (180 / Math.PI),
      bobSpeed: 0.8 + Math.random() * 0.6,
      bobAmp: 12 + Math.random() * 15,
      bobPhase: Math.random() * Math.PI * 2,
    };
    });
  }, [photos]);

  // Mouse
  const onMove = useCallback(e => {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    mouseRef.current.nx = (e.clientX - cx) / cx;
    mouseRef.current.ny = (e.clientY - cy) / cy;
    mouseRef.current.px = e.clientX;
    mouseRef.current.py = e.clientY;
  }, []);

  // Wheel → zoom
  const onWheel = useCallback(e => {
    e.preventDefault();
    targetZoom.current = Math.max(-600, Math.min(500,
      targetZoom.current + e.deltaY * -0.8
    ));
  }, []);

  // ALL animation in JS — no CSS animation on transforms
  useEffect(() => {
    const start = performance.now();
    const cursor = { x: -100, y: -100 };
    let raf;

    const loop = now => {
      const t = (now - start) / 1000;
      const m = mouseRef.current;

      // Cursor
      cursor.x += (m.px - cursor.x) * 0.25;
      cursor.y += (m.py - cursor.y) * 0.25;
      if (cursorRef.current) {
        cursorRef.current.style.transform =
          `translate(${cursor.x}px,${cursor.y}px) translate(-50%,-50%)`;
      }

      // Zoom
      zoomRef.current += (targetZoom.current - zoomRef.current) * 0.06;

      // Scene rotation (mouse = orbit camera)
      const tx = -20 + m.ny * -40; // pitch: -60 to +20
      const ty = m.nx * 50;        // yaw: -50 to +50
      rotRef.current.x += (tx - rotRef.current.x) * 0.045;
      rotRef.current.y += (ty - rotRef.current.y) * 0.045;

      // Scene opacity (fade in)
      const opacity = Math.min(1, t / 1.5);

      // Apply scene transform — THIS is the 3D rotation
      if (sceneRef.current) {
        sceneRef.current.style.opacity = opacity;
        sceneRef.current.style.transform =
          `translateZ(${zoomRef.current}px) rotateX(${rotRef.current.x}deg) rotateY(${rotRef.current.y}deg)`;
      }

      // Update each photo frame position + bob
      for (let i = 0; i < frameRefs.current.length; i++) {
        const el = frameRefs.current[i];
        const p = positions[i];
        if (!el || !p) continue;

        const bob = Math.sin(t * p.bobSpeed + p.bobPhase) * p.bobAmp;
        el.style.transform =
          `translate3d(${p.x}px, ${p.y + bob}px, ${p.z}px) rotateY(${p.ry}deg)`;
        
        // Fade in with stagger
        const fadeDelay = 0.5 + i * 0.08;
        el.style.opacity = Math.min(1, Math.max(0, (t - fadeDelay) / 0.6));
      }

      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('wheel', onWheel, { passive: false });
    raf = requestAnimationFrame(loop);
    setTimeout(() => setLoaded(true), 300);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(raf);
    };
  }, [onMove, onWheel, positions]);

  return (
    <div className={`sg-root ${loaded ? 'sg-ready' : ''}`}>

      {/* TOP NAVIGATION */}
      <div className="absolute top-4 left-0 w-full z-50 flex justify-center pointer-events-auto">
        <a 
          href="#" 
          className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-pink-400 font-bold text-sm md:text-base transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] flex items-center gap-2"
        >
          <span>🔮</span> TRỞ VỀ TRANG CHỦ
        </a>
      </div>

      {/* Cursor */}
      <div className="sg-cursor" ref={cursorRef}>
        <div className="sg-cursor-dot" />
        <div className="sg-cursor-ring" />
      </div>

      {/* Stars */}
      <Starfield mouseRef={mouseRef} />

      {/* Nebula */}
      <div className="sg-nebulae">
        <div className="sg-neb sg-neb1" />
        <div className="sg-neb sg-neb2" />
        <div className="sg-neb sg-neb3" />
      </div>

      {/* Shooting Stars */}
      <div className="sg-shooting-stars">
        <div className="sg-shooting-star" style={{top: '15%', animationDelay: '0s'}} />
        <div className="sg-shooting-star" style={{top: '45%', animationDelay: '4.5s'}} />
        <div className="sg-shooting-star" style={{top: '75%', animationDelay: '9s'}} />
        <div className="sg-shooting-star" style={{top: '-10%', left: '40%', animationDelay: '2s'}} />
      </div>

      {/* Vignette Overlay (Dark edges) */}
      <div className="sg-vignette" />

      {/* Particles */}
      <Particles />

      {/* === 3D SCENE === */}
      <div className="sg-persp">
        <div className="sg-scene" ref={sceneRef}>

          {/* Planet */}
          <div className="sg-planet-wrap">
            <div className="sg-planet"><div className="sg-planet-hl" /></div>
            <div className="sg-ring-wrap"><div className="sg-ring1" /><div className="sg-ring2" /></div>
            <div className="sg-planet-glow" />
          </div>

          {/* Orbiting 3D Blocks */}
          <div className="sg-orbit-ring sg-orbit-ring-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`c-${i}`} className="sg-orbit-block sg-block-cyan" style={{ '--i': i, '--total': 10, '--r': '500px' }} />
            ))}
          </div>
          <div className="sg-orbit-ring sg-orbit-ring-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={`p-${i}`} className="sg-orbit-block sg-block-pink" style={{ '--i': i, '--total': 14, '--r': '680px' }} />
            ))}
          </div>

          {/* Photos */}
          {photos && photos.map((ph, i) => (
            <div
              key={i}
              className="sg-frame"
              ref={el => frameRefs.current[i] = el}
              onClick={() => setSelected(ph)}
            >
              <div className="sg-frame-inner">
                <img src={ph.src} alt={ph.title} loading="lazy" />
                <div className="sg-frame-shine" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="sg-title-bar">
        <h2>✨ Space Gallery ✨</h2>
        <p>Di chuyển chuột xoay 3D • Cuộn chuột zoom</p>
      </div>

      {/* Lightbox */}
      {selected && <Lightbox photo={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
