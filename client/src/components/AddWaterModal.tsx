import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AddWaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWater: (amount: number) => void;
}

export default function AddWaterModal({ isOpen, onClose, onAddWater }: AddWaterModalProps) {
  const [amount, setAmount] = useState(250); // Default: 250ml
  const [isCustom, setIsCustom] = useState(false);
  
  const quickAmounts = [100, 250, 500, 750, 1000]; // ml
  
  const handleQuickSelect = (selected: number) => {
    setAmount(selected);
    setIsCustom(false);
  };
  
  const handleSliderChange = (value: number[]) => {
    setAmount(value[0]);
    setIsCustom(true);
  };
  
  const handleSubmit = () => {
    onAddWater(amount);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white rounded-lg w-full max-w-md p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold text-center">Add Water</DialogTitle>
          <p className="text-center text-neutral-500">Keep track of your hydration</p>
        </DialogHeader>
        
        <div className="flex flex-col items-center mt-4 mb-4">
          <div className="text-5xl font-bold text-accent mb-2">
            {amount} <span className="text-2xl">ml</span>
          </div>
          
          <div className="w-full h-40 flex items-center justify-center relative">
            <div 
              className="w-28 h-28 mx-auto relative"
              style={{
                background: `radial-gradient(circle, rgba(14,165,233,0.2) 0%, rgba(14,165,233,0.1) 70%, rgba(14,165,233,0) 100%)`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center"
                  style={{
                    boxShadow: '0 0 20px rgba(14,165,233,0.3)'
                  }}
                >
                  <i className="fas fa-glass-water text-4xl text-accent"></i>
                </div>
              </div>
            </div>
            
            <div 
              className="absolute bottom-0 left-0 right-0 bg-accent/20 rounded-t-lg transition-all duration-500"
              style={{ 
                height: `${(amount / 1000) * 100}%`,
                maxHeight: '100%'
              }}
            >
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium mb-3">Quick Add:</h4>
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((ml) => (
              <Button
                key={ml}
                variant={amount === ml && !isCustom ? "default" : "outline"}
                className={`${amount === ml && !isCustom ? "bg-accent text-white" : "border-accent/30 text-accent hover:bg-accent/10"}`}
                onClick={() => handleQuickSelect(ml)}
              >
                {ml} ml
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium mb-3">Custom Amount:</h4>
          <Slider
            min={50}
            max={2000}
            step={50}
            value={[amount]}
            onValueChange={handleSliderChange}
            className="py-4"
          />
          <div className="flex justify-between text-sm text-neutral-500">
            <span>50ml</span>
            <span>2000ml</span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1 bg-accent" onClick={handleSubmit}>
            Add Water
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
