import { GoogleGenAI, Type } from "@google/genai";

export async function parseRecipe(text: string, apiKey: string) {
  if (!apiKey) throw new Error("請先在設定中填寫 Gemini API Key");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `解析以下食譜文字，提取資訊。
    識別系列名稱：如果有的話，將 'Julia Child' 轉換為 'Julia Child 經典重現'。
    提取中文名稱 (titleZh) 與 英文名稱 (titleEn)。
    提取一段吸引人的 Hook 文字。
    提取備料步驟 (miseEnPlace)：請識別在正式烹飪前的準備工作，如切菜、醃漬、預熱等。
    提取料理小撇步 (proTip)：請仔細尋找文中是否有「小撇步」、「提示」、「Note」、「Tip」或「注意」等字眼。
    提取食材名稱與份量。
    提取正式料理步驟 (steps)。
    
    食譜文字：
    ${text}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          titleZh: { type: Type.STRING },
          titleEn: { type: Type.STRING },
          series: { type: Type.STRING },
          hook: { type: Type.STRING },
          proTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "料理小撇步或注意事項列表"
          },
          miseEnPlace: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "備料步驟，如切菜、醃漬等"
          },
          servings: { type: Type.NUMBER },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                amount: { type: Type.STRING }
              },
              required: ["name", "amount"]
            }
          },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["titleZh", "ingredients", "servings"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function estimateNutrition(ingredients: any[], apiKey: string) {
  if (!apiKey) throw new Error("請先在設定中填寫 Gemini API Key");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `估計以下食材的營養成分（每份）。請返回 JSON 格式。
    
    食材列表：
    ${JSON.stringify(ingredients)}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            amount: { type: Type.STRING },
            kcal: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            weight: { type: Type.NUMBER, description: "估計的重量（克）" }
          },
          required: ["name", "amount", "kcal", "protein", "carbs", "fat", "weight"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}
