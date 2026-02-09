import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import readline from 'readline';

// ■■■ 獲得した最強のキー ■■■
const apiKey = "AIzaSyBgZ1g2zRkT8ZXfvmkCRVpeX75mi432gd0";

// ■■■ モデルの候補リスト（正式名称版） ■■■
// 省略名(alias)ではなく、実体のあるバージョン番号を優先的に試します
const MODEL_CANDIDATES = [
  "gemini-1.5-flash-002",  // 最新の安定版（バージョン指定）
  "gemini-1.5-flash-001",  // ひとつ前の安定版
  "gemini-1.5-flash",      // 一般的な省略名
  "gemini-2.0-flash-exp",  // 2.0の正式名称
  "gemini-2.0-flash",      // 2.0の省略名
  "gemini-pro"             // 最終手段
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATEGORIES_DIR = path.join(__dirname, '../src/data/categories');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (query) => new Promise((resolve) => rl.question(query, resolve));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ■■■ 最適なモデルを見つける関数 ■■■
const findWorkingModel = async (genAI) => {
  console.log("🔍 あなたの環境で使えるモデルを検索中...");
  
  for (const modelName of MODEL_CANDIDATES) {
    process.stdout.write(`   Testing: ${modelName} ... `);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      // 軽いテストリクエスト
      await model.generateContent("Hi");
      console.log("✅ 成功！接続確立");
      return { model, name: modelName };
    } catch (error) {
      if (error.message.includes("429") || error.message.includes("Quota")) {
        // 429エラーは「存在しているが混んでいる」証拠なので、これを採用する
        console.log("⚠️ 混雑中ですがモデルは存在します。これを採用して待機モードで動かします。");
        const model = genAI.getGenerativeModel({ model: modelName });
        return { model, name: modelName };
      }
      // 404などはスキップ
      console.log("❌ 見つかりません (Skip)");
    }
  }
  return null;
};

// ■■■ 粘り強く生成する関数 ■■■
const generateWithRetry = async (model, prompt) => {
  let retries = 0;
  while (true) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      // 429エラー（制限）の場合はひたすら待つ
      if (error.message.includes("429") || error.message.includes("Quota") || error.message.includes("Too Many Requests")) {
        retries++;
        const waitTime = 20000; // 20秒待機
        console.log(`\n⏳ 混雑しています (429 Error)。${waitTime / 1000}秒待機して再試行します... (現在 ${retries}回目)`);
        await sleep(waitTime);
        continue; // ループの先頭に戻って再トライ
      }
      // それ以外のエラーは投げる
      throw error;
    }
  }
};

const createPrompt = (categoryTitle, existingCount) => {
  return `
    あなたはプロの英語教材作成者です。以下の仕様でJSONデータを作成してください。
    ## カテゴリ: "${categoryTitle}"
    ## 生成数: 5問
    ## JSONフォーマット (厳守)
    [
      {
        "id": "${categoryTitle.toLowerCase().replace(/\s+/g, '_')}_${existingCount}_1",
        "question": { "en": "Q", "ja": "A" },
        "answer": { "en": "A", "ja": "A" },
        "followUp": { "en": "F", "ja": "F" },
        "vocabulary": { "word": { "ja": "mean" } }
      }
    ]
    出力はJSONのみ。Markdown記法は不要。
  `;
};

const main = async () => {
  console.log("\n🤖 AI コンテンツ自動生成ツール (総当たり対応版) 🤖\n");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // 使えるモデルを自動で特定
  const selected = await findWorkingModel(genAI);

  if (!selected) {
    console.error("\n❌ エラー: どのモデル名も受け付けられませんでした。");
    console.error("   APIキーの権限か、Google側の不具合の可能性があります。");
    rl.close();
    return;
  }

  console.log(`\n🎯 使用モデル: ${selected.name}`);

  // ファイル一覧表示
  const files = fs.readdirSync(CATEGORIES_DIR).filter(f => f.endsWith('.json'));
  files.forEach((f, i) => console.log(`${i + 1}. ${f}`));

  const choice = await ask("\n番号を選択 > ");
  let targetFile = files[parseInt(choice) - 1] || choice;
  if (!targetFile.endsWith('.json')) targetFile += '.json';
  
  const filePath = path.join(CATEGORIES_DIR, targetFile);
  let currentData = { title: targetFile.replace('.json', ''), questions: [] };
  if (fs.existsSync(filePath)) currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const loopCount = parseInt(await ask("何回生成しますか？ (例: 5) > ")) || 1;
  console.log(`\n🚀 生成開始: ${loopCount * 5}問 追加します...`);

  for (let i = 0; i < loopCount; i++) {
    process.stdout.write(`   Set ${i + 1}/${loopCount} ... `);
    try {
      const prompt = createPrompt(currentData.title, currentData.questions.length);
      // ここで待機機能付きの生成を呼び出す
      const result = await generateWithRetry(selected.model, prompt);
      
      let text = result.response.text().replace(/```json|```/g, '').trim();
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        text = text.substring(jsonStart, jsonEnd + 1);
      }

      const newQuestions = JSON.parse(text);
      if (Array.isArray(newQuestions)) {
        currentData.questions.push(...newQuestions);
        console.log(`✅ 完了 (+${newQuestions.length}問)`);
      }
    } catch (e) {
      console.log(`❌ 致命的なエラー: ${e.message}`);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
  console.log(`\n🎉 保存完了！ 合計 ${currentData.questions.length}問 になりました。`);
  rl.close();
};

main();