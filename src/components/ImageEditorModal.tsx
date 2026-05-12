import { motion, AnimatePresence } from "motion/react";
import { Camera, Upload, X } from "lucide-react";
import { useState, useRef, ChangeEvent } from "react";

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageUrl: string) => void;
  title: string;
}

export default function ImageEditorModal({ isOpen, onClose, onSave, title }: ImageEditorModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setSelectedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (selectedImage) {
      onSave(selectedImage);
    }
    closeModal();
  };

  const closeModal = () => {
    stopCamera();
    setSelectedImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeModal} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h3>
             <button onClick={closeModal} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10">
               <X size={16} />
             </button>
          </div>

          <div className="flex flex-col gap-4">
            {!selectedImage && !isCameraActive && (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <Upload size={32} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest text-white/70">Upload</span>
                </button>
                <button 
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <Camera size={32} className="text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest text-white/70">Camera</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </div>
            )}

            {isCameraActive && (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
                 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                 <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <button 
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-white border-4 border-white/50 text-black flex items-center justify-center active:scale-95 transition-transform"
                    >
                       <Camera size={24} />
                    </button>
                 </div>
              </div>
            )}

            {selectedImage && (
               <div className="relative rounded-2xl overflow-hidden bg-black aspect-square border border-white/10">
                 <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                 <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white inset-0 m-auto mt-4 mr-4 hover:text-black transition-colors"
                  >
                    <X size={16} />
                 </button>
               </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />

            {selectedImage && (
              <button 
                onClick={handleSave}
                className="w-full py-4 mt-2 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-colors"
              >
                Save {title.split(' ')[1]}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
