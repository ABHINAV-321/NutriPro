/**
 * Food item with nutrition information
 */
export interface FoodItem {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
}

/**
 * Food recognition result from AI
 */
export interface FoodRecognitionResult {
  items: FoodItem[];
  success: boolean;
  message?: string;
}

/**
 * Water tracker value
 */
export interface WaterEntry {
  id: number;
  userId: number;
  amount: number;
  date: Date;
}

/**
 * Daily nutrition summary
 */
export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

/**
 * User profile data
 */
export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  goalWeight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very active';
  goal: 'lose' | 'maintain' | 'gain';
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  waterTarget: number;
}

/**
 * Chart data format for weight tracking
 */
export interface WeightChartData {
  date: string;
  weight: number;
}

/**
 * Chart data format for nutrition tracking
 */
export interface NutritionChartData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Macro distribution chart data
 */
export interface MacroDistributionData {
  name: string;
  value: number;
  calories: number;
}

/**
 * Workout tracking data
 */
export interface WorkoutChartData {
  date: string;
  calories: number;
}

/**
 * Water tracking chart data
 */
export interface WaterChartData {
  date: string;
  amount: number;
}
