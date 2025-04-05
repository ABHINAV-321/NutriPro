import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Camera } from "@/components/ui/camera";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FoodItem } from "@/types";

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | null;
}

export default function AddMealModal({ isOpen, onClose, mealType }: AddMealModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [mode, setMode] = useState<"selection" | "camera" | "search" | "manual">("selection");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const mealTypeConfig = {
    breakfast: {
      title: "Breakfast",
      icon: "fa-mug-hot",
      bgColor: "bg-amber-100",
      textColor: "text-amber-700",
    },
    lunch: {
      title: "Lunch",
      icon: "fa-burger",
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
    },
    dinner: {
      title: "Dinner",
      icon: "fa-bowl-food",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
    },
    snack: {
      title: "Snack",
      icon: "fa-cookie",
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
    }
  };
  
  // Schema for manual food entry form
  const manualFoodSchema = z.object({
    name: z.string().min(2, "Food name is required"),
    servingSize: z.coerce.number().min(0.1, "Serving size must be greater than 0"),
    servingUnit: z.string().min(1, "Serving unit is required"),
    calories: z.coerce.number().min(0, "Calories must be 0 or greater"),
    protein: z.coerce.number().min(0, "Protein must be 0 or greater"),
    carbs: z.coerce.number().min(0, "Carbs must be 0 or greater"),
    fat: z.coerce.number().min(0, "Fat must be 0 or greater"),
  });
  
  // Setup form
  const form = useForm<z.infer<typeof manualFoodSchema>>({
    resolver: zodResolver(manualFoodSchema),
    defaultValues: {
      name: "",
      servingSize: 100,
      servingUnit: "g",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
  });
  
  // Mutation to add food entry
  const addFoodMutation = useMutation({
    mutationFn: async (food: FoodItem) => {
      if (!user?.id || !mealType) throw new Error("User or meal type not set");
      
      return apiRequest("POST", "/api/food-entries", {
        userId: user.id,
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        mealType: mealType,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        imageUrl: food.imageUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/users/${user?.id}/food-entries`] 
      });
      toast({
        title: "Food added successfully",
        description: `${form.getValues().name || "Food item"} has been added to your diary`,
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to add food",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Search for food
  const searchFood = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await apiRequest("POST", "/api/food-nutrition", {
        foodName: searchQuery
      });
      
      const data = await response.json();
      if (data) {
        setSearchResults([data]);
      } else {
        setSearchResults([]);
        toast({
          title: "No results found",
          description: "Try a different search term",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Could not search for food item",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof manualFoodSchema>) => {
    addFoodMutation.mutate({
      ...values,
      imageUrl: undefined
    });
  };
  
  // Handle camera capture
  const handleCameraCapture = (imageData: string) => {
    setIsCameraOpen(false);
    // We would process the image with the API here
    // and add detected foods, but for now we'll just show a success message
    toast({
      title: "Image captured",
      description: "Processing food image...",
    });
  };
  
  // Add food from search results
  const addFoodFromSearch = (food: FoodItem) => {
    addFoodMutation.mutate(food);
  };
  
  // Clear modal state and close
  const handleClose = () => {
    setMode("selection");
    setSearchQuery("");
    setSearchResults([]);
    form.reset();
    onClose();
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="bg-white rounded-t-2xl sm:rounded-t-lg w-full max-w-lg p-5">
          <DialogHeader className="flex justify-between items-center mb-5">
            <DialogTitle className="text-xl font-semibold">Log Your Meal</DialogTitle>
            <button className="text-neutral-400" onClick={handleClose}>
              <i className="fas fa-xmark text-xl"></i>
            </button>
          </DialogHeader>

          {mode === "selection" && (
            <>
              <div className="mb-5 flex">
                <Button 
                  className="flex-1 py-3 bg-primary mr-2 flex items-center justify-center"
                  onClick={() => setIsCameraOpen(true)}
                >
                  <i className="fas fa-camera mr-2"></i> Take Photo
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 py-3 ml-2 flex items-center justify-center"
                  onClick={() => setMode("search")}
                >
                  <i className="fas fa-search mr-2"></i> Search Food
                </Button>
              </div>

              <div className="mb-5">
                <h4 className="font-medium mb-2">Enter Manually</h4>
                <Button 
                  variant="outline" 
                  className="w-full py-6 border-dashed border-2"
                  onClick={() => setMode("manual")}
                >
                  <i className="fas fa-plus mr-2"></i> Add Food Item Details
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">Select Meal Type</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(mealTypeConfig).map(([type, config]) => (
                    <Button 
                      key={type}
                      variant="ghost"
                      className={`py-3 ${config.bgColor} ${config.textColor} font-medium flex items-center justify-center`}
                      disabled={type === mealType}
                    >
                      <i className={`fas ${config.icon} mr-2`}></i> {config.title}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === "search" && (
            <>
              <div className="mb-5">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Search for a food..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchFood()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={searchFood}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-search"></i>
                    )}
                  </Button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="mb-5">
                  <h4 className="font-medium mb-2">Results</h4>
                  <div className="space-y-2">
                    {searchResults.map((food, index) => (
                      <div 
                        key={index}
                        className="border border-neutral-200 rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{food.name}</p>
                          <div className="text-xs text-neutral-500">
                            <span>{food.calories} cal</span>
                            <span className="ml-2">P: {food.protein}g</span>
                            <span className="ml-2">C: {food.carbs}g</span>
                            <span className="ml-2">F: {food.fat}g</span>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => addFoodFromSearch(food)}
                          disabled={addFoodMutation.isPending}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setMode("selection")}>
                  <i className="fas fa-arrow-left mr-2"></i> Back
                </Button>
                <Button variant="ghost" onClick={() => setMode("manual")}>
                  <i className="fas fa-edit mr-2"></i> Enter Manually
                </Button>
              </div>
            </>
          )}

          {mode === "manual" && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Food Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Apple, Chicken Breast" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="servingSize"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Serving Size</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="servingUnit"
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="g" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="protein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protein (g)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="carbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carbs (g)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fat (g)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setMode("selection")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!form.formState.isValid || addFoodMutation.isPending}
                  >
                    {addFoodMutation.isPending ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : null}
                    Add to {mealType && mealTypeConfig[mealType].title}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      
      <Camera 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
}
