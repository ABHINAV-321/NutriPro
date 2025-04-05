import { useUser } from "@/contexts/UserContext";
import DailySummary from "@/components/DailySummary";
import FoodDiary from "@/components/FoodDiary";
import WaterTracker from "@/components/WaterTracker";
import WeightTracker from "@/components/WeightTracker";
import WorkoutTracker from "@/components/WorkoutTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const { user } = useUser();
  
  const quickAddItems = [
    {
      title: "Log Meal",
      icon: "fa-utensils",
      bgColor: "bg-primary/10",
      iconBgColor: "bg-primary",
      hoverColor: "hover:bg-primary/20",
      onClick: () => {}
    },
    {
      title: "Log Water",
      icon: "fa-glass-water",
      bgColor: "bg-accent/10",
      iconBgColor: "bg-accent",
      hoverColor: "hover:bg-accent/20",
      onClick: () => {}
    },
    {
      title: "Log Workout",
      icon: "fa-dumbbell",
      bgColor: "bg-secondary/10",
      iconBgColor: "bg-secondary",
      hoverColor: "hover:bg-secondary/20",
      onClick: () => {}
    },
    {
      title: "Log Weight",
      icon: "fa-weight-scale",
      bgColor: "bg-purple-500/10",
      iconBgColor: "bg-purple-500",
      hoverColor: "hover:bg-purple-500/20",
      onClick: () => {}
    }
  ];
  
  return (
    <div className="pt-4 px-5 fade-in">
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">
          Hi, {user?.name || 'there'}!
        </h2>
        <p className="text-neutral-500">Let's track your health goals today</p>
      </div>
      
      {/* Daily Stats Summary */}
      <div className="mb-6">
        <DailySummary />
      </div>
      
      {/* Quick Add Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {quickAddItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            className={`h-auto p-4 flex flex-col items-center justify-center ${item.bgColor} ${item.hoverColor} transition rounded-xl`}
            onClick={item.onClick}
          >
            <div className={`w-10 h-10 rounded-full ${item.iconBgColor} flex items-center justify-center mb-2`}>
              <i className={`fas ${item.icon} text-white`}></i>
            </div>
            <span className="text-sm font-medium">{item.title}</span>
          </Button>
        ))}
      </div>
      
      {/* Food Diary Section */}
      <FoodDiary />
      
      {/* Water Intake Section */}
      <WaterTracker />
      
      {/* Weight Tracking Section */}
      <WeightTracker />
      
      {/* Recent Workouts Section */}
      <WorkoutTracker />
    </div>
  );
}
