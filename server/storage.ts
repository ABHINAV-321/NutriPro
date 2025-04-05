import { 
  users, User, InsertUser, 
  weightLogs, WeightLog, InsertWeightLog,
  foodEntries, FoodEntry, InsertFoodEntry,
  waterEntries, WaterEntry, InsertWaterEntry,
  workoutEntries, WorkoutEntry, InsertWorkoutEntry,
  coachMessages, CoachMessage, InsertCoachMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // Helper method to check if two dates are on the same day
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Check if this is first app run and add a demo user
    const existingUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    
    if (existingUsers[0].count === 0 && insertUser.username !== 'demo') {
      // Add a demo user if there are no users yet
      await db.insert(users).values({
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
    
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Weight log methods
  async createWeightLog(insertWeightLog: InsertWeightLog): Promise<WeightLog> {
    const [weightLog] = await db
      .insert(weightLogs)
      .values(insertWeightLog)
      .returning();
    
    return weightLog;
  }

  async getWeightLogsByUserId(userId: number): Promise<WeightLog[]> {
    return await db
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, userId))
      .orderBy(sql`${weightLogs.date} DESC`);
  }

  // Food entry methods
  async createFoodEntry(insertFoodEntry: InsertFoodEntry): Promise<FoodEntry> {
    const [foodEntry] = await db
      .insert(foodEntries)
      .values(insertFoodEntry)
      .returning();
    
    return foodEntry;
  }

  async getFoodEntriesByUserId(userId: number): Promise<FoodEntry[]> {
    return await db
      .select()
      .from(foodEntries)
      .where(eq(foodEntries.userId, userId))
      .orderBy(sql`${foodEntries.date} DESC`);
  }

  async getFoodEntriesByUserIdAndDate(userId: number, date: Date): Promise<FoodEntry[]> {
    // PostgreSQL date truncation to match the day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return await db
      .select()
      .from(foodEntries)
      .where(
        and(
          eq(foodEntries.userId, userId),
          sql`${foodEntries.date} >= ${startDate} AND ${foodEntries.date} <= ${endDate}`
        )
      )
      .orderBy(sql`${foodEntries.date} ASC`);
  }

  // Water entry methods
  async createWaterEntry(insertWaterEntry: InsertWaterEntry): Promise<WaterEntry> {
    const [waterEntry] = await db
      .insert(waterEntries)
      .values(insertWaterEntry)
      .returning();
    
    return waterEntry;
  }

  async getWaterEntriesByUserId(userId: number): Promise<WaterEntry[]> {
    return await db
      .select()
      .from(waterEntries)
      .where(eq(waterEntries.userId, userId))
      .orderBy(sql`${waterEntries.date} DESC`);
  }

  async getWaterEntriesByUserIdAndDate(userId: number, date: Date): Promise<WaterEntry[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return await db
      .select()
      .from(waterEntries)
      .where(
        and(
          eq(waterEntries.userId, userId),
          sql`${waterEntries.date} >= ${startDate} AND ${waterEntries.date} <= ${endDate}`
        )
      )
      .orderBy(sql`${waterEntries.date} ASC`);
  }

  // Workout entry methods
  async createWorkoutEntry(insertWorkoutEntry: InsertWorkoutEntry): Promise<WorkoutEntry> {
    const [workoutEntry] = await db
      .insert(workoutEntries)
      .values(insertWorkoutEntry)
      .returning();
    
    return workoutEntry;
  }

  async getWorkoutEntriesByUserId(userId: number): Promise<WorkoutEntry[]> {
    return await db
      .select()
      .from(workoutEntries)
      .where(eq(workoutEntries.userId, userId))
      .orderBy(sql`${workoutEntries.date} DESC`);
  }

  async getWorkoutEntriesByUserIdAndDate(userId: number, date: Date): Promise<WorkoutEntry[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return await db
      .select()
      .from(workoutEntries)
      .where(
        and(
          eq(workoutEntries.userId, userId),
          sql`${workoutEntries.date} >= ${startDate} AND ${workoutEntries.date} <= ${endDate}`
        )
      )
      .orderBy(sql`${workoutEntries.date} ASC`);
  }

  // Coach message methods
  async createCoachMessage(insertCoachMessage: InsertCoachMessage): Promise<CoachMessage> {
    const [coachMessage] = await db
      .insert(coachMessages)
      .values(insertCoachMessage)
      .returning();
    
    return coachMessage;
  }

  async getCoachMessagesByUserId(userId: number): Promise<CoachMessage[]> {
    return await db
      .select()
      .from(coachMessages)
      .where(eq(coachMessages.userId, userId))
      .orderBy(sql`${coachMessages.date} ASC`);
  }

  // Reset user data
  async resetUserData(userId: number): Promise<void> {
    // Delete all entries for this user in parallel
    await Promise.all([
      db.delete(weightLogs).where(eq(weightLogs.userId, userId)),
      db.delete(foodEntries).where(eq(foodEntries.userId, userId)),
      db.delete(waterEntries).where(eq(waterEntries.userId, userId)),
      db.delete(workoutEntries).where(eq(workoutEntries.userId, userId)),
      db.delete(coachMessages).where(eq(coachMessages.userId, userId))
    ]);
  }
}

// Export a DatabaseStorage instance
export const storage = new DatabaseStorage();
