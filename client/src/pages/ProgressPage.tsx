import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { WeightLog, FoodEntry, WaterEntry, WorkoutEntry } from "@shared/schema";
import { format, subDays, parseISO, startOfDay, endOfDay, addDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { calculateDailyNutrition } from "@/lib/foodUtils";
import { Button } from "@/components/ui/button";
import AddWeightModal from "@/components/AddWeightModal";

export default function ProgressPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("weight");
  const [dateRange, setDateRange] = useState<"week" | "month" | "3months">("week");
  const [isAddWeightModalOpen, setIsAddWeightModalOpen] = useState(false);
  
  // Get date range based on selection
  const getDateRange = () => {
    const endDate = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case "week":
        startDate = subDays(endDate, 7);
        break;
      case "month":
        startDate = subDays(endDate, 30);
        break;
      case "3months":
        startDate = subDays(endDate, 90);
        break;
    }
    
    return { startDate, endDate };
  };
  
  // Fetch weight logs
  const { data: weightLogs } = useQuery<WeightLog[]>({
    queryKey: [`/api/users/${user?.id}/weight-logs`],
    enabled: !!user?.id
  });
  
  // Fetch food entries
  const { data: foodEntries } = useQuery<FoodEntry[]>({
    queryKey: [`/api/users/${user?.id}/food-entries`],
    enabled: !!user?.id
  });
  
  // Fetch water entries
  const { data: waterEntries } = useQuery<WaterEntry[]>({
    queryKey: [`/api/users/${user?.id}/water-entries`],
    enabled: !!user?.id
  });
  
  // Fetch workout entries
  const { data: workoutEntries } = useQuery<WorkoutEntry[]>({
    queryKey: [`/api/users/${user?.id}/workout-entries`],
    enabled: !!user?.id
  });
  
  // Prepare weight chart data
  const getWeightChartData = () => {
    if (!weightLogs?.length) return [];
    
    const { startDate, endDate } = getDateRange();
    
    const filteredLogs = weightLogs
      .filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDate && logDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return filteredLogs.map(log => ({
      date: format(new Date(log.date), 'MMM d'),
      weight: log.weight
    }));
  };
  
  // Prepare nutrition chart data
  const getNutritionChartData = () => {
    if (!foodEntries?.length) return [];
    
    const { startDate, endDate } = getDateRange();
    
    // Group entries by date
    const entriesByDate = new Map<string, FoodEntry[]>();
    
    foodEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= startDate && entryDate <= endDate) {
        const dateKey = format(entryDate, 'yyyy-MM-dd');
        if (!entriesByDate.has(dateKey)) {
          entriesByDate.set(dateKey, []);
        }
        entriesByDate.get(dateKey)?.push(entry);
      }
    });
    
    // Calculate daily nutrition totals
    const result = [];
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const entries = entriesByDate.get(dateKey) || [];
      const { calories, protein, carbs, fat } = calculateDailyNutrition(entries);
      
      result.push({
        date: format(currentDate, 'MMM d'),
        calories,
        protein,
        carbs,
        fat
      });
      
      currentDate = addDays(currentDate, 1);
    }
    
    return result;
  };
  
  // Prepare water chart data
  const getWaterChartData = () => {
    if (!waterEntries?.length) return [];
    
    const { startDate, endDate } = getDateRange();
    
    // Group entries by date
    const entriesByDate = new Map<string, number>();
    
    waterEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= startDate && entryDate <= endDate) {
        const dateKey = format(entryDate, 'yyyy-MM-dd');
        const currentTotal = entriesByDate.get(dateKey) || 0;
        entriesByDate.set(dateKey, currentTotal + entry.amount);
      }
    });
    
    // Create daily water totals
    const result = [];
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const amount = entriesByDate.get(dateKey) || 0;
      
      result.push({
        date: format(currentDate, 'MMM d'),
        amount: amount / 1000 // Convert to liters
      });
      
      currentDate = addDays(currentDate, 1);
    }
    
    return result;
  };
  
  // Prepare workout chart data
  const getWorkoutChartData = () => {
    if (!workoutEntries?.length) return [];
    
    const { startDate, endDate } = getDateRange();
    
    // Group entries by date
    const entriesByDate = new Map<string, number>();
    
    workoutEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= startDate && entryDate <= endDate) {
        const dateKey = format(entryDate, 'yyyy-MM-dd');
        const currentTotal = entriesByDate.get(dateKey) || 0;
        entriesByDate.set(dateKey, currentTotal + entry.caloriesBurned);
      }
    });
    
    // Create daily workout totals
    const result = [];
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const calories = entriesByDate.get(dateKey) || 0;
      
      result.push({
        date: format(currentDate, 'MMM d'),
        calories
      });
      
      currentDate = addDays(currentDate, 1);
    }
    
    return result;
  };
  
  // Get macro distribution data
  const getMacroDistribution = () => {
    if (!foodEntries?.length) return [];
    
    const { startDate, endDate } = getDateRange();
    
    // Filter entries in date range
    const filteredEntries = foodEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
    
    // Calculate total macros
    const { protein, carbs, fat } = calculateDailyNutrition(filteredEntries);
    
    // Convert to calories
    const proteinCalories = protein * 4;
    const carbsCalories = carbs * 4;
    const fatCalories = fat * 9;
    const total = proteinCalories + carbsCalories + fatCalories;
    
    if (total === 0) return [];
    
    return [
      { name: 'Protein', value: Math.round((proteinCalories / total) * 100), calories: proteinCalories },
      { name: 'Carbs', value: Math.round((carbsCalories / total) * 100), calories: carbsCalories },
      { name: 'Fat', value: Math.round((fatCalories / total) * 100), calories: fatCalories }
    ];
  };
  
  const MACRO_COLORS = ['#10b981', '#0ea5e9', '#eab308'];
  
  const weightData = getWeightChartData();
  const nutritionData = getNutritionChartData();
  const waterData = getWaterChartData();
  const workoutData = getWorkoutChartData();
  const macroData = getMacroDistribution();
  
  return (
    <div className="pt-4 px-5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Progress Tracker</h2>
        <p className="text-neutral-500">Track your health and fitness progress</p>
      </div>
      
      <div className="mb-4">
        <Tabs defaultValue="weight" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="weight" className="flex-1">Weight</TabsTrigger>
            <TabsTrigger value="nutrition" className="flex-1">Nutrition</TabsTrigger>
            <TabsTrigger value="water" className="flex-1">Water</TabsTrigger>
            <TabsTrigger value="workout" className="flex-1">Workouts</TabsTrigger>
          </TabsList>
          
          <div className="mb-4 flex justify-between items-center">
            <div className="space-x-2">
              <Button 
                variant={dateRange === "week" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDateRange("week")}
              >
                Week
              </Button>
              <Button 
                variant={dateRange === "month" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDateRange("month")}
              >
                Month
              </Button>
              <Button 
                variant={dateRange === "3months" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDateRange("3months")}
              >
                3 Months
              </Button>
            </div>
            
            {activeTab === "weight" && (
              <Button 
                size="sm" 
                onClick={() => setIsAddWeightModalOpen(true)}
              >
                <i className="fas fa-plus mr-2"></i> Add Weight
              </Button>
            )}
          </div>
          
          <TabsContent value="weight" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Weight History</CardTitle>
              </CardHeader>
              <CardContent>
                {weightData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis 
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tickFormatter={(val) => `${val}kg`}
                        />
                        <Tooltip formatter={(value) => [`${value}kg`, 'Weight']} />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#14b8a6" 
                          strokeWidth={2}
                          activeDot={{ r: 6 }}
                        />
                        {user?.goalWeight && (
                          <Line 
                            type="monotone" 
                            dataKey="goal" 
                            stroke="#9333ea" 
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            data={weightData.map(() => ({ goal: user.goalWeight }))}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <i className="fas fa-weight-scale text-neutral-300 text-5xl mb-4"></i>
                      <p>No weight data available for this period</p>
                      <Button className="mt-4" onClick={() => setIsAddWeightModalOpen(true)}>
                        <i className="fas fa-plus mr-2"></i> Log Weight
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="nutrition" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calorie Intake</CardTitle>
              </CardHeader>
              <CardContent>
                {nutritionData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={nutritionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis 
                          tickFormatter={(val) => `${val}cal`}
                        />
                        <Tooltip formatter={(value) => [`${value}cal`, 'Calories']} />
                        <Bar dataKey="calories" fill="#14b8a6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <i className="fas fa-utensils text-neutral-300 text-5xl mb-4"></i>
                      <p>No nutrition data available for this period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Macronutrient Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {macroData.length > 0 ? (
                  <div className="h-[300px] flex items-center">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={macroData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="calories"
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            {macroData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={MACRO_COLORS[index % MACRO_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}cal`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2">
                      <ul className="space-y-2">
                        {macroData.map((macro, index) => (
                          <li key={index} className="flex items-center">
                            <span 
                              className="w-4 h-4 rounded-full mr-2" 
                              style={{ backgroundColor: MACRO_COLORS[index % MACRO_COLORS.length] }}
                            ></span>
                            <span>{macro.name}: {macro.value}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <i className="fas fa-chart-pie text-neutral-300 text-5xl mb-4"></i>
                      <p>No macro data available for this period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="water" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Water Intake</CardTitle>
              </CardHeader>
              <CardContent>
                {waterData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={waterData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis 
                          tickFormatter={(val) => `${val}L`}
                        />
                        <Tooltip formatter={(value) => [`${value}L`, 'Water']} />
                        <Bar dataKey="amount" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <i className="fas fa-glass-water text-neutral-300 text-5xl mb-4"></i>
                      <p>No water data available for this period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="workout" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Workout Calories Burned</CardTitle>
              </CardHeader>
              <CardContent>
                {workoutData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={workoutData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis 
                          tickFormatter={(val) => `${val}cal`}
                        />
                        <Tooltip formatter={(value) => [`${value}cal`, 'Calories Burned']} />
                        <Bar dataKey="calories" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <i className="fas fa-dumbbell text-neutral-300 text-5xl mb-4"></i>
                      <p>No workout data available for this period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Weight Modal */}
      <AddWeightModal
        isOpen={isAddWeightModalOpen}
        onClose={() => setIsAddWeightModalOpen(false)}
        currentWeight={user?.weight}
      />
    </div>
  );
}
