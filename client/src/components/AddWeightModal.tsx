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
  FormField,
  FormItem,
  FormLabel,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { insertWeightLogSchema } from "@shared/schema";

interface AddWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeight?: number;
}

export default function AddWeightModal({ isOpen, onClose, currentWeight }: AddWeightModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  
  // Create form schema with validation
  const weightSchema = insertWeightLogSchema.extend({
    weight: z.coerce.number().min(20, "Weight must be at least 20kg").max(300, "Weight must be less than 300kg"),
    userId: z.number().optional()
  });
  
  type WeightFormValues = z.infer<typeof weightSchema>;
  
  // Initialize form
  const form = useForm<WeightFormValues>({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      userId: user?.id,
      weight: currentWeight || 70
    }
  });
  
  // Update values when user or currentWeight changes
  if (user?.id && form.getValues().userId !== user.id) {
    form.setValue("userId", user.id);
  }
  
  if (currentWeight && form.getValues().weight !== currentWeight) {
    form.setValue("weight", currentWeight);
  }
  
  // Add weight log mutation
  const addWeightMutation = useMutation({
    mutationFn: async (values: WeightFormValues) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      return apiRequest("POST", "/api/weight-logs", {
        userId: user.id,
        weight: values.weight
      });
    },
    onSuccess: () => {
      // Invalidate weight logs and user queries
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${user?.id}/weight-logs`]
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${user?.id}`]
      });
      
      toast({
        title: "Weight logged",
        description: `Your weight has been updated to ${form.getValues().weight}kg`,
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to log weight",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (values: WeightFormValues) => {
    addWeightMutation.mutate(values);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white rounded-lg w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Log Your Weight</DialogTitle>
        </DialogHeader>
        
        <div className="py-2 text-center text-sm text-neutral-500">
          Today, {format(new Date(), 'MMMM d, yyyy')}
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Weight (kg)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      min="20" 
                      max="300" 
                      {...field} 
                      className="text-center text-2xl h-16 font-semibold"
                    />
                  </FormControl>
                  {user?.goalWeight && (
                    <FormDescription className="text-center">
                      Goal: {user.goalWeight}kg ({user.weight && user.weight > user.goalWeight ? 
                        `${(user.weight - user.goalWeight).toFixed(1)}kg to lose` : 
                        `${(user.goalWeight - (user.weight || 0)).toFixed(1)}kg to gain`})
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />
            
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addWeightMutation.isPending}
              >
                {addWeightMutation.isPending ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : null}
                Save Weight
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
