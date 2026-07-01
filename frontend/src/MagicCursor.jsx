import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MagicCursor() {
  const [trails, setTrails] = useState([]);

  useEffect(() => {
    let timeoutId;
    const handleMouseMove = (e) => {
      const newTrail = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };

      setTrails((prev) => [...prev.slice(-20), newTrail]); // keep last 20 particles
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Auto cleanup trails if mouse stops
    const cleanupInterval = setInterval(() => {
      setTrails((prev) => (prev.length > 0 ? prev.slice(1) : []));
    }, 50);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(cleanupInterval);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <AnimatePresence>
        {trails.map((trail) => (
          <motion.div
            key={trail.id}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ 
              opacity: 0, 
              scale: 0,
              y: trail.y + 20, 
              x: trail.x + (Math.random() * 20 - 10)
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-3 h-3 rounded-full"
            style={{
              left: trail.x,
              top: trail.y,
              background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,105,180,0.8) 50%, rgba(0,0,0,0) 100%)',
              boxShadow: '0 0 10px #ff69b4, 0 0 20px #8a2be2'
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
