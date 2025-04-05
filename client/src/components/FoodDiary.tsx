import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format } from "date-fns";
import { FoodEntry } from "@shared/schema";
import AddMealModal from "./AddMealModal";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export default function FoodDiary() {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeMealType, setActiveMealType] = useState<MealType | null>(null);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  
  // Fetch food entries for the selected date
  const { data: foodEntries, isLoading } = useQuery<FoodEntry[]>({
    queryKey: [
      `/api/users/${user?.id}/food-entries`, 
      format(selectedDate, 'yyyy-MM-dd')
    ],
    enabled: !!user?.id
  });

  const mealTypeConfig = {
    breakfast: {
      title: "Breakfast",
      icon: "fa-mug-hot",
      bgColor: "bg-amber-100",
      iconColor: "text-amber-500"
    },
    lunch: {
      title: "Lunch",
      icon: "fa-burger",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-500"
    },
    dinner: {
      title: "Dinner",
      icon: "fa-bowl-food",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-500"
    },
    snack: {
      title: "Snacks",
      icon: "fa-cookie",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-500"
    }
  };

  // Group food entries by meal type
  const getMealEntries = (mealType: MealType) => {
    if (!foodEntries) return [];
    return foodEntries.filter(entry => entry.mealType === mealType);
  };

  // Calculate total calories for a meal type
  const getMealCalories = (mealType: MealType) => {
    const entries = getMealEntries(mealType);
    return entries.reduce((sum, entry) => sum + entry.calories, 0);
  };

  const handleAddMeal = (mealType: MealType) => {
    setActiveMealType(mealType);
    setIsAddMealModalOpen(true);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Today's Meals</h3>
        <Button variant="link" className="text-sm text-primary p-0 font-medium h-auto">
          View All
        </Button>
      </div>
      
      {/* Meal Sections */}
      {Object.entries(mealTypeConfig).map(([type, config]) => (
        <Card key={type} className="bg-white rounded-xl border border-neutral-200 mb-3">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center mr-3`}>
                  <i className={`fas ${config.icon} ${config.iconColor} text-sm`}></i>
                </div>
                <h4 className="font-medium">{config.title}</h4>
              </div>
              <span className="text-sm text-neutral-500">
                {isLoading ? <Skeleton className="h-4 w-16" /> : `${getMealCalories(type as MealType)} cal`}
              </span>
            </div>
            
            {/* Food Items */}
            {isLoading ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                  <div className="flex items-center">
                    <Skeleton className="w-10 h-10 rounded-lg mr-3" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : (
              <>
                {getMealEntries(type as MealType).map(entry => (
                  <div key={entry.id} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                    <div className="flex items-center">
                      {entry.imageUrl ? (
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 mr-3 overflow-hidden">
                          <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 mr-3 flex items-center justify-center">
                          <i className={`fas ${config.icon} ${config.iconColor} text-sm`}></i>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{entry.name}</p>
                        <p className="text-xs text-neutral-500">
                          {entry.servingSize} {entry.servingUnit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{entry.calories} cal</p>
                      <div className="flex text-xs text-neutral-500 justify-end">
                        <span className="ml-1">P: {entry.protein}g</span>
                        <span className="ml-1">C: {entry.carbs}g</span>
                        <span className="ml-1">F: {entry.fat}g</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {getMealEntries(type as MealType).length === 0 && (
                  <div className="py-6 flex flex-col items-center justify-center text-neutral-400">
                    <i className={`fas ${config.icon} text-2xl mb-2`}></i>
                    <p className="text-sm">No {config.title.toLowerCase()} logged today</p>
                  </div>
                )}
              </>
            )}
            
            <Button 
              variant="ghost" 
              className="w-full mt-2 text-sm text-primary font-medium flex items-center justify-center p-0 h-8"
              onClick={() => handleAddMeal(type as MealType)}
            >
              <i className="fas fa-plus mr-1 text-xs"></i> Add {config.title}
            </Button>
          </CardContent>
        </Card>
      ))}
      
      {/* Add Meal Modal */}
      <AddMealModal 
        isOpen={isAddMealModalOpen}
        onClose={() => setIsAddMealModalOpen(false)}
        mealType={activeMealType}
      />
    </div>
  );
}
