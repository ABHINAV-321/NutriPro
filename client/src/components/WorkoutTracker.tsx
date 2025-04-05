import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { WorkoutEntry } from "@shared/schema";
import { useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import AddWorkoutModal from "./AddWorkoutModal";

export default function WorkoutTracker() {
  const { user } = useUser();
  const [isAddWorkoutModalOpen, setIsAddWorkoutModalOpen] = useState(false);
  
  // Fetch recent workouts
  const { data: workouts, isLoading } = useQuery<WorkoutEntry[]>({
    queryKey: [`/api/users/${user?.id}/workout-entries`],
    enabled: !!user?.id
  });
  
  // Get recent workouts (max 2)
  const recentWorkouts = workouts?.slice(0, 2) || [];
  
  // Icons for different workout types
  const getWorkoutIcon = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case 'cardio':
      case 'running':
        return 'fa-person-running';
      case 'cycling':
        return 'fa-bicycle';
      case 'swimming':
        return 'fa-person-swimming';
      case 'strength':
      case 'weightlifting':
        return 'fa-dumbbell';
      case 'yoga':
        return 'fa-om';
      default:
        return 'fa-dumbbell';
    }
  };
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Recent Workouts</h3>
        <Button variant="link" className="text-sm text-primary p-0 font-medium h-auto">
          View All
        </Button>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeletons
          Array(2).fill(0).map((_, i) => (
            <Card key={i} className="bg-white rounded-xl border border-neutral-200">
              <CardContent className="p-4 flex items-center">
                <Skeleton className="w-12 h-12 rounded-full mr-4" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Workout list
          <>
            {recentWorkouts.length > 0 ? (
              recentWorkouts.map(workout => (
                <Card key={workout.id} className="bg-white rounded-xl border border-neutral-200">
                  <CardContent className="p-4 flex items-center">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mr-4">
                      <i className={`fas ${getWorkoutIcon(workout.workoutType)} text-secondary`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{workout.name}</h4>
                        <span className="text-sm bg-secondary/10 text-secondary font-medium px-2 py-1 rounded-full">
                          {workout.caloriesBurned} cal
                        </span>
                      </div>
                      <div className="flex text-sm text-neutral-500 mt-1">
                        {workout.workoutType && (
                          <>
                            <span>{workout.workoutType}</span>
                            <span className="mx-2">•</span>
                          </>
                        )}
                        <span>{workout.duration} min</span>
                        <span className="mx-2">•</span>
                        <span>{format(new Date(workout.date), 'MMM d')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-neutral-400 bg-white rounded-xl border border-neutral-200 p-4">
                <i className="fas fa-dumbbell text-3xl mb-3"></i>
                <p className="text-center">No workouts logged yet</p>
                <p className="text-center text-sm mt-1">Track your exercise to see your progress</p>
              </div>
            )}
          </>
        )}
        
        <Button 
          className="w-full py-3 bg-secondary/10 text-secondary font-medium rounded-xl flex items-center justify-center"
          variant="ghost"
          onClick={() => setIsAddWorkoutModalOpen(true)}
        >
          <i className="fas fa-plus mr-2"></i> Log New Workout
        </Button>
      </div>
      
      <AddWorkoutModal
        isOpen={isAddWorkoutModalOpen}
        onClose={() => setIsAddWorkoutModalOpen(false)}
      />
    </div>
  );
}
