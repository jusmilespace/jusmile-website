export interface FoodDBItem {
  food: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

export interface UnitMapItem {
  food: string;
  unit: string;
  servingsPerUnit: number;
  type: string;
  notes: string;
  weightPerServing: number;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

// Data extracted from user's admin.html - Expanded
export const FOOD_DB: FoodDBItem[] = [
  {"food": "DHA豆奶", "kcal": 44.0, "protein": 1.7, "carb": 8.0, "fat": 0.5},
  {"food": "雞蛋", "kcal": 135.0, "protein": 12.7, "carb": 1.6, "fat": 8.9},
  {"food": "番茄", "kcal": 19.0, "protein": 0.8, "carb": 4.1, "fat": 0.1},
  {"food": "橄欖油", "kcal": 884.0, "protein": 0.0, "carb": 0.0, "fat": 100.0},
  {"food": "白飯", "kcal": 183.0, "protein": 3.1, "carb": 41.0, "fat": 0.3},
  {"food": "五花肉", "kcal": 368.0, "protein": 14.5, "carb": 0.0, "fat": 33.9},
  {"food": "奶油", "kcal": 733.0, "protein": 0.6, "carb": 0.9, "fat": 82.7},
  {"food": "鮮奶油", "kcal": 340.0, "protein": 2.0, "carb": 0.0, "fat": 39.1},
  {"food": "麵粉", "kcal": 361.0, "protein": 11.5, "carb": 74.1, "fat": 1.3},
  {"food": "糖", "kcal": 385.0, "protein": 0, "carb": 99.6, "fat": 0},
  {"food": "鹽", "kcal": 0, "protein": 0, "carb": 0, "fat": 0},
  {"food": "黑胡椒", "kcal": 372.0, "protein": 11.6, "carb": 67.7, "fat": 6.7},
  {"food": "雞胸肉", "kcal": 104.0, "protein": 22.4, "carb": 0.0, "fat": 0.9},
  {"food": "雞腿", "kcal": 157.0, "protein": 18.5, "carb": 0.0, "fat": 8.7},
  {"food": "牛肉", "kcal": 250.0, "protein": 19.1, "carb": 0.0, "fat": 18.7},
  {"food": "蝦仁", "kcal": 99.0, "protein": 21.3, "carb": 0.0, "fat": 0.9},
  {"food": "高麗菜", "kcal": 23.0, "protein": 1.3, "carb": 4.8, "fat": 0.1},
  {"food": "洋蔥", "kcal": 42.0, "protein": 1.0, "carb": 10.0, "fat": 0.1},
  {"food": "大蒜", "kcal": 122.0, "protein": 6.7, "carb": 26.4, "fat": 0.2},
  {"food": "蔥", "kcal": 31.0, "protein": 1.3, "carb": 6.6, "fat": 0.2},
  {"food": "醬油", "kcal": 90.0, "protein": 7.8, "carb": 14.7, "fat": 0},
  {"food": "米酒", "kcal": 133.0, "protein": 1.8, "carb": 19.1, "fat": 0.0},
  {"food": "冰糖", "kcal": 387.0, "protein": 0, "carb": 99.9, "fat": 0},
  {"food": "紅蔥頭", "kcal": 75.0, "protein": 3.4, "carb": 16.4, "fat": 0.3},
  {"food": "咖啡豆", "kcal": 437.0, "protein": 13.9, "carb": 65.1, "fat": 14.9},
  {"food": "威士忌", "kcal": 250.0, "protein": 0, "carb": 0.1, "fat": 0},
  {"food": "檸檬汁", "kcal": 31.0, "protein": 0.5, "carb": 7.0, "fat": 0.4},
  {"food": "糖漿", "kcal": 297.0, "protein": 0, "carb": 76.9, "fat": 0},
  {"food": "蛋白", "kcal": 50.0, "protein": 11.2, "carb": 0.5, "fat": 0.1},
  {"food": "低筋麵粉", "kcal": 364.0, "protein": 8.1, "carb": 78.2, "fat": 1.2},
  {"food": "中筋麵粉", "kcal": 361.0, "protein": 11.5, "carb": 74.1, "fat": 1.3},
  {"food": "高筋麵粉", "kcal": 362.0, "protein": 12.9, "carb": 73.1, "fat": 1.2},
  {"food": "無鹽奶油", "kcal": 733.0, "protein": 0.6, "carb": 0.9, "fat": 82.7},
  {"food": "白葡萄酒", "kcal": 90.0, "protein": 0.1, "carb": 14.2, "fat": 0.0},
  {"food": "白葡萄酒醋", "kcal": 18.0, "protein": 0.0, "carb": 0.3, "fat": 0.0},
  {"food": "紅蔥頭", "kcal": 75.0, "protein": 3.4, "carb": 16.4, "fat": 0.3},
  {"food": "白胡椒", "kcal": 342.0, "protein": 3.7, "carb": 78.8, "fat": 1.1},
  {"food": "水波蛋", "kcal": 147.0, "protein": 11.6, "carb": 0.8, "fat": 10.7},
  {"food": "白醋", "kcal": 18.0, "protein": 0, "carb": 0.3, "fat": 0},
  {"food": "五花肉", "kcal": 368.0, "protein": 14.5, "carb": 0.0, "fat": 33.9},
  {"food": "豬肉", "kcal": 212.0, "protein": 18.7, "carb": 0.0, "fat": 14.6},
  {"food": "雞肉", "kcal": 151.0, "protein": 18.9, "carb": 0.0, "fat": 7.8},
  {"food": "魚", "kcal": 110.0, "protein": 20.6, "carb": 0.2, "fat": 2.5},
  {"food": "馬鈴薯", "kcal": 77.0, "protein": 2.6, "carb": 15.8, "fat": 0.2},
  {"food": "胡蘿蔔", "kcal": 37.0, "protein": 1.0, "carb": 8.5, "fat": 0.2},
  {"food": "香菇", "kcal": 39.0, "protein": 3.0, "carb": 7.6, "fat": 0.1},
  {"food": "木耳", "kcal": 38.0, "protein": 0.9, "carb": 8.8, "fat": 0.1},
  {"food": "豆腐", "kcal": 88.0, "protein": 8.5, "carb": 6.0, "fat": 3.4},
  {"food": "豆漿", "kcal": 60.0, "protein": 3.2, "carb": 9.0, "fat": 1.3},
  {"food": "花生", "kcal": 562.0, "protein": 17.9, "carb": 43.3, "fat": 35.3},
  {"food": "核桃", "kcal": 667.0, "protein": 15.4, "carb": 11.2, "fat": 67.9},
  {"food": "芝麻", "kcal": 598.0, "protein": 22.3, "carb": 15.0, "fat": 54.9},
  {"food": "蜂蜜", "kcal": 308.0, "protein": 0.2, "carb": 79.6, "fat": 0.2},
  {"food": "果醬", "kcal": 272.0, "protein": 0.4, "carb": 65.0, "fat": 1.2},
  {"food": "巧克力", "kcal": 546.0, "protein": 9.4, "carb": 54.0, "fat": 32.6},
  {"food": "咖啡", "kcal": 2.0, "protein": 0.2, "carb": 0.3, "fat": 0.1},
  {"food": "啤酒", "kcal": 49.0, "protein": 0, "carb": 8.9, "fat": 0.0},
  {"food": "葡萄酒", "kcal": 90.0, "protein": 0.1, "carb": 14.2, "fat": 0.0},
];

export const UNIT_MAP: UnitMapItem[] = [
  {"food": "雞蛋", "unit": "個", "servingsPerUnit": 1.0, "type": "豆魚蛋肉類", "notes": "1顆≈55g", "weightPerServing": 55.0, "kcal": 70.0, "protein": 7.0, "carb": 0.0, "fat": 5.0},
  {"food": "雞蛋", "unit": "顆", "servingsPerUnit": 1.0, "type": "豆魚蛋肉類", "notes": "1顆≈55g", "weightPerServing": 55.0, "kcal": 70.0, "protein": 7.0, "carb": 0.0, "fat": 5.0},
  {"food": "白飯", "unit": "碗", "servingsPerUnit": 4.0, "type": "全穀雜糧類", "notes": "1/4 碗=1份", "weightPerServing": 40.0, "kcal": 70.0, "protein": 2.0, "carb": 15.0, "fat": 0.0},
  {"food": "橄欖油", "unit": "大匙", "servingsPerUnit": 3.0, "type": "油脂類", "notes": "1大匙=3份", "weightPerServing": 15.0, "kcal": 135.0, "protein": 0.0, "carb": 0.0, "fat": 15.0},
  {"food": "橄欖油", "unit": "茶匙", "servingsPerUnit": 1.0, "type": "油脂類", "notes": "1茶匙=1份", "weightPerServing": 5.0, "kcal": 45.0, "protein": 0.0, "carb": 0.0, "fat": 5.0},
  {"food": "食用油", "unit": "匙", "servingsPerUnit": 1.0, "type": "油脂類", "notes": "1匙=1份", "weightPerServing": 5.0, "kcal": 45.0, "protein": 0.0, "carb": 0.0, "fat": 5.0},
  {"food": "大匙", "unit": "大匙", "servingsPerUnit": 3.0, "type": "油脂類", "notes": "1大匙=3份", "weightPerServing": 15.0, "kcal": 135.0, "protein": 0.0, "carb": 0.0, "fat": 15.0},
  {"food": "茶匙", "unit": "茶匙", "servingsPerUnit": 1.0, "type": "油脂類", "notes": "1茶匙=1份", "weightPerServing": 5.0, "kcal": 45.0, "protein": 0.0, "carb": 0.0, "fat": 5.0},
  {"food": "牛奶", "unit": "杯", "servingsPerUnit": 1.0, "type": "乳品類", "notes": "240ml=1份", "weightPerServing": 240.0, "kcal": 150.0, "protein": 8.0, "carb": 12.0, "fat": 8.0},
  {"food": "鮮奶油", "unit": "大匙", "servingsPerUnit": 1.0, "type": "油脂類", "notes": "1大匙≈15g", "weightPerServing": 15.0, "kcal": 50.0, "protein": 0.3, "carb": 0.4, "fat": 5.5},
  {"food": "無鹽奶油", "unit": "g", "servingsPerUnit": 0.2, "type": "油脂類", "notes": "5g=1份", "weightPerServing": 5.0, "kcal": 45.0, "protein": 0.0, "carb": 0.0, "fat": 5.0},
];
