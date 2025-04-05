import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";

interface CameraProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (image: string) => void;
}

export function Camera({ isOpen, onClose, onCapture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt">("prompt");

  // Start camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setCameraPermission("granted");
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraPermission("denied");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to base64 image
        const imageData = canvas.toDataURL("image/jpeg");
        onCapture(imageData);
        
        // Close camera
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-black p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-4 flex flex-row justify-between items-center">
          <button onClick={onClose} className="text-white">
            <i className="fas fa-xmark text-xl"></i>
          </button>
          <DialogTitle className="text-white font-semibold">Snap Your Meal</DialogTitle>
          <div className="w-8"></div>
        </DialogHeader>
        
        <div className="flex-1 flex items-center justify-center">
          {cameraPermission === "granted" ? (
            <div className="relative w-full aspect-square overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              
              {/* Scan animation */}
              <div className="absolute left-0 right-0 h-1 bg-primary/60 animate-pulse"
                style={{ 
                  top: "50%", 
                  animation: "scanAnimation 2s infinite linear" 
                }}
              ></div>
              
              {/* Hidden canvas for capturing */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="w-full aspect-square bg-black/20 flex items-center justify-center flex-col p-6 text-center">
              <i className="fas fa-camera-slash text-white/50 text-4xl mb-4"></i>
              <p className="text-white mb-4">
                {cameraPermission === "denied" 
                  ? "Camera access was denied. Please enable camera permissions to use this feature." 
                  : "Waiting for camera access..."}
              </p>
              {cameraPermission === "denied" && (
                <Button onClick={startCamera} variant="outline" className="bg-white/10 text-white">
                  Try Again
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="p-5">
          <p className="text-white text-center mb-6">Position your food in the frame for AI analysis</p>
          <div className="flex justify-center">
            <button 
              onClick={captureImage}
              disabled={cameraPermission !== "granted"}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-full border-2 border-black"></div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
