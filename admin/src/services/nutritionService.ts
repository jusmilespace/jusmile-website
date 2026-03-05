import { FOOD_DB, UNIT_MAP } from "../constants/foodData";
import { estimateNutrition } from "./geminiService";

export interface NutritionResult {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  weight: number;
}

export interface IngredientCalculation {
  name: string;
  amount: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  weight: number;
  matchedFood: string;
  isEstimated?: boolean;
}

export async function calculateNutrition(ingredients: { name: string; amount: string }[], servings: number = 1, apiKey: string = '') {
  const results: IngredientCalculation[] = [];
  const unknownIngredients: { name: string; amount: string }[] = [];

  // First pass: Local DB matching
  for (const ing of ingredients) {
    const { name, amount } = ing;
    const parsed = parseAmount(amount);

    const foodName = findBestMatch(name);
    const dbItem = FOOD_DB.find(f => f.food === foodName);
    const unitItems = UNIT_MAP.filter(u => u.food === foodName);

    let kcal = 0, protein = 0, carbs = 0, fat = 0, weight = 0;
    let found = false;

    if (parsed.unit === 'g' || parsed.unit === '克') {
      weight = parsed.value;
      if (dbItem) {
        const ratio = weight / 100;
        kcal = dbItem.kcal * ratio;
        protein = dbItem.protein * ratio;
        carbs = dbItem.carb * ratio;
        fat = dbItem.fat * ratio;
        found = true;
      }
    } else {
      const unitItem = unitItems.find(u => u.unit === parsed.unit) || unitItems[0];
      if (unitItem) {
        const totalServings = parsed.value * unitItem.servingsPerUnit;
        weight = totalServings * unitItem.weightPerServing;
        kcal = totalServings * unitItem.kcal;
        protein = totalServings * unitItem.protein;
        carbs = totalServings * unitItem.carb;
        fat = totalServings * unitItem.fat;
        found = true;
      }
    }

    if (found) {
      results.push({
        name,
        amount,
        kcal: Math.round(kcal * 10) / 10,
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,
        weight: Math.round(weight * 10) / 10,
        matchedFood: foodName
      });
    } else {
      unknownIngredients.push(ing);
    }
  }

  // Second pass: Gemini estimation for unknown ingredients
  if (unknownIngredients.length > 0) {
    try {
      const estimations = await estimateNutrition(unknownIngredients, apiKey);
      for (const est of estimations) {
        results.push({
          ...est,
          isEstimated: true,
          matchedFood: "AI 估計"
        });
      }
    } catch (error) {
      console.error("Gemini estimation failed:", error);
      // Fallback to zero for failed estimations
      for (const ing of unknownIngredients) {
        results.push({
          name: ing.name,
          amount: ing.amount,
          kcal: 0, protein: 0, carbs: 0, fat: 0, weight: 0,
          matchedFood: "未辨識"
        });
      }
    }
  }

  const total = results.reduce((acc, curr) => ({
    kcal: acc.kcal + curr.kcal,
    protein: acc.protein + curr.protein,
    carbs: acc.carbs + curr.carbs,
    fat: acc.fat + curr.fat,
    weight: acc.weight + curr.weight
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0, weight: 0 });

  const perServing = {
    kcal: Math.round((total.kcal / servings) * 10) / 10,
    protein: Math.round((total.protein / servings) * 10) / 10,
    carbs: Math.round((total.carbs / servings) * 10) / 10,
    fat: Math.round((total.fat / servings) * 10) / 10,
    weight: Math.round((total.weight / servings) * 10) / 10
  };

  const per100g = total.weight > 0 ? {
    kcal: Math.round((total.kcal / total.weight * 100) * 10) / 10,
    protein: Math.round((total.protein / total.weight * 100) * 10) / 10,
    carbs: Math.round((total.carbs / total.weight * 100) * 10) / 10,
    fat: Math.round((total.fat / total.weight * 100) * 10) / 10,
    weight: 100
  } : { kcal: 0, protein: 0, carbs: 0, fat: 0, weight: 100 };

  return {
    ingredients: results,
    total: roundNutrition(total),
    perServing: roundNutrition(perServing),
    per100g: roundNutrition(per100g)
  };
}

function roundNutrition(n: NutritionResult): NutritionResult {
  return {
    kcal: Math.round(n.kcal),
    protein: Math.round(n.protein * 10) / 10,
    carbs: Math.round(n.carbs * 10) / 10,
    fat: Math.round(n.fat * 10) / 10,
    weight: Math.round(n.weight)
  };
}

function parseAmount(amount: string) {
  // Simple parser for "2 顆", "100 g", "1 大匙"
  const match = amount.match(/(\d+\.?\d*)\s*(.*)/);
  if (match) {
    return {
      value: parseFloat(match[1]),
      unit: match[2].trim()
    };
  }
  return { value: 0, unit: '' };
}

function findBestMatch(name: string) {
  // Simple keyword matching
  const commonNames = FOOD_DB.map(f => f.food);
  for (const common of commonNames) {
    if (name.includes(common) || common.includes(name)) {
      return common;
    }
  }
  return name;
}

export function detectAllergens(ingredients: string[]) {
  const allergens = {
    "堅果": ["堅果", "花生", "核桃", "腰果", "杏仁", "芝麻"],
    "麩質": ["麵粉", "小麥", "大麥", "燕麥", "醬油"],
    "乳製品": ["牛奶", "奶油", "鮮奶油", "起司", "乳酪", "優格"],
    "蛋類": ["蛋", "雞蛋", "蛋白", "蛋黃"]
  };

  const detected: string[] = [];
  for (const [category, keywords] of Object.entries(allergens)) {
    if (ingredients.some(ing => keywords.some(k => ing.includes(k)))) {
      detected.push(category);
    }
  }
  return detected;
}

export function getHealthTags(nutrition: NutritionResult) {
  const tags: string[] = [];
  // High Protein: Protein > 20% of calories (roughly) or > 15g per serving
  if (nutrition.protein > 15) tags.push("高蛋白");
  // Low Carb: Carbs < 10g per serving
  if (nutrition.carbs < 10) tags.push("低碳");
  // Low Calorie: < 400 kcal per serving
  if (nutrition.kcal < 400) tags.push("低卡");

  return tags;
}
