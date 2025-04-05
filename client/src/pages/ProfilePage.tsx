import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
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
import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function ProfilePage() {
  const { user, setUser, logout } = useUser();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  // Get user's initials for avatar
  const getInitials = () => {
    if (!user?.name) return "U";
    const nameParts = user.name.split(" ");
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };
  
  // Reset user data mutation
  const resetDataMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      return apiRequest("POST", `/api/users/${user.id}/reset`, {});
    },
    onSuccess: () => {
      // Invalidate all user-related queries
      queryClient.invalidateQueries();
      
      toast({
        title: "Data reset successful",
        description: "All your health data has been reset",
      });
      
      setIsResetModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to reset data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Profile edit schema
  const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    age: z.coerce.number().min(13, "You must be at least 13 years old").max(120, "Age must be less than 120"),
    gender: z.enum(["male", "female", "other"]),
    height: z.coerce.number().min(100, "Height must be at least 100cm").max(250, "Height must be less than 250cm"),
    weight: z.coerce.number().min(30, "Weight must be at least 30kg").max(300, "Weight must be less than 300kg"),
    goalWeight: z.coerce.number().min(30, "Goal weight must be at least 30kg").max(300, "Goal weight must be less than 300kg"),
    activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very active"]),
    goal: z.enum(["lose", "maintain", "gain"]),
    waterTarget: z.coerce.number().min(500, "Water target must be at least 500ml").max(5000, "Water target must be less than 5000ml")
  });
  
  type ProfileFormValues = z.infer<typeof profileSchema>;
  
  // Initialize form with user data
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
      goal: (user?.goal as any) || "lose",
      waterTarget: user?.waterTarget || 2500
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
        fatTarget: targets.fatTarget
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
        description: "Your profile has been updated successfully",
      });
      
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };
  
  if (!user) {
    return (
      <div className="pt-4 px-5 flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Not Logged In</h2>
          <p className="text-neutral-500 mb-4">Please log in to view your profile</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pt-4 px-5">
      {/* Profile Header */}
      <div className="mb-6 flex items-center">
        <Avatar className="h-20 w-20 bg-primary text-white mr-4">
          <AvatarFallback className="text-2xl font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-semibold">{user.name}</h2>
          <p className="text-neutral-500">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button 
          variant="outline" 
          className="flex items-center justify-center py-6" 
          onClick={() => setIsEditModalOpen(true)}
        >
          <i className="fas fa-user-edit mr-2"></i>
          Edit Profile
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center justify-center py-6"
          onClick={() => setIsResetModalOpen(true)}
        >
          <i className="fas fa-refresh mr-2"></i>
          Reset Data
        </Button>
      </div>
      
      {/* Personal Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-500">Age</p>
              <p className="font-medium">{user.age} years</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Gender</p>
              <p className="font-medium capitalize">{user.gender}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Height</p>
              <p className="font-medium">{user.height} cm</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Weight</p>
              <p className="font-medium">{user.weight} kg</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Fitness Goals */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fitness Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-neutral-500">Weight Goal</p>
            <p className="font-medium capitalize">{user.goal} weight</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Target Weight</p>
            <p className="font-medium">{user.goalWeight} kg</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Activity Level</p>
            <p className="font-medium capitalize">{user.activityLevel.replace('-', ' ')}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-neutral-500">Daily Calorie Target</p>
            <p className="font-medium">{user.dailyCalorieTarget} calories</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-neutral-500">Protein</p>
              <p className="font-medium">{user.proteinTarget}g</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Carbs</p>
              <p className="font-medium">{user.carbTarget}g</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Fat</p>
              <p className="font-medium">{user.fatTarget}g</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Water Target</p>
            <p className="font-medium">{user.waterTarget}ml</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Account Actions */}
      <Button 
        variant="destructive" 
        className="w-full" 
        onClick={logout}
      >
        <i className="fas fa-sign-out-alt mr-2"></i>
        Logout
      </Button>
      
      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and fitness goals
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
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
              
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
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
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight Goal</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your goal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lose">Lose Weight</SelectItem>
                        <SelectItem value="maintain">Maintain Weight</SelectItem>
                        <SelectItem value="gain">Gain Weight</SelectItem>
                      </SelectContent>
                    </Select>
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
              
              <FormField
                control={form.control}
                name="waterTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Water Target (ml)</FormLabel>
                    <FormControl>
                      <Input type="number" step="100" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your daily water intake goal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Reset Data Confirmation Modal */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset All Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all your health and fitness data? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 p-4 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-700">Warning</p>
              <p className="text-sm text-red-600">
                This will delete all your logged meals, workouts, weight history, and water intake.
                Your profile information will remain.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => resetDataMutation.mutate()}
              disabled={resetDataMutation.isPending}
            >
              {resetDataMutation.isPending ? (
                <i className="fas fa-spinner fa-spin mr-2"></i>
              ) : null}
              Reset All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
