import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATEGORIES_DIR = path.join(__dirname, '../src/data/categories');
const INDEX_FILE = path.join(__dirname, '../src/data/index.js');

// ■ 作成したい20カテゴリのリスト
const CATEGORIES = [
  { id: 'school', title: 'School Life', ja: '学校生活' },
  { id: 'food', title: 'Food', ja: '食べ物' },
  { id: 'travel', title: 'Travel', ja: '旅行' },
  { id: 'future', title: 'Future', ja: '将来' },
  { id: 'seasons', title: 'Seasons', ja: '季節' },
  { id: 'tech', title: 'Technology', ja: 'テクノロジー' },
  { id: 'hobbies', title: 'Hobbies', ja: '趣味' },
  { id: 'friends', title: 'Friends', ja: '友達' },
  { id: 'family', title: 'Family', ja: '家族' },
  { id: 'health', title: 'Health', ja: '健康' },
  { id: 'sports', title: 'Sports', ja: 'スポーツ' },
  { id: 'music', title: 'Music', ja: '音楽' },
  { id: 'movies', title: 'Movies', ja: '映画' },
  { id: 'shopping', title: 'Shopping', ja: '買い物' },
  { id: 'animals', title: 'Animals', ja: '動物' },
  { id: 'daily', title: 'Daily Life', ja: '日常生活' },
  { id: 'work', title: 'Work', ja: '仕事' },
  { id: 'emotions', title: 'Emotions', ja: '感情' },
  { id: 'culture', title: 'Culture', ja: '文化' },
  { id: 'environment', title: 'Environment', ja: '環境' },
];

// フォルダ作成
if (!fs.existsSync(CATEGORIES_DIR)) {
  fs.mkdirSync(CATEGORIES_DIR, { recursive: true });
}

console.log("■ ファイル作成を開始します...");

// 1. 各JSONファイルを作成（すでに存在する場合はスキップ）
CATEGORIES.forEach(cat => {
  const filePath = path.join(CATEGORIES_DIR, `${cat.id}.json`);
  if (!fs.existsSync(filePath)) {
    const initialData = {
      id: `topic_${cat.id}`,
      title: `${cat.title} (${cat.ja})`,
      questions: []
    };
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    console.log(`✅ 作成: ${cat.id}.json`);
  } else {
    console.log(`⏩ スキップ (既存): ${cat.id}.json`);
  }
});

// 2. index.js を自動生成
console.log("\n■ index.js を更新しています...");
let importLines = "";
let exportLines = "const allTopics = [\n";

CATEGORIES.forEach(cat => {
  importLines += `import ${cat.id} from './categories/${cat.id}.json';\n`;
  exportLines += `  ${cat.id},\n`;
});
exportLines += "];\n\nexport default allTopics;";

fs.writeFileSync(INDEX_FILE, importLines + "\n" + exportLines);
console.log("✅ index.js の更新完了！");

console.log("\nすべての準備が整いました！");
console.log("次は AI にデータを作らせて、各ファイルにコピペしてください。");