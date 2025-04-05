import { FoodEntry } from "@shared/schema";

/**
 * Calculate the total nutrition values for a given array of food entries
 */
export function calculateDailyNutrition(foodEntries: FoodEntry[]) {
  return foodEntries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Get suggested portion sizes for common foods
 */
export function getSuggestedPortionSize(foodName: string): { size: number; unit: string } {
  const foodName_lower = foodName.toLowerCase();
  
  // Protein sources
  if (foodName_lower.includes("chicken") || foodName_lower.includes("beef") || 
      foodName_lower.includes("fish") || foodName_lower.includes("pork")) {
    return { size: 100, unit: "g" };
  }
  
  // Vegetables
  if (foodName_lower.includes("salad") || foodName_lower.includes("vegetable") ||
      foodName_lower.includes("broccoli") || foodName_lower.includes("spinach") ||
      foodName_lower.includes("kale")) {
    return { size: 85, unit: "g" };
  }
  
  // Fruits
  if (foodName_lower.includes("apple") || foodName_lower.includes("orange") ||
      foodName_lower.includes("banana") || foodName_lower.includes("fruit")) {
    return { size: 1, unit: "serving" };
  }
  
  // Grains
  if (foodName_lower.includes("rice") || foodName_lower.includes("pasta") ||
      foodName_lower.includes("bread") || foodName_lower.includes("cereal")) {
    return { size: 75, unit: "g" };
  }
  
  // Liquids
  if (foodName_lower.includes("milk") || foodName_lower.includes("juice") ||
      foodName_lower.includes("soup") || foodName_lower.includes("smoothie")) {
    return { size: 250, unit: "ml" };
  }
  
  // Default
  return { size: 100, unit: "g" };
}

/**
 * Calculate calories from macronutrients
 */
export function calculateCaloriesFromMacros(protein: number, carbs: number, fat: number): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

/**
 * Calculate macronutrient percentages
 */
export function calculateMacroPercentages(protein: number, carbs: number, fat: number) {
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatCals = fat * 9;
  const totalCals = proteinCals + carbsCals + fatCals;
  
  if (totalCals === 0) {
    return { proteinPercentage: 0, carbsPercentage: 0, fatPercentage: 0 };
  }
  
  return {
    proteinPercentage: Math.round((proteinCals / totalCals) * 100),
    carbsPercentage: Math.round((carbsCals / totalCals) * 100),
    fatPercentage: Math.round((fatCals / totalCals) * 100)
  };
}

/**
 * Group food entries by meal type
 */
export function groupFoodEntriesByMealType(foodEntries: FoodEntry[]) {
  return foodEntries.reduce((groups, entry) => {
    const { mealType } = entry;
    if (!groups[mealType]) {
      groups[mealType] = [];
    }
    groups[mealType].push(entry);
    return groups;
  }, {} as Record<string, FoodEntry[]>);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Filter food entries by date
 */
export function filterFoodEntriesByDate(foodEntries: FoodEntry[], date: Date): FoodEntry[] {
  return foodEntries.filter(entry => 
    isSameDay(new Date(entry.date), date)
  );
}
