import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// ESM環境で__dirnameを使うための設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// データフォルダのパス
const CATEGORIES_DIR = path.join(__dirname, '../src/data/categories');
const INDEX_FILE = path.join(__dirname, '../src/data/index.js');

// ディレクトリがなければ作成
if (!fs.existsSync(CATEGORIES_DIR)) {
  fs.mkdirSync(CATEGORIES_DIR, { recursive: true });
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

// 既存のファイル一覧を取得
const getCategoryFiles = () => {
  return fs.readdirSync(CATEGORIES_DIR).filter(file => file.endsWith('.json'));
};

const main = async () => {
  console.log("\n■■■ 英会話トピック追加ツール (多言語対応版) ■■■");
  console.log(`保存先: ${CATEGORIES_DIR}\n`);

  const files = getCategoryFiles();
  
  if (files.length > 0) {
    console.log("--- 既存のカテゴリ ---");
    files.forEach((f, i) => {
      const content = JSON.parse(fs.readFileSync(path.join(CATEGORIES_DIR, f), 'utf-8'));
      console.log(`${i + 1}. ${content.title} (${f})`);
    });
  } else {
    console.log("(既存のカテゴリファイルはありません)");
  }
  console.log("0. 【新規作成】 新しいカテゴリファイルを作る");

  const choice = await ask("\n番号を選択 > ");
  let filePath;
  let data = {};

  if (choice === '0') {
    // 新規作成
    const filenameInput = await ask("ファイル名を入力してください (例: travel) > ");
    const filename = filenameInput.endsWith('.json') ? filenameInput : `${filenameInput}.json`;
    filePath = path.join(CATEGORIES_DIR, filename);

    if (fs.existsSync(filePath)) {
      console.log("⚠️ そのファイルは既に存在します。既存のデータを読み込みます。");
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } else {
      const titleEn = await ask("カテゴリのタイトル (英語) > ");
      const titleJa = await ask("カテゴリのタイトル (日本語) > ");
      data = {
        id: `topic_${path.basename(filename, '.json')}`,
        title: `${titleEn} (${titleJa})`,
        questions: []
      };
      console.log(`\n📝 新しいファイルを作成します: ${filename}`);
      console.log(`⚠️ 注意: 作成後、src/data/index.js に import 文を追加してください！`);
    }
  } else {
    // 既存選択
    const index = parseInt(choice) - 1;
    if (index >= 0 && index < files.length) {
      filePath = path.join(CATEGORIES_DIR, files[index]);
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log(`\n📂 読み込み中: ${data.title}`);
    } else {
      console.log("❌ 無効な選択です");
      rl.close();
      return;
    }
  }

  // 質問追加ループ
  while (true) {
    console.log(`\n--- 新規質問の追加 (現在 ${data.questions.length}問) ---`);
    console.log("※ 入力を中断するには、質問(英語)で何も入力せずにEnterを押してください");

    const qEn = await ask("Q. 質問 (英語) > ");
    if (!qEn) break;

    const qJa = await ask("   質問 (日本語) > ");
    const qPt = await ask("   質問 (ポルトガル語) [Enterでスキップ] > ");
    const qZh = await ask("   質問 (中国語) [Enterでスキップ] > ");

    const aEn = await ask("A. 回答 (英語) > ");
    const aJa = await ask("   回答 (日本語) > ");
    
    const fEn = await ask("F. 追加質問 (英語) [Enterでスキップ] > ");
    const fJa = await ask("   追加質問 (日本語) [Enterでスキップ] > ");

    const newQuestion = {
      id: `${data.id}_${Date.now()}`, // ユニークID
      question: {
        en: qEn,
        ja: qJa,
        ...(qPt && { pt: qPt }), // 入力がある場合のみ追加
        ...(qZh && { zh: qZh })
      },
      answer: {
        en: aEn,
        ja: aJa
      },
      ...(fEn && {
        followUp: {
          en: fEn,
          ja: fJa
        }
      })
    };

    data.questions.push(newQuestion);
    
    // 保存
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("✅ 保存しました！続けて追加できます。");
  }

  console.log("\n終了します。お疲れ様でした！");
  
  if (choice === '0') {
    console.log("\n【重要】 新しいカテゴリを作ったので、アプリに表示させるために");
    console.log(`src/data/index.js を開いて、作成したファイルを import してください。`);
  }

  rl.close();
};

main();