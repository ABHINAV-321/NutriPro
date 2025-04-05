import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { WeightLog } from "@shared/schema";
import AddWeightModal from "./AddWeightModal";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { format, subMonths } from "date-fns";

export default function WeightTracker() {
  const { user } = useUser();
  const [isAddWeightModalOpen, setIsAddWeightModalOpen] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Fetch weight logs
  const { data: weightLogs, isLoading } = useQuery<WeightLog[]>({
    queryKey: [`/api/users/${user?.id}/weight-logs`],
    enabled: !!user?.id
  });
  
  // Prepare chart data when weight logs are loaded
  useEffect(() => {
    if (weightLogs?.length) {
      // Sort by date and transform for chart
      const sortedLogs = [...weightLogs].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      const data = sortedLogs.map(log => ({
        date: format(new Date(log.date), 'MMM d'),
        weight: log.weight
      }));
      
      setChartData(data);
    } else {
      // Generate sample data if no logs yet
      const today = new Date();
      const sampleData = [];
      
      if (user?.weight && user.goalWeight) {
        const difference = user.weight - user.goalWeight;
        const steps = 5; // Number of data points
        
        for (let i = 0; i < steps; i++) {
          const date = subMonths(today, steps - i - 1);
          const weight = user.weight - (difference * (i / steps));
          
          sampleData.push({
            date: format(date, 'MMM d'),
            weight: Number(weight.toFixed(1))
          });
        }
        
        sampleData.push({
          date: format(today, 'MMM d'),
          weight: user.weight
        });
        
        setChartData(sampleData);
      }
    }
  }, [weightLogs, user]);
  
  // Calculate weight to lose/gain
  const calculateWeightDifference = () => {
    if (!user?.weight || !user?.goalWeight) return null;
    
    const difference = user.weight - user.goalWeight;
    const isGain = difference < 0;
    
    return {
      value: Math.abs(difference).toFixed(1),
      isGain
    };
  };
  
  const weightDiff = calculateWeightDifference();
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Weight Tracking</h3>
        <Button variant="link" className="text-sm text-primary p-0 font-medium h-auto" onClick={() => setIsAddWeightModalOpen(true)}>
          Add Weight
        </Button>
      </div>
      
      <Card className="bg-white rounded-xl border border-neutral-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-neutral-500">Current Weight</p>
              <p className="text-2xl font-semibold">{user?.weight?.toFixed(1) || "--"} kg</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Goal Weight</p>
              <p className="text-2xl font-semibold">{user?.goalWeight?.toFixed(1) || "--"} kg</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">To Go</p>
              {weightDiff ? (
                <p className={`text-2xl font-semibold ${weightDiff.isGain ? "text-secondary" : "text-primary"}`}>
                  {weightDiff.isGain ? "+" : "-"}{weightDiff.value} kg
                </p>
              ) : (
                <p className="text-2xl font-semibold">--</p>
              )}
            </div>
          </div>
          
          <div className="h-40 relative">
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} kg`, 'Weight']}
                    contentStyle={{ 
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#14b8a6" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    dot={{ r: 4 }}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
      
      <AddWeightModal
        isOpen={isAddWeightModalOpen}
        onClose={() => setIsAddWeightModalOpen(false)}
        currentWeight={user?.weight}
      />
    </div>
  );
}
