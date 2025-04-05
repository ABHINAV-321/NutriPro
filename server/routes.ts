import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { 
  insertUserSchema, 
  insertWeightLogSchema, 
  insertFoodEntrySchema, 
  insertWaterEntrySchema, 
  insertWorkoutEntrySchema, 
  insertCoachMessageSchema
} from "@shared/schema";
import { analyzeRoute } from "./routes/analyze";
import { 
  analyzeFoodImage, 
  calculateNutritionTargets, 
  getFoodNutrition, 
  getCoachResponse 
} from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler utility
  const handleError = (res: Response, error: unknown) => {
    console.error("API Error:", error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return res.status(500).json({ message });
  };

  // Check server health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const userData = req.body;
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Weight log routes
  app.post("/api/weight-logs", async (req, res) => {
    try {
      const weightLogData = insertWeightLogSchema.parse(req.body);
      const weightLog = await storage.createWeightLog(weightLogData);
      
      // Update user's current weight
      const user = await storage.getUser(weightLogData.userId);
      if (user) {
        await storage.updateUser(user.id, { weight: weightLogData.weight });
      }
      
      res.json(weightLog);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:userId/weight-logs", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const weightLogs = await storage.getWeightLogsByUserId(userId);
      res.json(weightLogs);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Food entry routes
  app.post("/api/food-entries", async (req, res) => {
    try {
      const foodEntryData = insertFoodEntrySchema.parse(req.body);
      const foodEntry = await storage.createFoodEntry(foodEntryData);
      res.json(foodEntry);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:userId/food-entries", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      
      if (date) {
        const foodEntries = await storage.getFoodEntriesByUserIdAndDate(userId, date);
        res.json(foodEntries);
      } else {
        const foodEntries = await storage.getFoodEntriesByUserId(userId);
        res.json(foodEntries);
      }
    } catch (error) {
      handleError(res, error);
    }
  });

  // Water entry routes
  app.post("/api/water-entries", async (req, res) => {
    try {
      const waterEntryData = insertWaterEntrySchema.parse(req.body);
      const waterEntry = await storage.createWaterEntry(waterEntryData);
      res.json(waterEntry);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:userId/water-entries", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      
      if (date) {
        const waterEntries = await storage.getWaterEntriesByUserIdAndDate(userId, date);
        res.json(waterEntries);
      } else {
        const waterEntries = await storage.getWaterEntriesByUserId(userId);
        res.json(waterEntries);
      }
    } catch (error) {
      handleError(res, error);
    }
  });

  // Workout entry routes
  app.post("/api/workout-entries", async (req, res) => {
    try {
      const workoutEntryData = insertWorkoutEntrySchema.parse(req.body);
      const workoutEntry = await storage.createWorkoutEntry(workoutEntryData);
      res.json(workoutEntry);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:userId/workout-entries", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      
      if (date) {
        const workoutEntries = await storage.getWorkoutEntriesByUserIdAndDate(userId, date);
        res.json(workoutEntries);
      } else {
        const workoutEntries = await storage.getWorkoutEntriesByUserId(userId);
        res.json(workoutEntries);
      }
    } catch (error) {
      handleError(res, error);
    }
  });

  // Coach message routes
  app.post("/api/coach-messages", async (req, res) => {
    try {
      const { userId, message } = req.body;
      
      // Save user message
      const userMessage = await storage.createCoachMessage({
        userId,
        message,
        isUser: true
      });
      
      // Get user profile for context
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get previous messages for context
      const previousMessages = await storage.getCoachMessagesByUserId(userId);
      
      // Get AI response
      const aiResponse = await getCoachResponse(userId, message, user, previousMessages);
      
      // Save AI response
      const coachMessage = await storage.createCoachMessage({
        userId,
        message: aiResponse,
        isUser: false
      });
      
      res.json({
        userMessage,
        coachMessage
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:userId/coach-messages", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const messages = await storage.getCoachMessagesByUserId(userId);
      res.json(messages);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Food analysis routes
  app.post("/api/analyze-food-image", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ message: "Valid base64 image is required" });
      }
      
      // Remove data URL prefix if present
      const base64Image = image.replace(/^data:image\/\w+;base64,/, "");
      
      const result = await analyzeFoodImage(base64Image);
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/food-nutrition", async (req, res) => {
    try {
      const { foodName, servingSize, servingUnit } = req.body;
      if (!foodName) {
        return res.status(400).json({ message: "Food name is required" });
      }
      
      const result = await getFoodNutrition(foodName, servingSize, servingUnit);
      
      if (!result) {
        return res.status(404).json({ message: "Could not find nutrition information for this food" });
      }
      
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Calculate nutrition targets
  app.post("/api/calculate-nutrition-targets", async (req, res) => {
    try {
      const userProfile = req.body;
      
      if (!userProfile.age || !userProfile.weight || !userProfile.height || !userProfile.goal) {
        return res.status(400).json({ message: "User profile information is incomplete" });
      }
      
      const targets = await calculateNutritionTargets(userProfile);
      res.json(targets);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Reset user data
  app.post("/api/users/:userId/reset", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      await storage.resetUserData(userId);
      res.json({ message: "User data has been reset" });
    } catch (error) {
      handleError(res, error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
