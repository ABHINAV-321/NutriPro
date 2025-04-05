import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  height: real("height"), // in cm
  weight: real("weight"), // in kg
  goalWeight: real("goal_weight"),
  activityLevel: text("activity_level"), // sedentary, light, moderate, active, very active
  goal: text("goal"), // lose, maintain, gain
  dailyCalorieTarget: integer("daily_calorie_target"),
  proteinTarget: integer("protein_target"), // in grams
  carbTarget: integer("carb_target"), // in grams
  fatTarget: integer("fat_target"), // in grams
  waterTarget: integer("water_target"), // in ml
  createdAt: timestamp("created_at").defaultNow(),
});

// Weight log
export const weightLogs = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  weight: real("weight").notNull(),
  date: timestamp("date").defaultNow(),
});

// Food entry
export const foodEntries = pgTable("food_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  protein: real("protein").notNull(), // in grams
  carbs: real("carbs").notNull(), // in grams
  fat: real("fat").notNull(), // in grams
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  servingSize: real("serving_size"),
  servingUnit: text("serving_unit"),
  imageUrl: text("image_url"),
  date: timestamp("date").defaultNow(),
});

// Water entry
export const waterEntries = pgTable("water_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer("amount").notNull(), // in ml
  date: timestamp("date").defaultNow(),
});

// Workout entry
export const workoutEntries = pgTable("workout_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  duration: integer("duration").notNull(), // in minutes
  caloriesBurned: integer("calories_burned").notNull(),
  workoutType: text("workout_type"), // cardio, strength, flexibility, etc.
  date: timestamp("date").defaultNow(),
});

// Coach chat messages
export const coachMessages = pgTable("coach_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text("message").notNull(),
  isUser: boolean("is_user").notNull(), // true if message from user, false if from AI
  date: timestamp("date").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertWeightLogSchema = createInsertSchema(weightLogs).omit({
  id: true,
  date: true,
});

export const insertFoodEntrySchema = createInsertSchema(foodEntries).omit({
  id: true,
  date: true,
});

export const insertWaterEntrySchema = createInsertSchema(waterEntries).omit({
  id: true,
  date: true,
});

export const insertWorkoutEntrySchema = createInsertSchema(workoutEntries).omit({
  id: true,
  date: true,
});

export const insertCoachMessageSchema = createInsertSchema(coachMessages).omit({
  id: true,
  date: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type WeightLog = typeof weightLogs.$inferSelect;
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;

export type FoodEntry = typeof foodEntries.$inferSelect;
export type InsertFoodEntry = z.infer<typeof insertFoodEntrySchema>;

export type WaterEntry = typeof waterEntries.$inferSelect;
export type InsertWaterEntry = z.infer<typeof insertWaterEntrySchema>;

export type WorkoutEntry = typeof workoutEntries.$inferSelect;
export type InsertWorkoutEntry = z.infer<typeof insertWorkoutEntrySchema>;

export type CoachMessage = typeof coachMessages.$inferSelect;
export type InsertCoachMessage = z.infer<typeof insertCoachMessageSchema>;
