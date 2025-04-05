import { 
  users, User, InsertUser, 
  weightLogs, WeightLog, InsertWeightLog,
  foodEntries, FoodEntry, InsertFoodEntry,
  waterEntries, WaterEntry, InsertWaterEntry,
  workoutEntries, WorkoutEntry, InsertWorkoutEntry,
  coachMessages, CoachMessage, InsertCoachMessage
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Weight log methods
  createWeightLog(weightLog: InsertWeightLog): Promise<WeightLog>;
  getWeightLogsByUserId(userId: number): Promise<WeightLog[]>;
  
  // Food entry methods
  createFoodEntry(foodEntry: InsertFoodEntry): Promise<FoodEntry>;
  getFoodEntriesByUserId(userId: number): Promise<FoodEntry[]>;
  getFoodEntriesByUserIdAndDate(userId: number, date: Date): Promise<FoodEntry[]>;
  
  // Water entry methods
  createWaterEntry(waterEntry: InsertWaterEntry): Promise<WaterEntry>;
  getWaterEntriesByUserId(userId: number): Promise<WaterEntry[]>;
  getWaterEntriesByUserIdAndDate(userId: number, date: Date): Promise<WaterEntry[]>;
  
  // Workout entry methods
  createWorkoutEntry(workoutEntry: InsertWorkoutEntry): Promise<WorkoutEntry>;
  getWorkoutEntriesByUserId(userId: number): Promise<WorkoutEntry[]>;
  getWorkoutEntriesByUserIdAndDate(userId: number, date: Date): Promise<WorkoutEntry[]>;
  
  // Coach message methods
  createCoachMessage(coachMessage: InsertCoachMessage): Promise<CoachMessage>;
  getCoachMessagesByUserId(userId: number): Promise<CoachMessage[]>;
  
  // Reset user data
  resetUserData(userId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private weightLogs: Map<number, WeightLog>;
  private foodEntries: Map<number, FoodEntry>;
  private waterEntries: Map<number, WaterEntry>;
  private workoutEntries: Map<number, WorkoutEntry>;
  private coachMessages: Map<number, CoachMessage>;
  
  private currentUserId: number;
  private currentWeightLogId: number;
  private currentFoodEntryId: number;
  private currentWaterEntryId: number;
  private currentWorkoutEntryId: number;
  private currentCoachMessageId: number;

  constructor() {
    this.users = new Map();
    this.weightLogs = new Map();
    this.foodEntries = new Map();
    this.waterEntries = new Map();
    this.workoutEntries = new Map();
    this.coachMessages = new Map();
    
    this.currentUserId = 1;
    this.currentWeightLogId = 1;
    this.currentFoodEntryId = 1;
    this.currentWaterEntryId = 1;
    this.currentWorkoutEntryId = 1;
    this.currentCoachMessageId = 1;
    
    // Add a demo user
    this.createUser({
      username: "demo",
      password: "password",
      name: "Jessica",
      age: 30,
      gender: "female",
      height: 165,
      weight: 68.5,
      goalWeight: 65,
      activityLevel: "moderate",
      goal: "lose",
      dailyCalorieTarget: 1800,
      proteinTarget: 90,
      carbTarget: 200,
      fatTarget: 60,
      waterTarget: 2500
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Weight log methods
  async createWeightLog(insertWeightLog: InsertWeightLog): Promise<WeightLog> {
    const id = this.currentWeightLogId++;
    const now = new Date();
    const weightLog: WeightLog = { ...insertWeightLog, id, date: now };
    this.weightLogs.set(id, weightLog);
    return weightLog;
  }
  
  async getWeightLogsByUserId(userId: number): Promise<WeightLog[]> {
    return Array.from(this.weightLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  // Food entry methods
  async createFoodEntry(insertFoodEntry: InsertFoodEntry): Promise<FoodEntry> {
    const id = this.currentFoodEntryId++;
    const now = new Date();
    const foodEntry: FoodEntry = { ...insertFoodEntry, id, date: now };
    this.foodEntries.set(id, foodEntry);
    return foodEntry;
  }
  
  async getFoodEntriesByUserId(userId: number): Promise<FoodEntry[]> {
    return Array.from(this.foodEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getFoodEntriesByUserIdAndDate(userId: number, date: Date): Promise<FoodEntry[]> {
    return Array.from(this.foodEntries.values())
      .filter(entry => entry.userId === userId && this.isSameDay(new Date(entry.date), date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  // Water entry methods
  async createWaterEntry(insertWaterEntry: InsertWaterEntry): Promise<WaterEntry> {
    const id = this.currentWaterEntryId++;
    const now = new Date();
    const waterEntry: WaterEntry = { ...insertWaterEntry, id, date: now };
    this.waterEntries.set(id, waterEntry);
    return waterEntry;
  }
  
  async getWaterEntriesByUserId(userId: number): Promise<WaterEntry[]> {
    return Array.from(this.waterEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getWaterEntriesByUserIdAndDate(userId: number, date: Date): Promise<WaterEntry[]> {
    return Array.from(this.waterEntries.values())
      .filter(entry => entry.userId === userId && this.isSameDay(new Date(entry.date), date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  // Workout entry methods
  async createWorkoutEntry(insertWorkoutEntry: InsertWorkoutEntry): Promise<WorkoutEntry> {
    const id = this.currentWorkoutEntryId++;
    const now = new Date();
    const workoutEntry: WorkoutEntry = { ...insertWorkoutEntry, id, date: now };
    this.workoutEntries.set(id, workoutEntry);
    return workoutEntry;
  }
  
  async getWorkoutEntriesByUserId(userId: number): Promise<WorkoutEntry[]> {
    return Array.from(this.workoutEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getWorkoutEntriesByUserIdAndDate(userId: number, date: Date): Promise<WorkoutEntry[]> {
    return Array.from(this.workoutEntries.values())
      .filter(entry => entry.userId === userId && this.isSameDay(new Date(entry.date), date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  // Coach message methods
  async createCoachMessage(insertCoachMessage: InsertCoachMessage): Promise<CoachMessage> {
    const id = this.currentCoachMessageId++;
    const now = new Date();
    const coachMessage: CoachMessage = { ...insertCoachMessage, id, date: now };
    this.coachMessages.set(id, coachMessage);
    return coachMessage;
  }
  
  async getCoachMessagesByUserId(userId: number): Promise<CoachMessage[]> {
    return Array.from(this.coachMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  // Reset user data
  async resetUserData(userId: number): Promise<void> {
    // Remove all entries for this user
    Array.from(this.weightLogs.entries())
      .filter(([_, log]) => log.userId === userId)
      .forEach(([id, _]) => this.weightLogs.delete(id));
      
    Array.from(this.foodEntries.entries())
      .filter(([_, entry]) => entry.userId === userId)
      .forEach(([id, _]) => this.foodEntries.delete(id));
      
    Array.from(this.waterEntries.entries())
      .filter(([_, entry]) => entry.userId === userId)
      .forEach(([id, _]) => this.waterEntries.delete(id));
      
    Array.from(this.workoutEntries.entries())
      .filter(([_, entry]) => entry.userId === userId)
      .forEach(([id, _]) => this.workoutEntries.delete(id));
      
    Array.from(this.coachMessages.entries())
      .filter(([_, message]) => message.userId === userId)
      .forEach(([id, _]) => this.coachMessages.delete(id));
  }
  
  // Helper methods
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}

export const storage = new MemStorage();
