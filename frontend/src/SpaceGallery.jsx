import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import './SpaceGallery.css';
import Warp from './Warp';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

function Starfield({ mouseRef, drawStateRef }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let W, H, stars = [], raf, edges = [];
    const sm = { x: 0, y: 0 };

    let startTime = performance.now();

    const init = () => {
      W = c.width = window.innerWidth;
      H = c.height = window.innerHeight;
      
      const oc = document.createElement('canvas');
      oc.width = W; oc.height = H;
      const octx = oc.getContext('2d', { willReadFrequently: true });
      octx.fillStyle = 'white';
      octx.font = '900 min(12vw, 150px) Orbitron, sans-serif';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText('YOUR FUTURE', W/2, H/2);
      
      const imgData = octx.getImageData(0, 0, W, H).data;
      const targets = [];
      for(let y=0; y<H; y+=4) {
        for(let x=0; x<W; x+=4) {
          if (imgData[(y*W + x)*4 + 3] > 128) {
             targets.push({x, y});
          }
        }
      }

      stars = Array.from({ length: 2000 }, (_, i) => {
        const d = Math.random();
        const t = targets[i % Math.max(1, targets.length)] || {x: W/2, y: H/2};
        const origX = Math.random() * (W + 200) - 100;
        const origY = Math.random() * (H + 200) - 100;
        return {
          origX, origY,
          x: origX, y: origY,
          r: d < 0.5 ? 0.4 : d < 0.8 ? 1 : 1.8,
          a: Math.random() * 0.6 + 0.4,
          ad: (Math.random() - 0.5) * 0.02,
          pf: d < 0.5 ? 8 : d < 0.8 ? 20 : 40,
          c: ['#fff','#ffe4c4','#c9d6ff','#ffd4e5','#d4f1ff'][Math.floor(Math.random()*5)],
          activeTime: 0,
          tx: t.x + (Math.random()-0.5)*10,
          ty: t.y + (Math.random()-0.5)*10
        };
      });
      edges = [];
      startTime = performance.now();
    };
    init();
    window.addEventListener('resize', init);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      sm.x += (mouseRef.current.nx - sm.x) * 0.03;
      sm.y += (mouseRef.current.ny - sm.y) * 0.03;
      
      const now = performance.now();
      const isTextMode = (now - startTime) < 4000;

      for (const s of stars) {
        s.a += s.ad;
        if (s.a > 1 || s.a < 0.2) s.ad *= -1;
        
        if (isTextMode) {
          s.x += (s.tx - s.x) * 0.08;
          s.y += (s.ty - s.y) * 0.08;
        } else {
          s.x += (s.origX - s.x) * 0.02;
          s.y += (s.origY - s.y) * 0.02;
        }

        const dx = s.x + sm.x * s.pf, dy = s.y + sm.y * s.pf;
        if (!isTextMode && (dx < -10 || dx > W+10 || dy < -10 || dy > H+10)) continue;
        
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

        if (now - s.activeTime < 3000) {
          const age = now - s.activeTime;
          const alpha = Math.max(0, 1 - age / 3000);
          ctx.beginPath();
          ctx.arc(dx, dy, s.r * 2 + (age / 3000) * 20, 0, 6.28);
          ctx.strokeStyle = `rgba(0, 255, 200, ${alpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(dx, dy, s.r * 4, 0, 6.28);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (drawStateRef && drawStateRef.current) {
        const state = drawStateRef.current;
        if (state.isDrawing) {
          const mx = state.mouseX, my = state.mouseY;
          let closest = null, closestDist = Infinity;
          for (const s of stars) {
            const dx = s.x + sm.x * s.pf, dy = s.y + sm.y * s.pf;
            if (Math.abs(mx - dx) < 60 && Math.abs(my - dy) < 60) {
              const d = Math.hypot(mx - dx, my - dy);
              if (d < 60 && d < closestDist) {
                closestDist = d;
                closest = s;
              }
            }
          }
          if (closest) {
            closest.activeTime = now;
            const last = state.lastStar;
            if (last && last !== closest) {
              const ld = Math.hypot((last.x + sm.x*last.pf) - (closest.x + sm.x*closest.pf), (last.y + sm.y*last.pf) - (closest.y + sm.y*closest.pf));
              if (ld < 200) {
                edges.push({ s1: last, s2: closest, time: now });
              }
            }
            state.lastStar = closest;
          }
        } else {
          state.lastStar = null;
        }

        edges = edges.filter(e => now - e.time < 3000);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffc8';
        for (const e of edges) {
          const age = now - e.time;
          const alpha = Math.max(0, 1 - age / 3000);
          const p1x = e.s1.x + sm.x * e.s1.pf;
          const p1y = e.s1.y + sm.y * e.s1.pf;
          const p2x = e.s2.x + sm.x * e.s2.pf;
          const p2y = e.s2.y + sm.y * e.s2.pf;
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.strokeStyle = `rgba(0, 255, 200, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        const path = state.path;
        if (path.length > 1) {
          for (let i = path.length - 1; i > 0; i--) {
            ctx.beginPath();
            ctx.moveTo(path[i].x, path[i].y);
            ctx.lineTo(path[i-1].x, path[i-1].y);
            const alpha = i / path.length;
            ctx.strokeStyle = `rgba(0, 255, 200, ${alpha})`;
            ctx.lineWidth = alpha * 4;
            ctx.stroke();
          }
        }
        if (!state.isDrawing && path.length > 0) {
          path.shift();
          if (path.length > 0) path.shift();
        }
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', init); cancelAnimationFrame(raf); };
  }, [mouseRef, drawStateRef]);
  return <canvas ref={ref} className="sg-starfield pointer-events-none" />;
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

// ============ ASTEROIDS ============
function AsteroidField({ buffRef }) {
  const [asteroids, setAsteroids] = useState([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.3) {
        setAsteroids(prev => [...prev, { id: Date.now(), ty: Math.random() * 800 - 400 }]);
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const handleClick = (id) => {
    setAsteroids(prev => prev.filter(a => a.id !== id));
    setToast('SPEED BUFF x3!');
    buffRef.current = 3;
    setTimeout(() => setToast(''), 2000);
    setTimeout(() => { buffRef.current = 1; }, 10000);
    
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.volume = 0.3;
    audio.play().catch(()=>{});
  };

  return (
    <div className="sg-asteroids-container">
      {asteroids.map(a => (
        <div key={a.id} className="sg-asteroid" style={{'--ty': `${a.ty}px`}} onPointerDown={() => handleClick(a.id)}></div>
      ))}
      {toast && <div className="sg-buff-toast">{toast}</div>}
    </div>
  );
}

// ============ MAIN ============
export default function SpaceGallery() {
  const rootRef = useRef(null);
  const perspRef = useRef(null);
  const sceneRef = useRef(null);
  const cursorRef = useRef(null);
  const mouseRef = useRef({ nx: 0, ny: 0, px: -100, py: -100 });
  const rotRef = useRef({ x: -20, y: 0 });
  const spinRef = useRef(0);
  const zoomRef = useRef(0);
  const targetZoom = useRef(0);
  const frameRefs = useRef([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selected3D, setSelected3D] = useState(null);
  const selected3DRef = useRef(null);
  const [isEthereal, setIsEthereal] = useState(false);
  const buffRef = useRef(1);
  const [isWarping, setIsWarping] = useState(false);
  const drawStateRef = useRef({ isDrawing: false, path: [], mouseX: 0, mouseY: 0, lastStar: null });
  const isBlackHoleRef = useRef(false);
  const bhStartRef = useRef(0);
  const hueRef = useRef(0);

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
    { src:'https://picsum.photos/seed/a1/600/800', title:'Hoàng Hôn', desc:'Hoàng hôn trên biển Đà Nẵng.' },
    { src:'https://picsum.photos/seed/a2/600/800', title:'Phố Cổ', desc:'Hội An lung linh đèn lồng.' },
    { src:'https://picsum.photos/seed/a3/600/800', title:'Núi Mây', desc:'Fansipan ẩn trong sương.' },
    { src:'https://picsum.photos/seed/a4/600/800', title:'Ruộng Bậc Thang', desc:'Lúa chín vàng Tây Bắc.' },
    { src:'https://picsum.photos/seed/a5/600/800', title:'Sài Gòn Đêm', desc:'Skyline thành phố rực rỡ.' },
    { src:'https://picsum.photos/seed/a6/600/800', title:'Hoa Đào', desc:'Hoa đào nở rộ Đà Lạt.' },
    { src:'https://picsum.photos/seed/a7/600/800', title:'Đường Sắt', desc:'Đường ray cổ kính Huế.' },
    { src:'https://picsum.photos/seed/a8/600/800', title:'Ngân Hà', desc:'Dải ngân hà đêm.' },
    { src:'https://picsum.photos/seed/a9/600/800', title:'Hạ Long', desc:'Vịnh Hạ Long hùng vĩ.' },
    { src:'https://picsum.photos/seed/a10/600/800', title:'Chợ Hoa', desc:'Chợ hoa Tết Hà Nội.' },
    { src:'https://picsum.photos/seed/a11/600/800', title:'Suối Tiên', desc:'Suối trong vắt Quảng Bình.' },
    { src:'https://picsum.photos/seed/a12/600/800', title:'Đèn Lồng', desc:'Lễ hội đèn lồng Hội An.' },
    { src:'https://picsum.photos/seed/a13/600/800', title:'Cầu Vàng', desc:'Cầu Vàng Bà Nà Hills.' },
    { src:'https://picsum.photos/seed/a14/600/800', title:'Phú Quốc', desc:'Bãi biển Phú Quốc.' },
    { src:'https://picsum.photos/seed/a15/600/800', title:'Cà Phê', desc:'Cà phê sáng Đà Lạt.' },
    { src:'https://picsum.photos/seed/a16/600/800', title:'Đồi Chè', desc:'Đồi chè xanh Mộc Châu.' },
    { src:'https://picsum.photos/seed/a17/600/800', title:'Chùa Cổ', desc:'Chùa cổ Ninh Bình.' },
    { src:'https://picsum.photos/seed/a18/600/800', title:'Mưa Phố', desc:'Mưa chiều Sài Gòn.' },
    { src:'https://picsum.photos/seed/a19/600/800', title:'Áo Dài', desc:'Áo dài tím Huế.' },
    { src:'https://picsum.photos/seed/a20/600/800', title:'Hồ Gươm', desc:'Hồ Gươm bình yên.' },
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
    
    // Ethereal dimension swaps Y and Z for a vertical orbit
    const yVal = isEthereal ? R * Math.cos(phi) * 0.65 : R * Math.sin(phi) * Math.sin(theta) * 0.55;
    const zVal = isEthereal ? R * Math.sin(phi) * Math.sin(theta) * 0.55 : R * Math.cos(phi) * 0.65;
    
    return {
      x: R * Math.sin(phi) * Math.cos(theta),
      y: yVal,
      z: zVal,
      ry: Math.atan2(R * Math.sin(phi) * Math.cos(theta), zVal) * (180 / Math.PI),
      bobSpeed: 0.8 + Math.random() * 0.6,
      bobAmp: 12 + Math.random() * 15,
      bobPhase: Math.random() * Math.PI * 2,
      tx: R * Math.sin(phi) * Math.cos(theta),
      ty: yVal,
      vx: 0,
      vy: 0,
      dragging: false,
      lastPx: 0,
      lastPy: 0,
      dragMoved: false
    };
    });
  }, [photos, isEthereal]);

  const handlePointerDown = useCallback((e, i) => {
    e.target.setPointerCapture(e.pointerId);
    const p = positions[i];
    p.dragging = true;
    p.lastPx = e.clientX;
    p.lastPy = e.clientY;
    p.dragMoved = false;
  }, [positions]);

  const handlePointerMove = useCallback((e, i) => {
    const p = positions[i];
    if (p && p.dragging) {
      p.dragMoved = true;
      p.vx = e.clientX - p.lastPx;
      p.vy = e.clientY - p.lastPy;
      p.lastPx = e.clientX;
      p.lastPy = e.clientY;
      p.tx += p.vx;
      p.ty += p.vy;
    }
  }, [positions]);

  const handlePointerUp = useCallback((e, i, ph) => {
    const p = positions[i];
    if (!p) return;
    p.dragging = false;
    e.target.releasePointerCapture(e.pointerId);
    if (!p.dragMoved) {
      if (selected3DRef.current && selected3DRef.current.index === i) {
        setSelected3D(null);
        selected3DRef.current = null;
      } else {
        setSelected3D({ photo: ph, index: i });
        selected3DRef.current = { photo: ph, index: i };
      }
    }
  }, [positions]);

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
    if (isBlackHoleRef.current) return;

    const newZoom = targetZoom.current + e.deltaY * -1.5;
    
    if (newZoom > 2500) {
      isBlackHoleRef.current = true;
      bhStartRef.current = performance.now();
      const bhSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); 
      bhSound.volume = 0.5;
      bhSound.play().catch(()=>{});
      
      setTimeout(() => {
        hueRef.current = (hueRef.current + 90) % 360; 
        isBlackHoleRef.current = false;
        targetZoom.current = -1500; 
        zoomRef.current = -2000;
        rotRef.current.z = 0;
        
        const expSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1726/1726-preview.mp3');
        expSound.play().catch(()=>{});
      }, 3000);
      return;
    }
    
    targetZoom.current = Math.max(-1000, Math.min(3000, newZoom));
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

      // Scene rotation (mouse = orbit camera)
      let tx = -20 + m.ny * -40; // pitch: -60 to +20
      
      if (!selected3DRef.current) {
        // Continuous 360 yaw rotation based on mouse X
        spinRef.current -= m.nx * 0.5; 
      }
      let ty = spinRef.current;
      let tz = targetZoom.current;

      if (selected3DRef.current) {
        // Point camera straight ahead so the centered item is perfectly in the middle
         ty = 0;
         tx = 0;
         tz = 100; // sensible cinematic zoom
      }

      // Asteroid buff adds auto-spin
      if (buffRef.current > 1 && !selected3DRef.current) {
        ty += (now / 1000) * 100; // spin fast
      }

      const camSpeed = selected3DRef.current ? 0.035 : 0.045;
      rotRef.current.x += (tx - rotRef.current.x) * camSpeed;
      rotRef.current.y += (ty - rotRef.current.y) * camSpeed;

      // Scene opacity (fade in) applied to persp to prevent 3D flattening
      const opacity = Math.min(1, t / 1.5);
      if (perspRef.current) perspRef.current.style.opacity = opacity;

      // Filter applied to root
      if (rootRef.current) {
        let f = `hue-rotate(${hueRef.current}deg)`;
        if (isBlackHoleRef.current) {
          const elapsed = now - bhStartRef.current;
          let scale = Math.max(0, 1 - elapsed / 2500);
          if (scale === 0) scale = 0.001;
          f += ` contrast(${1 + (1 - scale) * 2})`;
        }
        rootRef.current.style.filter = f;
      }

      if (isBlackHoleRef.current) {
        const elapsed = now - bhStartRef.current;
        let scale = Math.max(0, 1 - elapsed / 2500);
        if (scale === 0) scale = 0.001;
        rotRef.current.z = (rotRef.current.z || 0) + 15;
        
        if (sceneRef.current) {
          sceneRef.current.style.transform =
            `translateZ(${zoomRef.current}px) rotateX(${rotRef.current.x}deg) rotateY(${rotRef.current.y}deg) rotateZ(${rotRef.current.z}deg) scale(${scale})`;
        }
      } else {
        zoomRef.current += (tz - zoomRef.current) * 0.06;
        rotRef.current.z = 0;
        
        if (sceneRef.current) {
          sceneRef.current.style.transform =
            `translateZ(${zoomRef.current}px) rotateX(${rotRef.current.x}deg) rotateY(${rotRef.current.y}deg)`;
        }
      }

      // Update each photo frame position + bob
      for (let i = 0; i < frameRefs.current.length; i++) {
        const el = frameRefs.current[i];
        const p = positions[i];
        if (!el || !p) continue;

        let targetX = p.x;
        let targetY = p.y;
        let targetZ = p.z;
        let targetRy = p.ry;

        const isSelected = selected3DRef.current && selected3DRef.current.index === i;
        if (isSelected) {
           targetX = 0;
           targetY = 0;
           targetZ = 200; // Pull it forward towards the camera
           targetRy = 0;
        }

        // Initialize current values if they don't exist
        if (p.currZ === undefined) p.currZ = p.z;
        if (p.currRy === undefined) p.currRy = p.ry;

        if (!p.dragging) {
          p.tx += p.vx;
          p.ty += p.vy;
          p.vx *= 0.92; // friction
          p.vy *= 0.92; // friction
          
          // Spring force back to target orbit or center
          p.vx += (targetX - p.tx) * (isSelected ? 0.08 : 0.02);
          p.vy += (targetY - p.ty) * (isSelected ? 0.08 : 0.02);
        }

        p.currZ += (targetZ - p.currZ) * (isSelected ? 0.08 : 0.02);
        
        // Shortest path for rotation Y
        let diff = targetRy - p.currRy;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        p.currRy += diff * (isSelected ? 0.08 : 0.02);

        const bob = isSelected ? 0 : Math.sin(t * p.bobSpeed + p.bobPhase) * p.bobAmp;
        el.style.transform =
          `translate3d(${p.tx}px, ${p.ty + bob}px, ${p.currZ}px) rotateY(${p.currRy}deg) rotateZ(${p.vx * 0.5}deg) rotateX(${p.vy * -0.5}deg)`;
        
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
    <div 
      ref={rootRef}
      className={`sg-root ${loaded ? 'sg-ready' : ''} ${isEthereal ? 'sg-ethereal' : ''}`}
      onPointerDown={(e) => {
        if (e.target.closest('.sg-frame') || e.target.closest('.sg-lb-overlay') || e.target.closest('a') || e.target.closest('button')) return;
        drawStateRef.current.isDrawing = true;
        drawStateRef.current.mouseX = e.clientX;
        drawStateRef.current.mouseY = e.clientY;
        drawStateRef.current.path = [{x: e.clientX, y: e.clientY}];
      }}
      onPointerMove={(e) => {
        if (drawStateRef.current.isDrawing) {
          drawStateRef.current.mouseX = e.clientX;
          drawStateRef.current.mouseY = e.clientY;
          drawStateRef.current.path.push({x: e.clientX, y: e.clientY});
          if (drawStateRef.current.path.length > 30) drawStateRef.current.path.shift();
        }
      }}
      onPointerUp={() => drawStateRef.current.isDrawing = false}
      onPointerLeave={() => drawStateRef.current.isDrawing = false}
    >
      {isWarping && <Warp onComplete={() => window.location.hash = ''} />}

      {/* TOP NAVIGATION */}
      <div className="absolute top-4 right-4 md:top-6 md:right-8 z-50 pointer-events-auto flex gap-4">
        <button 
          onClick={() => setIsEthereal(!isEthereal)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white font-bold text-xs md:text-sm transition-all hover:scale-105"
        >
          {isEthereal ? '🌌 DARK MODE' : '🪐 WHITE HOLE'}
        </button>
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); setIsWarping(true); }}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-pink-400 font-bold text-xs md:text-sm transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] flex items-center gap-2"
        >
          <span>🔮</span> <span className="hidden sm:inline">TRỞ VỀ </span>TRANG CHỦ
        </a>
      </div>

      {/* Cursor */}
      <div className="sg-cursor" ref={cursorRef}>
        <div className="sg-cursor-dot" />
        <div className="sg-cursor-ring" />
      </div>

      {/* Stars */}
      <Starfield mouseRef={mouseRef} drawStateRef={drawStateRef} />

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

      {/* Asteroids */}
      <AsteroidField buffRef={buffRef} />

      {/* Particles */}
      <Particles />

      {/* === 3D SCENE === */}
      <div className="sg-persp" ref={perspRef}>
        <div className={`sg-scene ${selected3D ? 'sg-cinematic-mode' : ''}`} ref={sceneRef}>

          {/* Tech Light Pillar */}
          <div className="sg-tech-pillar-wrap">
            <div className="sg-pillar-core" />
            <div className="sg-pillar-hologram" />
            <div className="sg-pillar-rings">
              <div className="sg-pillar-ring" style={{'--i': 1}} />
              <div className="sg-pillar-ring" style={{'--i': 2}} />
              <div className="sg-pillar-ring" style={{'--i': 3}} />
            </div>
            <div className="sg-pillar-particles" />
            <div className="sg-pillar-glow" />
          </div>

          {/* Cyber HUD Elements */}
          <div className="sg-cyber-huds">
            <div className="sg-hud-ring sg-hud-1" />
            <div className="sg-hud-ring sg-hud-2" />
            <div className="sg-hud-ring sg-hud-3" />
            <div className="sg-cyber-lines">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="sg-cyber-line" style={{'--i': i}} />
              ))}
            </div>
            <div className="sg-cyber-grid" />
          </div>

          {/* Orbiting 3D Tech Panels */}
          <div className="sg-orbit-ring sg-orbit-ring-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={`c-${i}`} className="sg-orbit-block sg-block-cyan" style={{ '--i': i, '--total': 12, '--r': '500px' }}>
                <div className="sg-panel-inner" />
              </div>
            ))}
          </div>
          <div className="sg-orbit-ring sg-orbit-ring-2">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={`p-${i}`} className="sg-orbit-block sg-block-pink" style={{ '--i': i, '--total': 16, '--r': '750px' }}>
                <div className="sg-panel-inner" />
              </div>
            ))}
          </div>

          {/* Photos */}
          {photos && photos.map((ph, i) => (
            <div
              key={i}
              className={`sg-frame pointer-events-auto ${selected3D && selected3D.index === i ? 'sg-selected' : ''}`}
              ref={el => frameRefs.current[i] = el}
              onPointerDown={(e) => handlePointerDown(e, i)}
              onPointerMove={(e) => handlePointerMove(e, i)}
              onPointerUp={(e) => handlePointerUp(e, i, ph)}
              onPointerCancel={(e) => handlePointerUp(e, i, ph)}
            >
              <div className="sg-frame-inner">
                <img src={ph.src} alt={ph.title} loading="lazy" className="pointer-events-none" />
                <div className="sg-frame-shine" />
              </div>
              
              {selected3D && selected3D.index === i && (
                <div className="sg-holo-container">
                  {/* RIGHT PANEL — Personal Info */}
                  <div className="sg-holo-panel sg-holo-right">
                    <div className="sg-holo-scan" />
                    <div className="sg-holo-corner tl"/><div className="sg-holo-corner tr"/>
                    <div className="sg-holo-corner bl"/><div className="sg-holo-corner br"/>
                    <div className="sg-holo-label">◈ AGENT PROFILE</div>
                    <div className="sg-holo-value">NGUYỄN TRÍ VINH</div>
                    <div className="sg-holo-divider" />
                    <div className="sg-holo-label">◈ CALLSIGN</div>
                    <div className="sg-holo-value" style={{fontSize:'0.7rem'}}>Full-Stack Developer</div>
                    <div className="sg-holo-label">◈ SECTOR</div>
                    <div className="sg-holo-value" style={{fontSize:'0.7rem'}}>Hà Nội, Việt Nam</div>
                    <div className="sg-holo-bar"><div className="sg-holo-bar-fill" style={{'--bar-w':'95%'}}/></div>
                  </div>

                  {/* LEFT PANEL — Photo Intel */}
                  <div className="sg-holo-panel sg-holo-left">
                    <div className="sg-holo-scan" />
                    <div className="sg-holo-corner tl"/><div className="sg-holo-corner tr"/>
                    <div className="sg-holo-corner bl"/><div className="sg-holo-corner br"/>
                    <div className="sg-holo-label">◈ PHOTO INTEL</div>
                    <div className="sg-holo-value">{ph.title}</div>
                    <div className="sg-holo-divider" />
                    <div className="sg-holo-label">◈ DESCRIPTION</div>
                    <div className="sg-holo-value" style={{fontSize:'0.7rem', fontFamily:'Inter, sans-serif', fontWeight:400}}>{ph.desc}</div>
                    {ph.tags && ph.tags.length > 0 && (
                      <div style={{marginTop:'6px'}}>
                        {ph.tags.map((tag,ti) => <span key={ti} className="sg-holo-tag">{tag}</span>)}
                      </div>
                    )}
                  </div>

                  {/* BOTTOM PANEL — System Status */}
                  <div className="sg-holo-panel sg-holo-bottom">
                    <div className="sg-holo-scan" />
                    <div className="sg-holo-corner tl"/><div className="sg-holo-corner tr"/>
                    <div className="sg-holo-corner bl"/><div className="sg-holo-corner br"/>
                    <div className="sg-holo-label">◈ SYS.STATUS</div>
                    <div className="sg-holo-value" style={{fontSize:'0.7rem', color:'#00ffc8'}}>
                      SIGNAL: ONLINE &nbsp;|&nbsp; CLEARANCE: LV.5
                    </div>
                    <div className="sg-holo-divider" />
                    <div style={{display:'flex', gap:'20px'}}>
                      <div>
                        <div className="sg-holo-label">COORD X</div>
                        <div className="sg-holo-value" style={{fontSize:'0.75rem'}}>{Math.floor(positions[i]?.tx || 0)}</div>
                      </div>
                      <div>
                        <div className="sg-holo-label">COORD Y</div>
                        <div className="sg-holo-value" style={{fontSize:'0.75rem'}}>{Math.floor(positions[i]?.ty || 0)}</div>
                      </div>
                      <div>
                        <div className="sg-holo-label">DEPTH Z</div>
                        <div className="sg-holo-value" style={{fontSize:'0.75rem'}}>{Math.floor(positions[i]?.z || 0)}</div>
                      </div>
                    </div>
                    <div className="sg-holo-bar"><div className="sg-holo-bar-fill" style={{'--bar-w':'72%'}}/></div>
                  </div>
                </div>
              )}
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
