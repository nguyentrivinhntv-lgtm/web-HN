import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Tilt from 'react-parallax-tilt';
import Typewriter from 'typewriter-effect';
import ParticlesBackground from './ParticlesBackground';
import MagicCursor from './MagicCursor';

// Lấy URL API từ biến môi trường (dùng cho Vercel), nếu không có thì dùng localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const FAKE_FORTUNES = [
  "Tương lai của bạn rất rạng rỡ... nhưng nhớ đóng tiền mạng tháng này nhé!",
  "Bạn sẽ sớm gặp một người đặc biệt, nhưng họ mượn tiền bạn rồi lặn mất tăm.",
  "Sự nghiệp của bạn sẽ thăng tiến như diều gặp gió, nhưng cẩn thận đứt dây.",
  "Một món quà bất ngờ đang đến với bạn... đó là hóa đơn tiền điện tháng này.",
  "Vũ trụ mách bảo rằng hôm nay bạn tuyệt đối không nên ăn mì tôm nữa."
];

// SFX Audio instances
const clickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
const revealSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
const bgMusic = new Audio('https://assets.mixkit.co/active_storage/sfx/139/139-preview.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;

function AdminPanel({ onBack }) {
  const [images, setImages] = useState("");
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  useEffect(() => {
    // Tải dữ liệu hiện tại khi mở Admin
    axios.get(`${API_URL}/content`).then(res => {
      if(res.data && res.data.length > 0) {
        setText(res.data[0].display_text);
        setImages(res.data.map(item => item.image_url).join(',\n'));
      }
    }).catch(() => {});
  }, []);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if(!files || files.length === 0) return;
    
    setIsUploading(true);
    const uploadedUrls = [];
    
    try {
      for(let i=0; i<files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        
        const res = await axios.post(`${API_URL}/admin/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(res.data.url);
      }
      
      // Thêm các URL mới vào textarea
      const currentUrls = images ? images.split(',').map(u=>u.trim()).filter(Boolean) : [];
      setImages([...currentUrls, ...uploadedUrls].join(',\n'));
    } catch (err) {
      alert("Lỗi khi tải ảnh lên!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    const urls = images.split(',').map(url => url.trim()).filter(Boolean);
    if(urls.length === 0 || !text) return alert("Vui lòng nhập đủ thông tin!");
    
    try {
      // Gọi API bulk update để lưu chính xác số lượng ảnh
      await axios.post(`${API_URL}/admin/content/bulk`, {
        images: urls,
        display_text: text,
        sparkle_color: "#FFD700"
      });
      
      alert(`Đã lưu thành công ${urls.length} ảnh vào Database!`);
    } catch (e) {
      alert("Lỗi khi lưu! Hãy kiểm tra backend đang chạy chưa.");
    }
  };

  return (
    <div className="z-10 relative bg-slate-800/80 p-8 rounded-2xl backdrop-blur-md border border-white/10 w-full max-w-md text-white shadow-2xl overflow-y-auto max-h-[90vh]">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Trang Quản Trị (Admin)</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Tải ảnh lên từ máy tính:</label>
        <div className="relative border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-pink-500 transition-colors bg-slate-900/50">
          <input 
            type="file" 
            multiple 
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="pointer-events-none">
            {isUploading ? "Đang tải lên..." : "📁 Nhấp vào đây để chọn ảnh"}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Hoặc nhập trực tiếp các link hình ảnh (cách nhau bởi dấu phẩy):</label>
        <textarea 
          rows="4"
          value={images}
          onChange={e => setImages(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-pink-500 focus:outline-none text-sm"
          placeholder="https://anh1.jpg, https://anh2.jpg..."
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Dòng chữ kết quả:</label>
        <input 
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-pink-500 focus:outline-none"
          placeholder="Tương lai của bạn..."
        />
      </div>

      <div className="flex gap-4">
        <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 font-bold py-3 rounded-lg hover:opacity-90 transition">
          LƯU DỮ LIỆU
        </button>
        <button onClick={onBack} className="px-6 py-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition">
          Đóng
        </button>
      </div>
    </div>
  );
}

function Card({ img, index }) {
  // Trái tim trang trí quanh viền
  const hearts = [
    { top: '-10px', left: '-10px' }, { top: '-10px', right: '-10px' },
    { bottom: '-10px', left: '-10px' }, { bottom: '-10px', right: '-10px' },
    { top: '50%', left: '-15px' }, { top: '50%', right: '-15px' }
  ];

  // Xử lý link ảnh tĩnh từ backend
  const baseUrl = API_URL.replace('/api', '');
  const imageUrl = img.image_url.startsWith('/uploads/') ? baseUrl + img.image_url : img.image_url;

  return (
    <motion.div
      className="relative w-40 h-56 md:w-52 md:h-72 shrink-0"
      style={{
        marginTop: index % 2 !== 0 ? '60px' : '0px',
        marginLeft: index !== 0 ? '-20px' : '0px', 
        zIndex: 50 - index 
      }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        duration: 0.8, 
        delay: 1.5 + index * 0.2, 
        type: "spring"
      }}
      whileHover={{ scale: 1.1, zIndex: 100 }}
    >
      <Tilt
        className="w-full h-full"
        tiltMaxAngleX={20}
        tiltMaxAngleY={20}
        perspective={1000}
        scale={1.05}
        transitionSpeed={2000}
        glareEnable={true}
        glareMaxOpacity={0.6}
        glareColor="#ffffff"
        glarePosition="bottom"
      >
        <motion.div
          className="w-full h-full relative [transform-style:preserve-3d] cursor-pointer"
          animate={{ rotateY: 360 }}
          transition={{ 
            duration: 6, 
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* Front of card (The Image) */}
          <div className="absolute inset-0 [backface-visibility:hidden] rounded-xl overflow-hidden border-4 border-pink-400 shadow-[0_0_25px_rgba(236,72,153,0.8)] bg-white">
            <img src={imageUrl} alt="Card" className="w-full h-full object-cover" />
            
            {/* Trái tim quanh viền */}
            {hearts.map((pos, i) => (
              <div key={i} className="absolute text-pink-500 text-lg drop-shadow-md animate-pulse" 
                   style={{...pos, transform: pos.top === '50%' ? 'translateY(-50%)' : 'none'}}>
                ❤️
              </div>
            ))}
          </div>

          {/* Back of card */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl bg-gradient-to-br from-pink-600 to-purple-800 border-4 border-pink-400 flex items-center justify-center shadow-lg">
            {/* Trái tim quanh viền mặt sau */}
            {hearts.map((pos, i) => (
              <div key={i} className="absolute text-pink-300 text-lg animate-pulse" 
                   style={{...pos, transform: pos.top === '50%' ? 'translateY(-50%)' : 'none'}}>
                ❤️
              </div>
            ))}
            <div className="w-20 h-20 rounded-full border-4 border-pink-300/50 flex items-center justify-center bg-black/20">
              <span className="text-pink-200 text-4xl">💖</span>
            </div>
          </div>
        </motion.div>
      </Tilt>
    </motion.div>
  );
}

function App() {
  const [step, setStep] = useState('intro'); // intro -> interactive -> success
  const [clickCount, setClickCount] = useState(0);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [contents, setContents] = useState([]);
  const [displayText, setDisplayText] = useState("");
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [glitch, setGlitch] = useState(false);
  
  // Custom Fortune for Typewriter
  const [fortune, setFortune] = useState("");
  const [hasStartedMusic, setHasStartedMusic] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    // Tải dữ liệu ban đầu
    const fetchContent = async () => {
      try {
        const res = await axios.get(`${API_URL}/content`);
        if (res.data && res.data.length > 0) {
          setContents(res.data);
          setDisplayText(res.data[0].display_text);
        } else {
          // Fallback if no data
          setDisplayText("Chưa có thông tin tương lai, vui lòng vào Admin để thêm dữ liệu!");
        }
      } catch (err) {
        console.error("Error fetching content:", err);
      }
    };
    fetchContent();
  }, []);

  const handleStartMusic = () => {
    if (!hasStartedMusic) {
      bgMusic.play().catch(e => console.log(e));
      setHasStartedMusic(true);
    }
  };

  const handleInteractiveStart = () => {
    handleStartMusic();
    setStep('interactive');
  };

  const handleHoverButton = () => {
    if (clickCount < 4) {
      // Glitch effect before teleporting
      clickSound.play().catch(e=>console.log(e));
      setGlitch(true);
      
      setTimeout(() => {
        setGlitch(false);
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        
        // Randomize button position within container bounds
        const maxX = rect.width - 150; // button width roughly 150
        const maxY = rect.height - 60; // button height roughly 60
        
        const randomX = Math.random() * maxX - maxX/2;
        const randomY = Math.random() * maxY - maxY/2;
        
        setButtonPos({ x: randomX, y: randomY });
        setClickCount(prev => prev + 1);
      }, 150); // Glitch duration
    }
  };

  const handleSuccessClick = () => {
    revealSound.play().catch(e=>console.log(e));
    setStep('success');
    
    // Pick a random fortune for the AI fake effect
    const randomFortune = FAKE_FORTUNES[Math.floor(Math.random() * FAKE_FORTUNES.length)];
    setFortune(randomFortune);
  };

  const fireworkParticles = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    angle: (i * 360) / 40,
    velocity: Math.random() * 100 + 50,
  }));

  const imagesToDisplay = contents.length > 0 ? contents : [
    { image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80" },
    { image_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80" },
    { image_url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=300&q=80" }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0b0b1a]">
      <MagicCursor />
      <ParticlesBackground />

      {/* Nút vào Admin hiển thị rõ ràng */}
      <button 
        onClick={() => setIsAdminOpen(true)}
        className="absolute bottom-4 right-4 z-50 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/80 text-slate-300 rounded-lg backdrop-blur-sm border border-slate-600 transition-all text-sm font-medium shadow-lg"
        title="Vào trang Quản trị"
      >
        ⚙️ Cài đặt (Admin)
      </button>

      <AnimatePresence mode="wait">
        {isAdminOpen ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setIsAdminOpen(false)}></div>
            <AdminPanel onBack={() => setIsAdminOpen(false)} />
          </motion.div>
        ) : step === 'intro' ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            className="z-10 text-center flex flex-col items-center pointer-events-auto"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-8 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
              Tiên Tri Tương Lai
            </h1>
            <p className="text-white/80 text-lg mb-12 max-w-md px-4">
              Bạn đã sẵn sàng để khám phá những bí ẩn mà vũ trụ đã sắp đặt cho mình? Hãy nhập thông tin của bạn vào bên dưới.
            </p>
            <input 
              type="text" 
              placeholder="Nhập tên hoặc thông tin của bạn..." 
              className="px-6 py-4 rounded-full w-80 max-w-[90vw] text-slate-900 bg-white/90 backdrop-blur-md shadow-xl border-2 border-pink-400/50 focus:outline-none focus:border-pink-500 focus:ring-4 ring-pink-500/30 transition-all text-center font-medium mb-8"
              autoFocus
            />
            <button 
              onClick={handleInteractiveStart}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg shadow-[0_0_20px_rgba(236,72,153,0.6)] hover:shadow-[0_0_30px_rgba(236,72,153,0.8)] hover:scale-105 transition-all"
            >
              Xem Tương Lai
            </button>
          </motion.div>
        ) : step === 'interactive' ? (
          <motion.div
            key="interactive"
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full h-full absolute inset-0 flex items-center justify-center pointer-events-auto"
          >
            <h2 className="absolute top-20 text-3xl font-bold text-white/50 text-center px-4 w-full animate-pulse pointer-events-none">
              {clickCount < 4 ? "Hãy nắm bắt vận mệnh của bạn..." : "Tuyệt vời! Bạn đã bắt được nó."}
            </h2>
            <motion.button
              animate={{ 
                x: buttonPos.x, 
                y: buttonPos.y,
                opacity: glitch ? [1, 0, 1, 0.5, 1] : 1,
                scale: glitch ? [1, 1.2, 0.8, 1.1, 1] : 1,
                skew: glitch ? [0, 20, -20, 0] : 0,
              }}
              transition={{ 
                type: glitch ? "tween" : "spring", 
                duration: glitch ? 0.15 : 0.5, 
                bounce: 0.5 
              }}
              onMouseEnter={handleHoverButton}
              onClick={clickCount >= 4 ? handleSuccessClick : handleHoverButton}
              className={`px-8 py-4 rounded-full font-bold text-xl transition-colors shadow-2xl relative overflow-hidden ${
                clickCount >= 4 
                  ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-[0_0_30px_rgba(52,211,153,0.8)]"
                  : "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.6)]"
              }`}
            >
              {clickCount >= 4 ? "MỞ CÁNH CỬA TƯƠNG LAI ✨" : "BẮT ĐẦU"}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="result-screen"
            className="z-10 flex flex-col items-center justify-center p-4 text-center w-full min-h-screen"
          >
            {/* Fireworks Animation */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {fireworkParticles.map(p => (
                <motion.div
                  key={p.id}
                  className="absolute w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_10px_#fde047]"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ 
                    x: Math.cos(p.angle * Math.PI / 180) * p.velocity,
                    y: Math.sin(p.angle * Math.PI / 180) * p.velocity + 50, // slight gravity
                    opacity: 0,
                    scale: 0
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              ))}
            </div>

            {/* Thông điệp từ Admin kết hợp Typewriter (AI giả lập) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-center z-10 pointer-events-none"
            >
              <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 mb-6 drop-shadow-lg">
                {displayText || "Tương lai của bạn là..."}
              </h2>
              
              {/* AI Typewriter Effect */}
              <div className="text-xl md:text-2xl text-white/90 font-medium max-w-2xl mx-auto min-h-[80px] px-4 italic bg-black/20 p-6 rounded-2xl backdrop-blur-md border border-white/10">
                <Typewriter
                  options={{
                    strings: [fortune],
                    autoStart: true,
                    delay: 50,
                    cursor: '✨'
                  }}
                />
              </div>
            </motion.div>

            {/* Khu vực hiển thị nhiều ảnh (Thẻ bài 3D Holographic) */}
            <div className="flex flex-wrap justify-center items-center gap-4 px-4 py-12 pointer-events-auto">
              {imagesToDisplay.map((item, index) => (
                <Card key={item.id || index} img={item} index={index} />
              ))}
            </div>
            
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3 }}
              onClick={() => {
                setIsSuccess(false);
                setHoverCount(0);
                setInputText("");
              }}
              className="mt-12 px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/30 text-white font-semibold transition-all shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              Thử Lại Lần Nữa 🎇
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
