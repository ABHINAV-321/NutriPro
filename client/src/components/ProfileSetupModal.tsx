import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProfileSetupModalProps {
  onClose: () => void;
}

export default function ProfileSetupModal({ onClose }: ProfileSetupModalProps) {
  const { user, setUser } = useUser();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    age: z.coerce.number().min(13, "You must be at least 13 years old").max(120, "Age must be less than 120"),
    gender: z.enum(["male", "female", "other"]),
    height: z.coerce.number().min(100, "Height must be at least 100cm").max(250, "Height must be less than 250cm"),
    weight: z.coerce.number().min(30, "Weight must be at least 30kg").max(300, "Weight must be less than 300kg"),
    goalWeight: z.coerce.number().min(30, "Goal weight must be at least 30kg").max(300, "Goal weight must be less than 300kg"),
    activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very active"]),
    goal: z.enum(["lose", "maintain", "gain"])
  });
  
  type ProfileFormValues = z.infer<typeof profileSchema>;
  
  // Initialize form with existing user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      age: user?.age || undefined,
      gender: (user?.gender as any) || "other",
      height: user?.height || undefined,
      weight: user?.weight || undefined,
      goalWeight: user?.goalWeight || undefined,
      activityLevel: (user?.activityLevel as any) || "moderate",
      goal: (user?.goal as any) || "lose"
    }
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // First, calculate nutrition targets
      const targetsResponse = await apiRequest("POST", "/api/calculate-nutrition-targets", values);
      const targets = await targetsResponse.json();
      
      // Then update user profile with new values and targets
      const response = await apiRequest("PUT", `/api/users/${user.id}`, {
        ...values,
        dailyCalorieTarget: targets.dailyCalorieTarget,
        proteinTarget: targets.proteinTarget,
        carbTarget: targets.carbTarget,
        fatTarget: targets.fatTarget,
        waterTarget: 2500 // Default water target
      });
      
      return response.json();
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${user?.id}`]
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been set up successfully",
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };
  
  const nextStep = () => {
    const fieldsToValidate = 
      currentStep === 1 ? ['name', 'age', 'gender'] :
      currentStep === 2 ? ['height', 'weight', 'goalWeight'] : [];
    
    form.trigger(fieldsToValidate as any).then(isValid => {
      if (isValid) {
        setCurrentStep(currentStep + 1);
      }
    });
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="bg-white rounded-lg w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Set Up Your Profile
          </DialogTitle>
          <div className="flex justify-center space-x-1 mt-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  i + 1 === currentStep ? 'w-8 bg-primary' : 'w-4 bg-neutral-200'
                }`}
              ></div>
            ))}
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-medium text-center text-neutral-700">
                  Tell us about yourself
                </h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Jessica" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" min={13} max={120} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-medium text-center text-neutral-700">
                  Your Body Metrics
                </h3>
                
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" min={100} max={250} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" min={30} max={300} step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="goalWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" min={30} max={300} step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-medium text-center text-neutral-700">
                  Your Fitness Goals
                </h3>
                
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Weight Goal</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="lose" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Lose Weight
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="maintain" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Maintain Weight
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="gain" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Gain Weight
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="activityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Level</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your activity level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                          <SelectItem value="light">Light (exercise 1-3 days/week)</SelectItem>
                          <SelectItem value="moderate">Moderate (exercise 3-5 days/week)</SelectItem>
                          <SelectItem value="active">Active (exercise 6-7 days/week)</SelectItem>
                          <SelectItem value="very active">Very Active (intense exercise daily)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This helps us calculate your daily calorie needs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              {currentStep > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Back
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={onClose}>
                  Skip for Now
                </Button>
              )}
              
              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Continue
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : null}
                  Complete Setup
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
