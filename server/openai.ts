import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-development" });

export interface FoodItem {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodRecognitionResult {
  items: FoodItem[];
  success: boolean;
  message?: string;
}

/**
 * Analyze food image and return nutrition information
 */
export async function analyzeFoodImage(base64Image: string): Promise<FoodRecognitionResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are a nutrition expert specializing in analyzing food images. " +
            "Identify the food items in the image and provide detailed nutritional information for each. " +
            "Be accurate and specific about the serving sizes and nutritional content. " + 
            "Focus only on visible food items."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image and provide detailed nutritional information. Return a JSON object with an array of food items. Each item should include: name, servingSize, servingUnit, calories, protein (g), carbs (g), and fat (g). Make your best estimate based on what you see."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Format to match our expected return type
    const formattedItems: FoodItem[] = result.items?.map((item: any) => ({
      name: item.name,
      servingSize: parseFloat(item.servingSize) || 0,
      servingUnit: item.servingUnit || "g",
      calories: parseInt(item.calories) || 0,
      protein: parseFloat(item.protein) || 0,
      carbs: parseFloat(item.carbs) || 0,
      fat: parseFloat(item.fat) || 0
    })) || [];

    return {
      items: formattedItems,
      success: true
    };
  } catch (error) {
    console.error("Error analyzing food image:", error);
    return {
      items: [],
      success: false,
      message: `Failed to analyze food image: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get nutrition information for a food item entered as text
 */
export async function getFoodNutrition(foodName: string, servingSize?: number, servingUnit?: string): Promise<FoodItem | null> {
  try {
    const servingInfo = servingSize && servingUnit 
      ? `with serving size ${servingSize} ${servingUnit}` 
      : "";
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are a nutrition database API. Provide accurate nutritional information for food items. " +
            "Return only the JSON object with no additional explanation."
        },
        {
          role: "user",
          content: `Provide nutritional information for ${foodName} ${servingInfo}. Return a JSON object with name, servingSize, servingUnit, calories, protein (g), carbs (g), and fat (g).`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      name: result.name,
      servingSize: parseFloat(result.servingSize) || 0,
      servingUnit: result.servingUnit || "g",
      calories: parseInt(result.calories) || 0,
      protein: parseFloat(result.protein) || 0,
      carbs: parseFloat(result.carbs) || 0,
      fat: parseFloat(result.fat) || 0
    };
  } catch (error) {
    console.error("Error getting food nutrition:", error);
    return null;
  }
}

/**
 * Get a response from the AI health coach
 */
export async function getCoachResponse(userId: number, userMessage: string, userProfile: any, previousMessages: any[]): Promise<string> {
  try {
    const systemPrompt = `
      You are NutriCoach AI, a supportive and knowledgeable health and nutrition coach. 
      Your goal is to provide personalized, motivating guidance to help users achieve their health goals.
      
      User profile:
      - Name: ${userProfile.name}
      - Age: ${userProfile.age}
      - Current weight: ${userProfile.weight} kg
      - Height: ${userProfile.height} cm
      - Goal: ${userProfile.goal} weight
      - Target calories: ${userProfile.dailyCalorieTarget} per day
      
      Be supportive, positive, and empathetic. Provide specific, actionable advice tailored to the user's goals.
      Keep responses relatively brief and conversational. When discussing nutrition, focus on balanced, sustainable approaches.
    `;
    
    // Format previous messages for context
    const formattedPreviousMessages = previousMessages.map(msg => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.message
    }));
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedPreviousMessages,
        { role: "user", content: userMessage }
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Error getting coach response:", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
}

/**
 * Calculate recommended daily calories and macros based on user profile
 */
export async function calculateNutritionTargets(userProfile: any): Promise<{
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbTarget: number; 
  fatTarget: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert system that calculates personalized nutrition targets based on user profiles. Return only the JSON with no explanation."
        },
        {
          role: "user",
          content: `Calculate daily nutrition targets for:
            - Age: ${userProfile.age}
            - Gender: ${userProfile.gender}
            - Weight: ${userProfile.weight} kg
            - Height: ${userProfile.height} cm
            - Activity level: ${userProfile.activityLevel}
            - Goal: ${userProfile.goal} weight
            
            Return a JSON object with dailyCalorieTarget, proteinTarget (g), carbTarget (g), and fatTarget (g).`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      dailyCalorieTarget: result.dailyCalorieTarget,
      proteinTarget: result.proteinTarget,
      carbTarget: result.carbTarget,
      fatTarget: result.fatTarget
    };
  } catch (error) {
    console.error("Error calculating nutrition targets:", error);
    
    // Return basic defaults if API fails
    const weight = userProfile.weight || 70;
    let multiplier = 25; // moderate default
    
    if (userProfile.goal === "lose") multiplier = 22;
    else if (userProfile.goal === "gain") multiplier = 28;
    
    const calories = Math.round(weight * multiplier);
    
    return {
      dailyCalorieTarget: calories,
      proteinTarget: Math.round(weight * 1.6),
      carbTarget: Math.round(calories * 0.45 / 4),
      fatTarget: Math.round(calories * 0.25 / 9)
    };
  }
}
