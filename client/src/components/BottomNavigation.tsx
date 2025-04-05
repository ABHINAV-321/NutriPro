import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Camera } from "./ui/camera";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AIFoodAnalysisModal from "./AIFoodAnalysisModal";
import { FoodItem } from "@/types";

export default function BottomNavigation() {
  const [location] = useLocation();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedFood, setAnalyzedFood] = useState<FoodItem[]>([]);
  const { toast } = useToast();

  const handleCameraCapture = async (imageData: string) => {
    try {
      setIsAnalyzing(true);
      
      // Send image to API for analysis
      const response = await apiRequest("POST", "/api/analyze-food-image", {
        image: imageData
      });
      
      const result = await response.json();
      
      if (result.success && result.items.length > 0) {
        setAnalyzedFood(result.items);
        setIsAnalysisModalOpen(true);
      } else {
        toast({
          title: "Analysis Failed",
          description: result.message || "Could not identify food in the image",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error analyzing food image:", error);
      toast({
        title: "Analysis Failed",
        description: "An error occurred while analyzing the image",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const navItems = [
    { path: "/", icon: "fa-home", label: "Home" },
    { path: "/diary", icon: "fa-utensils", label: "Diary" },
    { path: null, icon: "fa-camera", label: "Camera" },
    { path: "/progress", icon: "fa-chart-line", label: "Progress" },
    { path: "/coach", icon: "fa-user-doctor", label: "Coach" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 py-2 z-20">
        <div className="max-w-lg mx-auto flex justify-around">
          {navItems.map((item, index) => {
            if (item.path === null) {
              // Camera button in the middle
              return (
                <div key={index} className="relative -mt-5">
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <i className="fas fa-spinner fa-spin text-xl"></i>
                    ) : (
                      <i className={`fas ${item.icon} text-xl`}></i>
                    )}
                  </button>
                </div>
              );
            }
            
            // Regular nav items
            const isActive = location === item.path;
            return (
              <Link href={item.path} key={index}>
                <button className={cn(
                  "flex flex-col items-center px-5 py-1",
                  isActive ? "text-primary" : "text-neutral-400"
                )}>
                  <i className={`fas ${item.icon} text-lg`}></i>
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Camera component */}
      <Camera 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
      
      {/* Food Analysis Modal */}
      <AIFoodAnalysisModal 
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        foodItems={analyzedFood}
      />
    </>
  );
}
