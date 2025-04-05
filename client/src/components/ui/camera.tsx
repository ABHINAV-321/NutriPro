import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

interface CameraProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (image: string) => void;
}

export function Camera({ isOpen, onClose, onCapture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [activeTab, setActiveTab] = useState<"camera" | "gallery">("camera");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Start camera when dialog opens and tab is camera
  useEffect(() => {
    if (isOpen && activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

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

  // Handle file selection from gallery
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create a FileReader to read the file
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setPreviewImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  // Upload the selected gallery image
  const uploadSelectedImage = () => {
    if (previewImage) {
      onCapture(previewImage);
      onClose();
    }
  };

  // Open file picker
  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Clear selected image preview
  const clearSelectedImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "camera" | "gallery");
    setPreviewImage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-black p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-4 flex flex-row justify-between items-center">
          <button onClick={onClose} className="text-white">
            <i className="fas fa-xmark text-xl"></i>
          </button>
          <DialogTitle className="text-white font-semibold">Add Food Image</DialogTitle>
          <div className="w-8"></div>
        </DialogHeader>

        <Tabs defaultValue="camera" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-gray-800 rounded-none">
            <TabsTrigger value="camera" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
              <i className="fas fa-camera mr-2"></i> Camera
            </TabsTrigger>
            <TabsTrigger value="gallery" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
              <i className="fas fa-images mr-2"></i> Gallery
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="camera" className="mt-0">
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
          </TabsContent>
          
          <TabsContent value="gallery" className="mt-0">
            <div className="flex-1 flex items-center justify-center">
              {previewImage ? (
                <div className="relative w-full aspect-square overflow-hidden">
                  <img 
                    src={previewImage} 
                    alt="Selected from gallery" 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={clearSelectedImage}
                    className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                <div className="w-full aspect-square bg-black/20 flex items-center justify-center flex-col p-6 text-center">
                  <i className="fas fa-images text-white/50 text-4xl mb-4"></i>
                  <p className="text-white mb-4">Select an image from your gallery</p>
                  <Button 
                    onClick={openFilePicker}
                    variant="outline" 
                    className="bg-white text-black hover:bg-white/90"
                  >
                    <i className="fas fa-upload mr-2"></i> Browse Gallery
                  </Button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            <div className="p-5">
              {previewImage ? (
                <div className="flex justify-center">
                  <Button 
                    onClick={uploadSelectedImage}
                    className="bg-primary text-white hover:bg-primary/90 px-8"
                  >
                    <i className="fas fa-check mr-2"></i> Use This Image
                  </Button>
                </div>
              ) : (
                <p className="text-white text-center">
                  Select an image of your food for AI analysis
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
