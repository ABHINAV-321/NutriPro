import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { insertWorkoutEntrySchema } from "@shared/schema";

interface AddWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddWorkoutModal({ isOpen, onClose }: AddWorkoutModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  
  // Workout types
  const workoutTypes = [
    { value: "cardio", label: "Cardio" },
    { value: "strength", label: "Strength Training" },
    { value: "yoga", label: "Yoga" },
    { value: "cycling", label: "Cycling" },
    { value: "swimming", label: "Swimming" },
    { value: "running", label: "Running" },
    { value: "walking", label: "Walking" },
    { value: "hiking", label: "Hiking" },
    { value: "other", label: "Other" }
  ];
  
  // Create form schema with validation
  const workoutSchema = insertWorkoutEntrySchema.extend({
    userId: z.number().optional(),
    duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
    caloriesBurned: z.coerce.number().min(0, "Calories burned must be 0 or greater")
  });
  
  type WorkoutFormValues = z.infer<typeof workoutSchema>;
  
  // Initialize form
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      userId: user?.id,
      name: "",
      duration: 30,
      caloriesBurned: 0,
      workoutType: "cardio"
    }
  });
  
  // Update userId when user changes
  if (user?.id && form.getValues().userId !== user.id) {
    form.setValue("userId", user.id);
  }
  
  // Add workout mutation
  const addWorkoutMutation = useMutation({
    mutationFn: async (workout: WorkoutFormValues) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      return apiRequest("POST", "/api/workout-entries", {
        ...workout,
        userId: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${user?.id}/workout-entries`]
      });
      toast({
        title: "Workout added",
        description: "Your workout has been added to your activity log",
      });
      onClose();
      form.reset({
        userId: user?.id,
        name: "",
        duration: 30,
        caloriesBurned: 0,
        workoutType: "cardio"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add workout",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (values: WorkoutFormValues) => {
    addWorkoutMutation.mutate(values);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white rounded-lg w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Log Workout</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Morning Run, Yoga, etc." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="workoutType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workout type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workoutTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="caloriesBurned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories Burned</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-secondary hover:bg-secondary/90"
                disabled={addWorkoutMutation.isPending}
              >
                {addWorkoutMutation.isPending ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : null}
                Save Workout
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
