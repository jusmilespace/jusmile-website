import { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  Calculator,
  AlertTriangle,
  Tag,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Save,
  Youtube,
  Info,
  Copy,
  ExternalLink
} from 'lucide-react';
import { parseRecipe } from './services/geminiService';
import { calculateNutrition, detectAllergens, getHealthTags } from './services/nutritionService';

const generateAutoIds = (titleEn: string, titleZh: string) => {
  const base = (titleEn || titleZh || 'recipe')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-');

  return {
    id: `recipe_${Date.now()}`, // 內部 ID
    slug: `${base}-${Math.random().toString(36).substring(2, 6)}` // 網址 Slug
  };
};



interface Ingredient {
  name: string;
  amount: string;
}

interface RecipeData {
  slug: string;
  titleZh: string;
  titleEn: string;
  series: string;
  hook: string;
  proTips: string[];
  miseEnPlace: string[];
  youtubeUrl: string;
  imageUrl?: string;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<RecipeData>({
    slug: '',
    titleZh: '',
    titleEn: '',
    series: '微笑料理',
    hook: '',
    proTips: [''],
    miseEnPlace: [''],
    youtubeUrl: '',
    imageUrl: '',
    servings: 1,
    ingredients: [],
    steps: [''],
    tags: []
  });

  const [nutrition, setNutrition] = useState<any>(null);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [showGithubSettings, setShowGithubSettings] = useState(false);
  const [existingRecipes, setExistingRecipes] = useState<any[]>([]);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [githubSettings, setGithubSettings] = useState({
    token: localStorage.getItem('gh_token') || '',
    geminiKey: localStorage.getItem('gemini_api_key') || '',
    owner: localStorage.getItem('gh_owner') || '',
    repo: localStorage.getItem('gh_repo') || '',
    path: localStorage.getItem('gh_path') || 'data/recipes.json',
    csvOwner: localStorage.getItem('gh_csv_owner') || '',
    csvRepo: localStorage.getItem('gh_csv_repo') || '',
    csvPath: localStorage.getItem('gh_csv_path') || 'public/data/Unit_Map.csv'
  });

  const saveGithubSettings = (settings: typeof githubSettings) => {
    localStorage.setItem('gh_token', settings.token);
    localStorage.setItem('gemini_api_key', settings.geminiKey);
    localStorage.setItem('gh_owner', settings.owner);
    localStorage.setItem('gh_repo', settings.repo);
    localStorage.setItem('gh_path', settings.path);
    localStorage.setItem('gh_csv_owner', settings.csvOwner);
    localStorage.setItem('gh_csv_repo', settings.csvRepo);
    localStorage.setItem('gh_csv_path', settings.csvPath);
    setGithubSettings(settings);
    setShowGithubSettings(false);
  };

  const handleProcess = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const parsed = await parseRecipe(text, githubSettings.geminiKey);

      const newFormData = {
        ...formData,
        titleZh: parsed.titleZh || '',
        titleEn: parsed.titleEn || '',
        series: parsed.series || '微笑料理',
        hook: parsed.hook || '',
        proTips: parsed.proTips?.length ? parsed.proTips : [''],
        miseEnPlace: parsed.miseEnPlace?.length ? parsed.miseEnPlace : [''],
        servings: parsed.servings || 1,
        ingredients: parsed.ingredients || [],
        steps: parsed.steps?.length ? parsed.steps : [''],
      };

      setFormData(newFormData);
      await updateNutrition(newFormData.ingredients, newFormData.servings);
    } catch (error) {
      console.error("Error parsing recipe:", error);
      alert("解析食譜失敗，請重試。");
    } finally {
      setIsLoading(false);
    }
  };

  const updateNutrition = async (ingredients: Ingredient[], currentServings: number) => {
    if (!ingredients.length) return;
    const nutResults = await calculateNutrition(ingredients, currentServings, githubSettings.geminiKey);
    setNutrition(nutResults);

    const detectedAllergens = detectAllergens(ingredients.map(i => i.name));
    setAllergens(detectedAllergens);

    const hTags = getHealthTags(nutResults.perServing);
    setFormData(prev => ({
      ...prev,
      tags: Array.from(new Set([...prev.tags, ...hTags]))
    }));
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setInputText(content);
      await handleProcess(content);
    };
    reader.readAsText(file);
  };

  const fetchExistingRecipes = async () => {
    if (!githubSettings.token || !githubSettings.owner || !githubSettings.repo) return;
    try {
      const { token, owner, repo, path } = githubSettings;
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${path}?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setExistingRecipes(data);
      }
    } catch (e) {
      console.error('Failed to fetch recipes:', e);
    }
  };

  const loadRecipeForEdit = (recipe: any) => {
    setEditingRecipeId(recipe.id);
    setEditSearchQuery(recipe.titleZh);
    setShowEditDropdown(false);
    setFormData({
      slug: recipe.slug || '',
      titleZh: recipe.titleZh || '',
      titleEn: recipe.titleEn || '',
      series: recipe.series || '微笑料理',
      hook: recipe.hook || '',
      proTips: recipe.proTips?.length ? recipe.proTips : [''],
      miseEnPlace: recipe.miseEnPlace?.length ? recipe.miseEnPlace : [''],
      youtubeUrl: recipe.youtubeId ? `https://www.youtube.com/watch?v=${recipe.youtubeId}` : '',
      imageUrl: recipe.imageUrl || '',
      servings: recipe.servings || 1,
      ingredients: recipe.ingredients || [],
      steps: recipe.steps?.length ? recipe.steps : [''],
      tags: recipe.tags || []
    });
    setNutrition({
      total: recipe.nutrition.total,
      perServing: recipe.nutrition.perServing,
      ingredients: []
    });
    setAllergens(detectAllergens((recipe.ingredients || []).map((i: any) => i.name)));
  };

  const handleInputChange = (field: keyof RecipeData, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // If servings or ingredients change, recalculate nutrition
    if (field === 'servings' || field === 'ingredients') {
      updateNutrition(newFormData.ingredients, newFormData.servings);
    }
  };

  const addStep = () => {
    setFormData(prev => ({ ...prev, steps: [...prev.steps, ''] }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const addMiseStep = () => {
    setFormData(prev => ({ ...prev, miseEnPlace: [...prev.miseEnPlace, ''] }));
  };

  const removeMiseStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      miseEnPlace: prev.miseEnPlace.filter((_, i) => i !== index)
    }));
  };

  const updateMiseStep = (index: number, value: string) => {
    const newMise = [...formData.miseEnPlace];
    newMise[index] = value;
    setFormData(prev => ({ ...prev, miseEnPlace: newMise }));
  };

  const addProTip = () => {
    setFormData(prev => ({ ...prev, proTips: [...prev.proTips, ''] }));
  };

  const removeProTip = (index: number) => {
    setFormData(prev => ({
      ...prev,
      proTips: prev.proTips.filter((_, i) => i !== index)
    }));
  };

  const updateProTip = (index: number, value: string) => {
    const newTips = [...formData.proTips];
    newTips[index] = value;
    setFormData(prev => ({ ...prev, proTips: newTips }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, imageUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleTagInput = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = (e.target as HTMLInputElement).value.trim();
      if (val && !formData.tags.includes(val)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
        (e.target as HTMLInputElement).value = '';
      }
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : 'dQw4w9WgXcQ';
  };

  const generateFinalJson = () => {
    if (!nutrition) return null;

    // 🚀 正確呼叫產生器
    const autoIds = generateAutoIds(formData.titleEn, formData.titleZh);

    // 決定最終 Slug
    const finalSlug = formData.slug || autoIds.slug;
    const finalId = editingRecipeId || autoIds.id;

    return {
      id: finalId,     // 這裡強制改為 recipe_174xxx
      slug: finalSlug, // 這裡強制新增 slug 欄位
      series: formData.series,
      hook: formData.hook,
      proTips: formData.proTips.filter(t => t.trim() !== ''),
      miseEnPlace: formData.miseEnPlace.filter(s => s.trim() !== ''),
      titleZh: formData.titleZh,
      titleEn: formData.titleEn,
      tags: formData.tags,
      youtubeId: formData.youtubeUrl ? getYoutubeId(formData.youtubeUrl) : undefined,
      imageUrl: formData.imageUrl || undefined,
      servings: formData.servings,
      nutrition: {
        total: nutrition.total,
        perServing: nutrition.perServing
      },
      ingredients: formData.ingredients,
      steps: formData.steps
    };
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);

  const handleSave = async () => {
    const finalData = generateFinalJson();
    if (!finalData) {
      alert("資料不完整，無法儲存。");
      return;
    }

    setIsSaving(true);

    // If GitHub settings are configured, try direct publishing
    if (githubSettings.token && githubSettings.owner && githubSettings.repo) {
      try {
        const { token, owner, repo, path } = githubSettings;
        const authHeader = { Authorization: `token ${token}` };

        // 1. Get current file content and SHA (Add timestamp to avoid cache)
        const getFileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?t=${Date.now()}`, {
          headers: authHeader
        });

        let currentContent: any[] = [];
        let sha = '';

        if (getFileRes.ok) {
          const fileData = await getFileRes.json();
          sha = fileData.sha;
          const decoded = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
          currentContent = JSON.parse(decoded);
        } else if (getFileRes.status !== 404) {
          throw new Error(`無法讀取 recipes.json: ${getFileRes.statusText}`);
        }

        // 2. Update or Append recipe
        // 修正比對邏輯：優先比對 slug，再比對 id，最後比對中文標題（相容舊資料）
        const existingIndex = currentContent.findIndex(r =>
          (r.slug && r.slug === finalData.slug) ||
          (r.id === finalData.id) ||
          (r.titleZh === finalData.titleZh)
        );
        let updatedContent;
        if (existingIndex !== -1) {
          // Update existing
          updatedContent = [...currentContent];
          updatedContent[existingIndex] = finalData;
        } else {
          // Append new
          updatedContent = [...currentContent, finalData];
        }

        const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(updatedContent, null, 2))));

        // 3. Update file
        const updateRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
          method: 'PUT',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Add new recipe: ${finalData.titleZh}`,
            content: encodedContent,
            sha: sha || undefined
          })
        });

        if (!updateRes.ok) {
          const err = await updateRes.json();
          throw new Error(`JSON 更新失敗: ${err.message}`);
        }

        // 4. Optional: Sync to CSV Repo
        if (githubSettings.csvOwner && githubSettings.csvRepo) {
          try {
            const { csvOwner, csvRepo, csvPath } = githubSettings;

            // Get current CSV (Add timestamp to avoid cache)
            const getCsvRes = await fetch(`https://api.github.com/repos/${csvOwner}/${csvRepo}/contents/${csvPath}?t=${Date.now()}`, {
              headers: authHeader
            });

            let csvContent = "";
            let csvSha = "";

            if (getCsvRes.ok) {
              const csvData = await getCsvRes.json();
              csvSha = csvData.sha;
              csvContent = decodeURIComponent(escape(atob(csvData.content.replace(/\s/g, ''))));
            } else if (getCsvRes.status !== 404) {
              throw new Error(`無法讀取 Unit_Map.csv: ${getCsvRes.statusText}`);
            }

            const csvLines = csvContent.split(/\r?\n/).filter(l => l.trim() !== '');
            if (csvLines.length === 0) throw new Error("CSV 檔案格式錯誤或為空");

            const header = csvLines[0];
            const dataLines = csvLines.slice(1);
            const existingIds = dataLines.map(l => l.split(',')[0]); // 重新命名為 Ids 較準確

            // 1. 使用中文名稱作為 CSV 搜尋 Key
            const dishName = formData.titleZh;

            // 2. 準備橫列 (第一欄維持中文)
            const dishRow = `${dishName},份,1,混合料理,,${nutrition.perServing.weight},${nutrition.perServing.kcal},${nutrition.perServing.protein},${nutrition.perServing.carbs},${nutrition.perServing.fat},Ju Smile`;

            // 3. 尋找舊資料並更新
            const dishIndex = dataLines.findIndex(l => l.split(',')[0] === dishName);

            if (dishIndex !== -1) {
              dataLines[dishIndex] = dishRow;
            } else {
              dataLines.push(dishRow);
            }


            const updatedCsv = [header, ...dataLines].join('\r\n') + '\r\n';
            const encodedCsv = btoa(unescape(encodeURIComponent(updatedCsv)));

            const csvUpdateRes = await fetch(`https://api.github.com/repos/${csvOwner}/${csvRepo}/contents/${csvPath}`, {
              method: 'PUT',
              headers: {
                ...authHeader,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: `Sync recipe & missing ingredients: ${finalData.titleZh}`,
                content: encodedCsv,
                sha: csvSha || undefined
              })
            });

            if (!csvUpdateRes.ok) {
              const err = await csvUpdateRes.json();
              throw new Error(`CSV 更新失敗: ${err.message}`);
            }
          } catch (csvErr: any) {
            console.error("CSV Sync Error:", csvErr);
            alert(`⚠️ 食譜已發佈至網站，但 Unit_Map.csv 同步失敗：\n${csvErr.message}`);
          }
        }

        setIsSaving(false);
        setIsSaveSuccess(true);
        return;
      } catch (error: any) {
        console.error("GitHub Publish Error:", error);
        alert(`❌ 發佈失敗：\n${error.message}\n\n請檢查您的 GitHub 設定與網路連線。`);
      }
    }

    // Fallback to manual copy
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigator.clipboard.writeText(JSON.stringify(finalData, null, 2));
    setIsSaving(false);
    setIsSaveSuccess(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已複製到剪貼簿！");
  };

  return (
    <div className="min-h-screen bg-[#fdfcf9] text-[#1f2937] font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
              <span className="text-mint font-bold italic text-sm">J</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight">Ju Smile Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowGithubSettings(true)}
              className="text-xs font-bold text-gray-400 hover:text-mint transition-colors flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              GitHub 設定
            </button>
            <div className="text-[10px] bg-mint-light text-mint-dark font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Recipe Publisher
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-12">

        {/* Step 1: Upload/Paste */}
        {!nutrition && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">開始發佈新食譜</h2>
              <p className="text-gray-400">貼上文字或上傳檔案，AI 將自動為您計算營養成分</p>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm space-y-6">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="在此貼上食譜文字..."
                className="w-full h-64 p-6 bg-[#f4faf7] border-none rounded-2xl focus:ring-2 focus:ring-mint/20 outline-none transition-all resize-none text-sm leading-relaxed"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => handleProcess(inputText)}
                  disabled={!inputText.trim()}
                  className="flex-1 py-4 bg-mint text-white rounded-2xl font-bold shadow-lg shadow-mint/20 hover:bg-mint-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Calculator className="w-5 h-5" />
                  自動辨識並計算
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-4 bg-white border border-black/5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.json" />
              </div>
            </div>

            {/* 編輯既有食譜 */}
            <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-mint" />
                <span className="text-sm font-bold">編輯既有食譜</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={editSearchQuery}
                  onChange={(e) => {
                    setEditSearchQuery(e.target.value);
                    setShowEditDropdown(true);
                    if (existingRecipes.length === 0) fetchExistingRecipes();
                  }}
                  onFocus={() => {
                    setShowEditDropdown(true);
                    if (existingRecipes.length === 0) fetchExistingRecipes();
                  }}
                  onBlur={() => setTimeout(() => setShowEditDropdown(false), 150)}
                  placeholder="搜尋食譜名稱..."
                  className="w-full px-4 py-3 bg-[#f4faf7] border-none rounded-2xl focus:ring-2 focus:ring-mint/20 outline-none text-sm"
                />
                {showEditDropdown && existingRecipes.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/5 rounded-2xl shadow-lg max-h-60 overflow-y-auto z-10">
                    {existingRecipes
                      .filter(r =>
                        !editSearchQuery ||
                        r.titleZh?.includes(editSearchQuery) ||
                        r.titleEn?.toLowerCase().includes(editSearchQuery.toLowerCase())
                      )
                      .map((r) => (
                        <button
                          key={r.id}
                          onMouseDown={() => loadRecipeForEdit(r)}
                          className="w-full text-left px-4 py-3 hover:bg-[#f4faf7] text-sm border-b border-black/5 last:border-0"
                        >
                          <div className="font-bold">{r.titleZh}</div>
                          <div className="text-xs text-gray-400">{r.titleEn}</div>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}

        {isLoading && (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-mint animate-spin" />
            <p className="font-bold text-mint">AI 正在分析並計算營養中...</p>
          </div>
        )}

        {/* Step 2: The Form (Matching Screenshot) */}
        {nutrition && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  📝 新增食譜
                </h2>
                <p className="text-xs text-gray-400 mt-1">填寫完成後儲存至 GitHub</p>
              </div>
              <button
                onClick={() => { setNutrition(null); setInputText(''); setEditingRecipeId(null); setEditSearchQuery(''); }}
                className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
              >
                重新開始
              </button>
            </div>

            {/* Form Sections */}
            <div className="space-y-12">

              {/* 基本資料 */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-mint rounded-full" />
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">基本資料</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">系列</label>
                    <select
                      value={formData.series}
                      onChange={(e) => handleInputChange('series', e.target.value)}
                      className="w-full p-4 bg-white border border-black/5 rounded-2xl focus:ring-2 focus:ring-mint/20 outline-none appearance-none"
                    >
                      <option value="微笑料理">微笑料理</option>
                      <option value="料理實驗室">料理實驗室</option>
                      <option value="阿嬤的私房菜">阿嬤的私房菜</option>
                      <option value="Julia Child 經典重現">Julia Child 經典重現</option>
                      <option value="微笑吧台">微笑吧台</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1 flex justify-between">
                      人份數 <span className="text-[10px] font-normal opacity-60">(與計算器同步)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.servings}
                      onChange={(e) => handleInputChange('servings', parseInt(e.target.value))}
                      className="w-full p-4 bg-white border border-black/5 rounded-2xl focus:ring-2 focus:ring-mint/20 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1">Hook <span className="text-[10px] font-normal opacity-60">(一句吸引人的話)</span></label>
                  <input
                    type="text"
                    value={formData.hook}
                    onChange={(e) => handleInputChange('hook', e.target.value)}
                    placeholder="例如：2顆蛋・2匙油・2支筷"
                    className="w-full p-4 bg-white border border-black/5 rounded-2xl focus:ring-2 focus:ring-mint/20 outline-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 ml-1">Pro Tips <span className="text-[10px] font-normal opacity-60">(料理小撇步)</span></label>
                  {formData.proTips.map((tip, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="flex-1 relative">
                        <textarea
                          value={tip}
                          onChange={(e) => updateProTip(idx, e.target.value)}
                          placeholder={`小撇步 ${idx + 1}...`}
                          className="w-full p-4 bg-amber-50 border border-amber-100 rounded-2xl focus:ring-2 focus:ring-amber-200 outline-none resize-none text-sm leading-relaxed"
                          rows={2}
                        />
                        <button
                          onClick={() => removeProTip(idx)}
                          className="absolute -right-10 top-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addProTip}
                    className="w-full p-4 border-2 border-dashed border-amber-200 rounded-2xl text-xs font-bold text-amber-600 hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> 新增小撇步
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-mint-dark ml-1">網址別名 (Slug) <span className="text-[10px] font-normal opacity-60">(網址顯示用，限英文數字)</span></label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="例如：tomato-egg-pasta"
                    className="w-full p-4 bg-[#f4faf7] border border-mint/20 rounded-2xl focus:ring-2 focus:ring-mint/20 outline-none font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">食譜中文名稱</label>
                    <input
                      type="text"
                      value={formData.titleZh}
                      onChange={(e) => handleInputChange('titleZh', e.target.value)}
                      placeholder="漩渦蛋 / 裙擺蛋"
                      className="w-full p-4 bg-white border border-black/5 rounded-2xl focus:ring-2 focus:ring-mint/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">英文名稱</label>
                    <input
                      type="text"
                      value={formData.titleEn}
                      onChange={(e) => handleInputChange('titleEn', e.target.value)}
                      placeholder="Tornado Omelette"
                      className="w-full p-4 bg-white border border-black/5 rounded-2xl focus:ring-2 focus:ring-mint/20 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">YouTube 連結</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.youtubeUrl}
                        onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full p-4 bg-white border border-black/5 rounded-2xl focus:ring-2 focus:ring-mint/20 outline-none pl-12"
                      />
                      <Youtube className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">或上傳食譜照片</label>
                    <div className="flex gap-2">
                      <div
                        onClick={() => imageInputRef.current?.click()}
                        className="flex-1 p-4 bg-white border border-black/5 rounded-2xl cursor-pointer hover:bg-gray-50 transition-all flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-400 truncate">
                          {formData.imageUrl ? '✅ 已選擇照片' : '點擊上傳照片...'}
                        </span>
                        <Upload className="w-4 h-4 text-gray-400" />
                      </div>
                      {formData.imageUrl && (
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                          className="px-4 bg-white border border-black/5 rounded-2xl text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1">標籤 <span className="text-[10px] font-normal opacity-60">(輸入後按 Enter 新增)</span></label>
                  <div className="w-full p-2 bg-white border border-black/5 rounded-2xl flex flex-wrap gap-2 min-h-[56px]">
                    {formData.tags.map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                    <input
                      type="text"
                      onKeyDown={handleTagInput}
                      placeholder="快速、低卡、健身..."
                      className="flex-1 bg-transparent outline-none text-sm p-2 min-w-[120px]"
                    />
                  </div>
                </div>
              </section>

              {/* 食材清單 */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-mint rounded-full" />
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">食材清單</h3>
                </div>

                <div className="bg-white rounded-[32px] border border-black/5 overflow-hidden">
                  <div className="divide-y divide-black/5">
                    {nutrition.ingredients.map((ing: any, idx: number) => (
                      <div key={idx} className="p-4 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-mint-light text-mint-dark flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold">{ing.name}</p>
                              {ing.isEstimated && <span className="text-[8px] bg-orange-100 text-orange-600 px-1 rounded font-bold">AI 估計</span>}
                            </div>
                            <p className="text-[10px] text-gray-400">{ing.amount}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs font-bold text-mint-dark">{ing.kcal} kcal</p>
                          </div>
                          <button
                            onClick={() => {
                              const newIngs = formData.ingredients.filter((_, i) => i !== idx);
                              handleInputChange('ingredients', newIngs);
                            }}
                            className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const name = prompt("食材名稱：");
                      const amount = prompt("份量（如：100g, 2 顆）：");
                      if (name && amount) {
                        handleInputChange('ingredients', [...formData.ingredients, { name, amount }]);
                      }
                    }}
                    className="w-full p-4 text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> 新增食材
                  </button>
                </div>
                <p className="text-[10px] text-center text-gray-300">從左側計算器加入食材後，點「帶入食譜表單」自動填入</p>
              </section>

              {/* 備料 Mise en Place */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-[#7B9BAE] rounded-full" />
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">備料 Mise en Place</h3>
                </div>

                <div className="space-y-4">
                  {formData.miseEnPlace.map((step, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="w-8 h-8 rounded-full bg-[#7B9BAE] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-2">
                        {idx + 1}
                      </div>
                      <div className="flex-1 relative">
                        <textarea
                          value={step}
                          onChange={(e) => updateMiseStep(idx, e.target.value)}
                          placeholder={`備料步驟 ${idx + 1}...`}
                          className="w-full p-4 bg-white border border-black/5 rounded-2xl focus:ring-2 focus:ring-[#7B9BAE]/20 outline-none transition-all resize-none text-sm leading-relaxed"
                          rows={2}
                        />
                        <button
                          onClick={() => removeMiseStep(idx)}
                          className="absolute -right-10 top-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addMiseStep}
                    className="w-full p-4 border-2 border-dashed border-black/5 rounded-2xl text-xs font-bold text-gray-400 hover:bg-gray-50 hover:border-[#7B9BAE]/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> 新增備料步驟
                  </button>
                </div>
              </section>

              {/* 料理步驟 */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-mint rounded-full" />
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">料理步驟</h3>
                </div>

                <div className="space-y-4">
                  {formData.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="w-8 h-8 rounded-full bg-mint text-white flex items-center justify-center text-xs font-bold shrink-0 mt-2">
                        {idx + 1}
                      </div>
                      <div className="flex-1 relative">
                        <textarea
                          value={step}
                          onChange={(e) => updateStep(idx, e.target.value)}
                          placeholder={`步驟 ${idx + 1}...`}
                          className="w-full p-4 bg-white border border-black/5 rounded-2xl focus:ring-2 focus:ring-mint/20 outline-none transition-all resize-none text-sm leading-relaxed"
                          rows={2}
                        />
                        <button
                          onClick={() => removeStep(idx)}
                          className="absolute -right-10 top-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addStep}
                    className="w-full p-4 border-2 border-dashed border-black/5 rounded-2xl text-xs font-bold text-gray-400 hover:bg-gray-50 hover:border-mint/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> 新增步驟
                  </button>
                </div>
              </section>

              {/* 營養資訊 */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-mint rounded-full" />
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">營養資訊 <span className="text-[10px] font-normal opacity-60 ml-2">(從左側計算器帶入)</span></h3>
                </div>

                <div className="bg-[#f4faf7] p-6 rounded-[32px] border border-mint/10 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-bold text-mint-dark uppercase tracking-widest">每份熱量</p>
                    <p className="text-2xl font-bold">{nutrition.perServing.kcal}<span className="text-xs font-normal ml-1">kcal</span></p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-bold text-mint-dark uppercase tracking-widest">蛋白質</p>
                    <p className="text-2xl font-bold">{nutrition.perServing.protein}<span className="text-xs font-normal ml-1">g</span></p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-bold text-mint-dark uppercase tracking-widest">脂肪</p>
                    <p className="text-2xl font-bold">{nutrition.perServing.fat}<span className="text-xs font-normal ml-1">g</span></p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-bold text-mint-dark uppercase tracking-widest">碳水</p>
                    <p className="text-2xl font-bold">{nutrition.perServing.carbs}<span className="text-xs font-normal ml-1">g</span></p>
                  </div>
                </div>

                {formData.proTips.length > 0 && formData.proTips.some(t => t.trim() !== '') && (
                  <div className="space-y-4">
                    {formData.proTips.filter(t => t.trim() !== '').map((tip, idx) => (
                      <div key={idx} className="p-6 bg-amber-50 border border-amber-100 rounded-[32px] space-y-2 shadow-sm">
                        <div className="flex items-center gap-2 text-amber-600">
                          <Info className="w-4 h-4" />
                          <p className="text-xs font-bold uppercase tracking-widest">Pro Tip {idx + 1}</p>
                        </div>
                        <p className="text-sm text-amber-900 italic leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                )}

                {allergens.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <p className="text-xs font-bold text-red-800">過敏原提醒：{allergens.join('、')}</p>
                  </div>
                )}
              </section>

              {/* Final Actions */}
              <div className="pt-10 flex gap-4">
                <button
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  className="px-8 py-4 bg-white border border-black/5 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm"
                >
                  預覽 JSON
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-mint text-white rounded-2xl font-bold shadow-xl shadow-mint/20 hover:bg-mint-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {isSaving ? '正在發佈...' : '儲存並發佈食譜'}
                </button>
              </div>

              {showJsonPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-black rounded-3xl p-6 overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-mint uppercase tracking-widest">JSON Output</span>
                    <button onClick={() => copyToClipboard(JSON.stringify(generateFinalJson(), null, 2))} className="text-mint hover:text-white transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <pre className="text-[10px] text-mint-light/60 overflow-x-auto leading-relaxed">
                    {JSON.stringify(generateFinalJson(), null, 2)}
                  </pre>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showGithubSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[40px] p-10 max-w-md w-full space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">GitHub 自動發佈設定</h3>
                  <p className="text-gray-500 text-xs">設定後點擊「儲存並發佈」將自動更新您的網站</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gemini API Key</label>
                    <input
                      type="password"
                      value={githubSettings.geminiKey}
                      onChange={(e) => setGithubSettings(prev => ({ ...prev, geminiKey: e.target.value }))}
                      placeholder="AIza..."
                      className="w-full p-3 bg-gray-50 border border-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-mint/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personal Access Token</label>
                      <a
                        href="https://github.com/settings/tokens/new?notes=Ju%20Smile%20App&scopes=repo"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-mint hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-2 h-2" /> 如何取得？
                      </a>
                    </div>
                    <input
                      type="password"
                      value={githubSettings.token}
                      onChange={(e) => setGithubSettings(prev => ({ ...prev, token: e.target.value }))}
                      placeholder="ghp_..."
                      className="w-full p-3 bg-gray-50 border border-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-mint/20"
                    />
                  </div>

                  <div className="pt-2 border-t border-black/5">
                    <p className="text-[10px] font-bold text-mint-dark uppercase tracking-widest ml-1 mb-2">食譜網站 Repo (JSON)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Owner</label>
                        <input
                          type="text"
                          value={githubSettings.owner}
                          onChange={(e) => setGithubSettings(prev => ({ ...prev, owner: e.target.value }))}
                          placeholder="GitHub 帳號"
                          className="w-full p-3 bg-gray-50 border border-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-mint/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Repo Name</label>
                        <input
                          type="text"
                          value={githubSettings.repo}
                          onChange={(e) => setGithubSettings(prev => ({ ...prev, repo: e.target.value }))}
                          placeholder="專案名稱"
                          className="w-full p-3 bg-gray-50 border border-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-mint/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 mt-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">JSON Path</label>
                      <input
                        type="text"
                        value={githubSettings.path}
                        onChange={(e) => setGithubSettings(prev => ({ ...prev, path: e.target.value }))}
                        placeholder="data/recipes.json"
                        className="w-full p-3 bg-gray-50 border border-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-mint/20"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-black/5">
                    <p className="text-[10px] font-bold text-mint-dark uppercase tracking-widest ml-1 mb-2">營養數據 Repo (CSV)</p>
                    <p className="text-[9px] text-gray-400 mb-2 ml-1">可與網站 Repo 不同，系統會自動同步食材熱量</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Owner</label>
                        <input
                          type="text"
                          value={githubSettings.csvOwner}
                          onChange={(e) => setGithubSettings(prev => ({ ...prev, csvOwner: e.target.value }))}
                          placeholder="GitHub 帳號"
                          className="w-full p-3 bg-gray-50 border border-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-mint/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Repo Name</label>
                        <input
                          type="text"
                          value={githubSettings.csvRepo}
                          onChange={(e) => setGithubSettings(prev => ({ ...prev, csvRepo: e.target.value }))}
                          placeholder="ju-smile-app"
                          className="w-full p-3 bg-gray-50 border border-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-mint/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 mt-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">CSV Path</label>
                      <input
                        type="text"
                        value={githubSettings.csvPath}
                        onChange={(e) => setGithubSettings(prev => ({ ...prev, csvPath: e.target.value }))}
                        placeholder="public/data/Unit_Map.csv"
                        className="w-full p-3 bg-gray-50 border border-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-mint/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowGithubSettings(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => saveGithubSettings(githubSettings)}
                    className="flex-1 py-3 bg-mint text-white rounded-xl font-bold hover:bg-mint-dark transition-all"
                  >
                    儲存設定
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {isSaveSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[40px] p-10 max-w-md w-full text-center space-y-6 shadow-2xl"
              >
                <div className="w-20 h-20 bg-mint/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-mint" />
                </div>
                <div className="space-y-4 text-left">
                  <h3 className="text-2xl font-bold text-center">發佈成功！</h3>
                  <div className="bg-mint-light/30 p-4 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-mint-dark uppercase tracking-widest">
                      {githubSettings.token ? '🚀 已自動發佈至 GitHub' : '📋 已複製到剪貼簿'}
                    </p>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal ml-4">
                      {githubSettings.token ? (
                        <>
                          <li>數據已成功透過 GitHub API 更新至 <code className="bg-white px-1 rounded border border-black/5">{githubSettings.path}</code>。</li>
                          {githubSettings.csvRepo && <li>營養數據已同步至 <code className="bg-white px-1 rounded border border-black/5">{githubSettings.csvRepo}</code> 的 CSV。</li>}
                          <li>GitHub Actions 可能需要 1-2 分鐘來重新部署您的網站。</li>
                          <li>您可以直接前往您的網站查看更新！</li>
                        </>
                      ) : (
                        <>
                          <li>打開您的專案資料夾中的 <code className="bg-white px-1 rounded border border-black/5">data/recipes.json</code>。</li>
                          <li>在陣列的最後一個項目後加上逗號 <code className="bg-white px-1 rounded border border-black/5">,</code>。</li>
                          <li>貼上剛才複製的 JSON 數據。</li>
                          <li>在終端機執行：<br />
                            <code className="block bg-gray-900 text-mint p-2 rounded mt-1 text-[10px] font-mono">
                              git add data/recipes.json<br />
                              git commit -m "Add new recipe: {formData.titleZh}"<br />
                              git push
                            </code>
                          </li>
                        </>
                      )}
                    </ol>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setIsSaveSuccess(false);
                      setNutrition(null);
                      setInputText('');
                    }}
                    className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all"
                  >
                    太棒了，我知道了
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="mt-20 py-12 border-t border-black/5 text-center">
        <div className="max-w-xl mx-auto px-6 mb-12 text-left bg-gray-50 p-8 rounded-[32px] border border-black/5">
          <h4 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-mint" />
            如何將此工具整合到您的網站？
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            您可以將此專案的原始碼下載並放入您的 <code className="bg-white px-1 rounded">ju-smile-app</code> 儲存庫中。
            部署後，您可以直接在自己的網域（例如 <code className="bg-white px-1 rounded">admin.jusmile.com</code>）使用此後台，
            不需要每次都回到 AI Studio。
          </p>
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">整合要點：</p>
            <ul className="text-xs text-gray-500 list-disc ml-4 space-y-1">
              <li>設定環境變數 <code className="bg-white px-1 rounded">GEMINI_API_KEY</code>。</li>
              <li>在「GitHub 設定」中填入您的 Token，即可實現一鍵發佈。</li>
              <li>此工具產生的 JSON 格式已完全適配您的 <code className="bg-white px-1 rounded">recipes.html</code>。</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
          <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
            <span className="text-mint font-bold italic text-[10px]">J</span>
          </div>
          <span className="text-xs font-bold tracking-widest uppercase">Ju Smile Space</span>
        </div>
        <p className="text-xs text-gray-400">讓微笑・成為生活裡最好的調味料</p>
      </footer>
    </div>
  );
}
