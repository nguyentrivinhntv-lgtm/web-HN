import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Lấy URL API từ biến môi trường (dùng cho Vercel), nếu không có thì dùng localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

function GalaxyBackground() {
  const stars = Array.from({ length: 100 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2
  }));

  return (
    <div className="fixed inset-0 z-0 bg-slate-950 overflow-hidden pointer-events-none">
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.1, 1, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut"
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950/80 to-slate-950"></div>
    </div>
  );
}

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

  return (
    <motion.div
      className="relative w-40 h-56 md:w-52 md:h-72 cursor-pointer [perspective:1000px] shrink-0"
      style={{
        // Sắp xếp so le (thụt lên thụt xuống)
        marginTop: index % 2 !== 0 ? '60px' : '0px',
        marginLeft: index !== 0 ? '-20px' : '0px', // Hơi đè lên nhau một chút
        zIndex: 50 - index // Càng về sau càng nằm dưới nếu đè nhau
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
      {/* Container to handle the 3D continuous rotation */}
      <motion.div
        className="w-full h-full relative [transform-style:preserve-3d]"
        animate={{ rotateY: 360 }}
        transition={{ 
          duration: 6, // Lật vòng tròn liên tục (6 giây 1 vòng)
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Front of card (The Image) */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-xl overflow-hidden border-4 border-pink-400 shadow-[0_0_25px_rgba(236,72,153,0.8)] bg-white">
          <img src={img.image_url} alt="Card" className="w-full h-full object-cover" />
          
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
    </motion.div>
  );
}

function App() {
  const [hoverCount, setHoverCount] = useState(0);
  const [inputText, setInputText] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [buttonPos, setButtonPos] = useState({ top: '50%', left: '50%' });
  const [dbData, setDbData] = useState([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    // Check if #admin is in URL
    if(window.location.hash === '#admin') setIsAdminOpen(true);
    
    // Fetch data when component loads
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/content`);
        if(res.data.length > 0) setDbData(res.data);
      } catch (e) {
        console.error("Backend chưa chạy hoặc chưa có data");
      }
    };
    fetchData();
  }, [isAdminOpen]);

  const handleMouseEnter = () => {
    if (hoverCount < 4) {
      const randomTop = Math.floor(Math.random() * 80) + 10;
      const randomLeft = Math.floor(Math.random() * 80) + 10;
      setButtonPos({ top: `${randomTop}%`, left: `${randomLeft}%` });
      setHoverCount(prev => prev + 1);
    } else {
      setHoverCount(5);
    }
  };

  const handleClick = () => {
    if (hoverCount >= 4) {
      setIsSuccess(true);
    }
  };

  const fireworkParticles = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    angle: (i * 360) / 40,
    velocity: Math.random() * 100 + 50,
  }));

  const textToDisplay = dbData.length > 0 ? dbData[0].display_text : "Tương lai của bạn sẽ vô cùng rực rỡ và lấp lánh! ✨";
  const imagesToDisplay = dbData.length > 0 ? dbData : [
    { image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80" },
    { image_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80" },
    { image_url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=300&q=80" }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <GalaxyBackground />

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
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="z-10 w-full flex justify-center px-4"
          >
            <AdminPanel onBack={() => {
              setIsAdminOpen(false);
              window.location.hash = ''; // Clear hash
            }} />
          </motion.div>
        ) : !isSuccess ? (
          <motion.div 
            key="input-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            className="z-10 flex flex-col items-center justify-center w-full h-full absolute"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 text-center px-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              Bạn muốn biết điều gì về tương lai?
            </h1>
            
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập mong ước của bạn..."
              className="w-80 md:w-96 px-6 py-4 rounded-full bg-slate-900/60 backdrop-blur-lg border-2 border-pink-500/50 text-white focus:outline-none focus:border-pink-400 transition-all shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center text-xl placeholder-slate-400"
            />

            <motion.button
              onMouseEnter={handleMouseEnter}
              onClick={handleClick}
              style={{
                position: hoverCount > 0 && hoverCount < 5 ? 'absolute' : 'relative',
                top: hoverCount > 0 && hoverCount < 5 ? buttonPos.top : '2rem',
                left: hoverCount > 0 && hoverCount < 5 ? buttonPos.left : 'auto',
                transform: hoverCount > 0 && hoverCount < 5 ? 'translate(-50%, -50%)' : 'none'
              }}
              animate={{
                scale: hoverCount === 5 ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 0.3,
                scale: { repeat: hoverCount === 5 ? Infinity : 0, duration: 1 }
              }}
              className={`mt-8 px-10 py-4 rounded-full font-bold text-xl transition-all duration-300 ${
                hoverCount >= 4 
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 shadow-[0_0_30px_rgba(52,211,153,0.8)] text-slate-900 hover:scale-110' 
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 shadow-[0_0_20px_rgba(236,72,153,0.6)] text-white'
              }`}
            >
              {hoverCount >= 4 ? 'BẮT ĐẦU NGAY!' : 'BẮT ĐẦU'}
            </motion.button>
            
            {hoverCount > 0 && hoverCount < 5 && (
              <p className="mt-20 text-pink-300 italic text-lg drop-shadow-md">Haha đố bạn bấm được đấy! (Còn {5 - hoverCount} lần)</p>
            )}
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

            <motion.h2 
              initial={{ y: -50, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-4xl md:text-5xl font-extrabold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-pink-300 to-cyan-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] max-w-3xl"
            >
              {textToDisplay}
            </motion.h2>

            <div className="flex flex-wrap justify-center items-center gap-6 w-full max-w-6xl px-4 py-8">
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
