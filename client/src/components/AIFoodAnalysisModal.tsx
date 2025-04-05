import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useUser } from "@/contexts/UserContext";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FoodItem } from "@/types";

interface AIFoodAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItems: FoodItem[];
}

export default function AIFoodAnalysisModal({ isOpen, onClose, foodItems }: AIFoodAnalysisModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [items, setItems] = useState<(FoodItem & { selected: boolean })[]>(
    foodItems.map(item => ({ ...item, selected: true }))
  );
  const [activeMealType, setActiveMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  
  // Calculate nutrition totals for selected items
  const totals = items
    .filter(item => item.selected)
    .reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  
  // Calculate macro percentages
  const totalMacros = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;
  const proteinPercentage = totalMacros > 0 ? Math.round((totals.protein * 4 / totalMacros) * 100) : 0;
  const carbsPercentage = totalMacros > 0 ? Math.round((totals.carbs * 4 / totalMacros) * 100) : 0;
  const fatPercentage = totalMacros > 0 ? Math.round((totals.fat * 9 / totalMacros) * 100) : 0;
  
  // Handle serving size change
  const handleServingSizeChange = (index: number, value: string) => {
    const newItems = [...items];
    const newSize = parseFloat(value);
    
    if (isNaN(newSize) || newSize <= 0) return;
    
    const ratio = newSize / newItems[index].servingSize;
    
    newItems[index] = {
      ...newItems[index],
      servingSize: newSize,
      calories: Math.round(newItems[index].calories * ratio),
      protein: +(newItems[index].protein * ratio).toFixed(1),
      carbs: +(newItems[index].carbs * ratio).toFixed(1),
      fat: +(newItems[index].fat * ratio).toFixed(1)
    };
    
    setItems(newItems);
  };
  
  // Handle checkbox toggle
  const handleCheckboxToggle = (index: number) => {
    const newItems = [...items];
    newItems[index].selected = !newItems[index].selected;
    setItems(newItems);
  };
  
  // Save meal mutation
  const saveMealMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Only save selected items
      const selectedItems = items.filter(item => item.selected);
      
      // Create a food entry for each selected item
      const promises = selectedItems.map(item => 
        apiRequest("POST", "/api/food-entries", {
          userId: user.id,
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          mealType: activeMealType,
          servingSize: item.servingSize,
          servingUnit: item.servingUnit,
          imageUrl: item.imageUrl
        })
      );
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${user?.id}/food-entries`]
      });
      toast({
        title: "Meal saved",
        description: `Added ${items.filter(i => i.selected).length} items to your food diary`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to save meal",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Meal type configuration
  const mealTypeConfig = {
    breakfast: {
      title: "Breakfast",
      icon: "fa-mug-hot",
      bgColor: "bg-amber-100",
      textColor: "text-amber-700",
    },
    lunch: {
      title: "Lunch",
      icon: "fa-burger",
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
    },
    dinner: {
      title: "Dinner",
      icon: "fa-bowl-food",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
    },
    snack: {
      title: "Snack",
      icon: "fa-cookie",
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-black/90 p-0 text-white border-none max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-5 flex flex-row justify-between items-center">
          <button onClick={onClose} className="text-white">
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <DialogTitle className="text-white font-semibold">AI Food Analysis</DialogTitle>
          <div className="w-8"></div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-5">
          {/* Food Photo - In a real implementation, this would be the captured image */}
          <div className="w-full aspect-square rounded-xl overflow-hidden mb-5 bg-neutral-800 flex items-center justify-center">
            <i className="fas fa-utensils text-6xl text-white/30"></i>
          </div>
          
          {/* Analysis Results */}
          <div className="bg-white rounded-xl p-4 mb-5 text-black">
            <h4 className="font-medium mb-3">AI Detected Foods:</h4>
            
            {items.length > 0 ? (
              items.map((food, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-neutral-100 last:border-b-0">
                  <div className="flex items-center">
                    <Checkbox 
                      checked={food.selected} 
                      onCheckedChange={() => handleCheckboxToggle(index)}
                      className="w-5 h-5 rounded text-primary mr-3"
                    />
                    <span className="font-medium">{food.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Input 
                      type="number" 
                      value={food.servingSize} 
                      onChange={(e) => handleServingSizeChange(index, e.target.value)}
                      className="w-16 bg-neutral-100 rounded text-right px-2 py-1"
                      min={0}
                    />
                    <span className="text-sm text-neutral-500 ml-2">{food.servingUnit}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-neutral-500">
                No food items detected
              </div>
            )}
            
            <Button 
              className="w-full bg-primary/10 text-primary font-medium py-2 rounded-lg mt-3 flex items-center justify-center"
              variant="ghost"
              onClick={onClose}
            >
              <i className="fas fa-plus mr-2 text-sm"></i> Add more items
            </Button>
          </div>
          
          {/* Nutrition Summary */}
          <div className="bg-white rounded-xl p-4 mb-5 text-black">
            <h4 className="font-medium mb-3">Nutrition Summary:</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="bg-neutral-50 p-3 rounded-lg">
                <p className="text-sm text-neutral-500 mb-1">Calories</p>
                <p className="text-xl font-semibold">{totals.calories} kcal</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <p className="text-sm text-neutral-500 mb-1">Protein</p>
                <p className="text-xl font-semibold">{totals.protein} g</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <p className="text-sm text-neutral-500 mb-1">Carbs</p>
                <p className="text-xl font-semibold">{totals.carbs} g</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <p className="text-sm text-neutral-500 mb-1">Fat</p>
                <p className="text-xl font-semibold">{totals.fat} g</p>
              </div>
            </div>
            
            <div className="h-4 bg-neutral-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-primary" style={{ width: `${proteinPercentage}%` }}></div>
              <div className="h-full bg-accent" style={{ width: `${carbsPercentage}%` }}></div>
              <div className="h-full bg-yellow-400" style={{ width: `${fatPercentage}%` }}></div>
            </div>
            <div className="flex text-xs justify-between mt-1">
              <span className="text-primary">Protein {proteinPercentage}%</span>
              <span className="text-accent">Carbs {carbsPercentage}%</span>
              <span className="text-yellow-400">Fat {fatPercentage}%</span>
            </div>
          </div>
          
          {/* Meal Selection */}
          <div className="bg-white rounded-xl p-4 mb-5 text-black">
            <h4 className="font-medium mb-3">Add to meal:</h4>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(mealTypeConfig).map(([type, config]) => (
                <Button 
                  key={type}
                  variant="ghost"
                  className={`py-3 ${config.bgColor} ${config.textColor} font-medium flex items-center justify-center ${activeMealType === type ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setActiveMealType(type as any)}
                >
                  <i className={`fas ${config.icon} mr-2`}></i> {config.title}
                </Button>
              ))}
            </div>
          </div>
          
          <Button 
            className="w-full bg-primary text-white font-medium py-4 rounded-xl mb-5"
            onClick={() => saveMealMutation.mutate()}
            disabled={saveMealMutation.isPending || items.filter(i => i.selected).length === 0}
          >
            {saveMealMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i> Saving...
              </>
            ) : (
              "Save to Food Diary"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
