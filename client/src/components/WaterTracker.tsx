import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/UserContext";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AddWaterModal from "./AddWaterModal";

export default function WaterTracker() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [totalWater, setTotalWater] = useState(0);
  const [isAddWaterModalOpen, setIsAddWaterModalOpen] = useState(false);
  
  // User's water target (default: 2500ml)
  const waterTarget = user?.waterTarget || 2500;
  
  // Fetch water entries for the day
  const { data: waterEntries, isLoading } = useQuery({
    queryKey: [
      `/api/users/${user?.id}/water-entries`, 
      format(selectedDate, 'yyyy-MM-dd')
    ],
    enabled: !!user?.id
  });
  
  // Calculate total water intake
  useEffect(() => {
    if (waterEntries) {
      const total = waterEntries.reduce((sum, entry) => sum + entry.amount, 0);
      setTotalWater(total);
    }
  }, [waterEntries]);
  
  // Add water mutation
  const addWaterMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest("POST", "/api/water-entries", {
        userId: user?.id,
        amount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/users/${user?.id}/water-entries`] 
      });
      toast({
        title: "Water added",
        description: "Your water intake has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add water",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Quick add 250ml of water
  const handleQuickAdd = () => {
    if (user?.id) {
      addWaterMutation.mutate(250);
    }
  };
  
  // Calculate water progress for visualization
  const waterProgress = Math.min(100, (totalWater / waterTarget) * 100);
  const glassCount = 8; // Number of glasses to display
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Water Intake</h3>
        <span className="text-sm text-accent font-medium">
          {(totalWater / 1000).toFixed(1)}L / {(waterTarget / 1000).toFixed(1)}L
        </span>
      </div>
      
      <Card className="bg-white rounded-xl border border-neutral-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-1">
              {Array(glassCount).fill(0).map((_, i) => {
                // Calculate fill level for each glass
                const glassIndex = i + 1;
                const glassThreshold = (glassIndex / glassCount) * 100;
                const fillPercentage = Math.max(0, Math.min(100, waterProgress - (glassThreshold - (100 / glassCount))));
                
                return (
                  <div key={i} className="h-12 w-8 mr-1 relative">
                    <div 
                      className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-accent"
                      style={{ height: `${fillPercentage}%`, opacity: 0.8 }}
                    ></div>
                    <div 
                      className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-accent"
                      style={{ height: `${fillPercentage * 0.6}%`, opacity: 0.6 }}
                    ></div>
                  </div>
                );
              })}
            </div>
            
            <div className="ml-4 flex flex-col items-center">
              <Button 
                onClick={handleQuickAdd}
                className="bg-accent text-white w-10 h-10 rounded-full flex items-center justify-center mb-1 p-0"
                disabled={addWaterMutation.isPending}
              >
                {addWaterMutation.isPending ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-plus"></i>
                )}
              </Button>
              <span className="text-xs text-neutral-500">Add</span>
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-neutral-500">
            <span>0L</span>
            <span>{(waterTarget / 1000).toFixed(1)}L</span>
          </div>
          
          <Button
            variant="outline"
            className="w-full mt-3 text-accent border-accent/30 hover:bg-accent/10"
            onClick={() => setIsAddWaterModalOpen(true)}
          >
            Add Custom Amount
          </Button>
        </CardContent>
      </Card>
      
      <AddWaterModal
        isOpen={isAddWaterModalOpen}
        onClose={() => setIsAddWaterModalOpen(false)}
        onAddWater={(amount) => {
          if (user?.id) {
            addWaterMutation.mutate(amount);
            setIsAddWaterModalOpen(false);
          }
        }}
      />
    </div>
  );
}
