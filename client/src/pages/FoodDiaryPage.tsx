import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { format, subDays, addDays, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { FoodEntry } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddMealModal from "@/components/AddMealModal";
import { calculateDailyNutrition } from "@/lib/foodUtils";
import { CircularProgress } from "@/components/ui/circular-progress";

export default function FoodDiaryPage() {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack" | null>(null);
  
  // Fetch food entries for the selected date
  const { data: foodEntries, isLoading } = useQuery<FoodEntry[]>({
    queryKey: [
      `/api/users/${user?.id}/food-entries`, 
      format(selectedDate, 'yyyy-MM-dd')
    ],
    enabled: !!user?.id
  });
  
  // Navigate to previous day
  const goToPreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };
  
  // Navigate to next day
  const goToNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };
  
  // Check if selected date is today
  const isToday = isSameDay(selectedDate, new Date());
  
  // Calculate nutrition totals for the day
  const { calories, protein, carbs, fat } = foodEntries 
    ? calculateDailyNutrition(foodEntries)
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  // Group food entries by meal type
  const getMealEntries = (mealType: string) => {
    if (!foodEntries) return [];
    return foodEntries.filter(entry => entry.mealType === mealType);
  };
  
  // Open add meal modal for specific meal type
  const handleAddMeal = (mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    setActiveMealType(mealType);
    setIsAddMealModalOpen(true);
  };
  
  // Meal type configuration
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
  
  return (
    <div className="pt-4 px-5">
      {/* Date Navigation */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
            <i className="fas fa-chevron-left"></i>
          </Button>
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {isToday ? 'Today' : format(selectedDate, 'MMMM d, yyyy')}
            </h2>
            <p className="text-sm text-neutral-500">
              {format(selectedDate, 'EEEE')}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goToNextDay}
            disabled={isToday}
          >
            <i className="fas fa-chevron-right"></i>
          </Button>
        </div>
      </div>
      
      {/* Nutrition Summary */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-semibold">Daily Summary</h3>
            <span className="text-sm text-neutral-500">
              {isToday ? 'Today' : format(selectedDate, 'MMM d')}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <CircularProgress 
              value={calories} 
              max={user?.dailyCalorieTarget || 2000}
              size={80}
              strokeWidth={5}
              progressClassName="stroke-primary"
              className="mb-2"
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-lg font-semibold">{calories}</span>
                <span className="text-xs text-neutral-500">/ {user?.dailyCalorieTarget || 2000}</span>
              </div>
            </CircularProgress>
            
            <div className="grid grid-cols-3 gap-3 flex-1 ml-6">
              <div className="bg-neutral-50 p-2 rounded-lg text-center">
                <p className="text-xs text-neutral-500 mb-1">Protein</p>
                <p className="font-semibold">
                  {protein}g
                  <span className="text-xs text-neutral-400 ml-1">
                    / {user?.proteinTarget || 100}g
                  </span>
                </p>
              </div>
              
              <div className="bg-neutral-50 p-2 rounded-lg text-center">
                <p className="text-xs text-neutral-500 mb-1">Carbs</p>
                <p className="font-semibold">
                  {carbs}g
                  <span className="text-xs text-neutral-400 ml-1">
                    / {user?.carbTarget || 200}g
                  </span>
                </p>
              </div>
              
              <div className="bg-neutral-50 p-2 rounded-lg text-center">
                <p className="text-xs text-neutral-500 mb-1">Fat</p>
                <p className="font-semibold">
                  {fat}g
                  <span className="text-xs text-neutral-400 ml-1">
                    / {user?.fatTarget || 60}g
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Meal Tabs */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="breakfast" className="flex-1">Breakfast</TabsTrigger>
          <TabsTrigger value="lunch" className="flex-1">Lunch</TabsTrigger>
          <TabsTrigger value="dinner" className="flex-1">Dinner</TabsTrigger>
          <TabsTrigger value="snack" className="flex-1">Snacks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-3 mt-0">
          {Object.entries(mealTypeConfig).map(([type, config]) => (
            <Card key={type} className="bg-white rounded-xl border border-neutral-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center mr-3`}>
                      <i className={`fas ${config.icon} ${config.iconColor} text-sm`}></i>
                    </div>
                    <h4 className="font-medium">{config.title}</h4>
                  </div>
                  <span className="text-sm text-neutral-500">
                    {getMealEntries(type).reduce((sum, entry) => sum + entry.calories, 0)} cal
                  </span>
                </div>
                
                {getMealEntries(type).length > 0 ? (
                  getMealEntries(type).map(entry => (
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
                  ))
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-neutral-400">
                    <i className={`fas ${config.icon} text-2xl mb-2`}></i>
                    <p className="text-sm">No {config.title.toLowerCase()} logged today</p>
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  className="w-full mt-2 text-sm text-primary font-medium flex items-center justify-center p-0 h-8"
                  onClick={() => handleAddMeal(type as any)}
                >
                  <i className="fas fa-plus mr-1 text-xs"></i> Add {config.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        {Object.entries(mealTypeConfig).map(([type, config]) => (
          <TabsContent key={type} value={type} className="mt-0">
            <Card className="bg-white rounded-xl border border-neutral-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center mr-3`}>
                      <i className={`fas ${config.icon} ${config.iconColor} text-sm`}></i>
                    </div>
                    <h4 className="font-medium">{config.title}</h4>
                  </div>
                  <span className="text-sm text-neutral-500">
                    {getMealEntries(type).reduce((sum, entry) => sum + entry.calories, 0)} cal
                  </span>
                </div>
                
                {getMealEntries(type).length > 0 ? (
                  getMealEntries(type).map(entry => (
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
                  ))
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-neutral-400">
                    <i className={`fas ${config.icon} text-2xl mb-2`}></i>
                    <p className="text-sm">No {config.title.toLowerCase()} logged today</p>
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  className="w-full mt-2 text-sm text-primary font-medium flex items-center justify-center p-0 h-8"
                  onClick={() => handleAddMeal(type as any)}
                >
                  <i className="fas fa-plus mr-1 text-xs"></i> Add {config.title}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Add Meal Modal */}
      <AddMealModal 
        isOpen={isAddMealModalOpen}
        onClose={() => setIsAddMealModalOpen(false)}
        mealType={activeMealType}
      />
    </div>
  );
}
