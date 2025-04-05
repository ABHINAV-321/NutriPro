import { CircularProgress } from "@/components/ui/circular-progress";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { FoodEntry } from "@shared/schema";
import { calculateDailyNutrition } from "@/lib/foodUtils";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export default function DailySummary() {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [nutrition, setNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  
  // Fetch food entries for the selected date
  const { data: foodEntries, isLoading } = useQuery<FoodEntry[]>({
    queryKey: [
      `/api/users/${user?.id}/food-entries`, 
      format(selectedDate, 'yyyy-MM-dd')
    ],
    enabled: !!user?.id
  });
  
  // Calculate nutrition totals when food entries change
  useEffect(() => {
    if (foodEntries) {
      const { calories, protein, carbs, fat } = calculateDailyNutrition(foodEntries);
      setNutrition({ calories, protein, carbs, fat });
    }
  }, [foodEntries]);
  
  // Calculate percentages for progress bars
  const caloriePercentage = Math.min(100, Math.round((nutrition.calories / (user?.dailyCalorieTarget || 2000)) * 100));
  const proteinPercentage = Math.min(100, Math.round((nutrition.protein / (user?.proteinTarget || 100)) * 100));
  const carbPercentage = Math.min(100, Math.round((nutrition.carbs / (user?.carbTarget || 200)) * 100));
  const fatPercentage = Math.min(100, Math.round((nutrition.fat / (user?.fatTarget || 60)) * 100));
  
  return (
    <Card className="bg-neutral-50 rounded-2xl shadow-sm">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Today's Summary</h3>
          <span className="text-sm text-neutral-500">
            {format(selectedDate, 'MMMM d, yyyy')}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          {/* Calories Circle */}
          <div className="flex flex-col items-center">
            <CircularProgress 
              value={nutrition.calories} 
              max={user?.dailyCalorieTarget || 2000}
              size={80}
              strokeWidth={5}
              progressClassName="stroke-primary"
              className="mb-2"
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-lg font-semibold">{nutrition.calories}</span>
                <span className="text-xs text-neutral-500">/ {user?.dailyCalorieTarget || 2000}</span>
              </div>
            </CircularProgress>
            <span className="text-sm font-medium">Calories</span>
          </div>
          
          {/* Macros Breakdown */}
          <div className="space-y-2 flex-1 ml-5">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Protein</span>
                <span className="text-neutral-600">
                  {nutrition.protein}g / {user?.proteinTarget || 100}g
                </span>
              </div>
              <Progress value={proteinPercentage} className="h-2 bg-neutral-200" indicatorClassName="bg-secondary" />
            </div>
            
            {/* Carbs */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Carbs</span>
                <span className="text-neutral-600">
                  {nutrition.carbs}g / {user?.carbTarget || 200}g
                </span>
              </div>
              <Progress value={carbPercentage} className="h-2 bg-neutral-200" indicatorClassName="bg-accent" />
            </div>
            
            {/* Fat */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Fat</span>
                <span className="text-neutral-600">
                  {nutrition.fat}g / {user?.fatTarget || 60}g
                </span>
              </div>
              <Progress value={fatPercentage} className="h-2 bg-neutral-200" indicatorClassName="bg-yellow-400" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
