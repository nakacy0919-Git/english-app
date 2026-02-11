import React, { useState, useEffect } from 'react';
import { 
  X, ChevronRight, Smile, ChevronDown, 
  Lightbulb, Volume2, LayoutGrid, Gamepad2,
  School, Plane, Rocket, Sun, Heart, Music, Globe,
  Briefcase, Utensils, Home, BookOpen, Activity, 
  ArrowRight, Sparkles, ArrowDown
} from 'lucide-react';

// ■ データ読み込み
import { categories } from './data/index.js';

// ■ 日本語の丸い国旗アイコン
const JapanFlag = ({ className }) => (
  <svg viewBox="0 0 512 512" className={`rounded-full shadow-sm border border-gray-100 ${className}`}>
    <circle cx="256" cy="256" r="256" fill="#fff"/>
    <circle cx="256" cy="256" r="150" fill="#bc002d"/>
  </svg>
);

const CAPSULE_COLORS = [
  "from-pink-300 to-pink-500",
  "from-blue-300 to-blue-500",
  "from-yellow-300 to-yellow-500",
  "from-green-300 to-green-500",
  "from-purple-300 to-purple-500",
];

const THEME_COLORS = [
  "bg-blue-400", "bg-purple-400", "bg-orange-400", 
  "bg-indigo-400", "bg-pink-400", "bg-green-400",
  "bg-teal-400", "bg-rose-400", "bg-cyan-400", "bg-slate-500"
];

const getThemeColor = (index) => THEME_COLORS[index % THEME_COLORS.length];

const getTopicIcon = (title) => {
  if (!title) return <Smile />;
  const t = title.toLowerCase();
  if (t.includes('school')) return <School />;
  if (t.includes('food') || t.includes('cook')) return <Utensils />;
  if (t.includes('travel') || t.includes('trip')) return <Plane />;
  if (t.includes('future') || t.includes('dream')) return <Rocket />;
  if (t.includes('season') || t.includes('weather')) return <Sun />;
  if (t.includes('tech') || t.includes('game')) return <Gamepad2 />;
  if (t.includes('love') || t.includes('family')) return <Heart />;
  if (t.includes('music') || t.includes('art')) return <Music />;
  if (t.includes('work') || t.includes('job')) return <Briefcase />;
  if (t.includes('home') || t.includes('house')) return <Home />;
  if (t.includes('health') || t.includes('body')) return <Activity />;
  if (t.includes('study') || t.includes('learn')) return <BookOpen />;
  if (t.includes('news') || t.includes('world')) return <Globe />;
  return <Smile />;
};

// ■ 音声再生（ゆっくりめ）
const speak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.8; 
  window.speechSynthesis.speak(utterance);
};

// ■ 単語ハイライト機能
const VocabHighlighter = ({ text, vocabList }) => {
  const [popup, setPopup] = useState(null);

  if (!text) return null;

  let parts = [{ text: text, isVocab: false }];

  if (vocabList && vocabList.length > 0) {
    vocabList.forEach(v => {
      const newParts = [];
      parts.forEach(part => {
        if (part.isVocab) {
          newParts.push(part);
        } else {
          const regex = new RegExp(`(${v.word})`, 'gi');
          const split = part.text.split(regex);
          split.forEach(s => {
            if (s.toLowerCase() === v.word.toLowerCase()) {
              newParts.push({ text: s, isVocab: true, meaning: v.meaning });
            } else if (s) {
              newParts.push({ text: s, isVocab: false });
            }
          });
        }
      });
      parts = newParts;
    });
  }

  return (
    <span className="relative inline-block">
      {parts.map((part, i) => (
        part.isVocab ? (
          <span 
            key={i}
            onClick={(e) => { e.stopPropagation(); setPopup(part.meaning); }}
            onMouseLeave={() => setTimeout(() => setPopup(null), 2000)}
            className="text-indigo-600 font-bold border-b-2 border-indigo-300 cursor-pointer hover:bg-indigo-50 transition-colors mx-0.5"
          >
            {part.text}
            {popup === part.meaning && (
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 animate-fade-in">
                {part.meaning}
              </span>
            )}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      ))}
    </span>
  );
};

// ■ 1行ごとの英文コンポーネント（修正版：スピーカー左、日本語下、レイアウト優先）
const SentenceRow = ({ textEn, textJa, vocab, showTrans, className = "" }) => {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* 左側：スピーカーアイコン */}
      <button 
        onClick={(e) => { e.stopPropagation(); speak(textEn); }}
        className="shrink-0 mt-1 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors shadow-sm active:scale-95"
      >
        <Volume2 size={18} />
      </button>

      {/* 右側：テキストエリア */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-lg font-bold text-gray-800 leading-snug break-words">
          <VocabHighlighter text={textEn} vocabList={vocab} />
        </p>
        
        {/* 日本語訳（showTransがtrueの時のみ表示） */}
        {showTrans && (
          <div className="mt-2 text-sm font-bold text-gray-600 bg-white/50 p-2 rounded-lg border-l-4 border-gray-300 animate-fade-in">
            {textJa}
          </div>
        )}
      </div>
    </div>
  );
};

// ■ 翻訳切り替えボタン（各セクションのヘッダー用）
const TransToggleButton = ({ showTrans, onClick, colorClass = "text-gray-500" }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${showTrans ? 'bg-white text-gray-800 ring-2 ring-red-100' : 'bg-white/60 hover:bg-white text-gray-500'}`}
  >
    <JapanFlag className="w-4 h-4" />
    <span>{showTrans ? '日本語を隠す' : '日本語訳を表示'}</span>
  </button>
);

// ■ ガチャマシン
const Machine3D = ({ id, colorClass, onClick, isSpinning }) => {
  return (
    <div className="relative group perspective-1000 cursor-pointer touch-manipulation" onClick={onClick}>
      <div className={`relative w-32 h-64 md:w-36 md:h-72 transition-transform duration-300 ${isSpinning ? 'scale-95' : 'group-hover:-translate-y-2 group-hover:rotate-1'}`}>
        <div className={`absolute top-0 w-full h-[55%] ${colorClass} rounded-t-2xl border-4 border-white shadow-inner overflow-hidden z-10`}>
          <div className="absolute inset-2 bg-white/30 rounded-lg backdrop-blur-sm border-2 border-white/50 shadow-inner flex items-center justify-center">
            <div className="flex flex-wrap gap-1 justify-center p-2 opacity-80">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-red-400 shadow-sm border border-black/10"></div>
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-blue-400 shadow-sm border border-black/10"></div>
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-yellow-400 shadow-sm border border-black/10"></div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 w-full h-[45%] bg-white rounded-b-2xl border-4 border-white shadow-[0_10px_0_rgba(0,0,0,0.1)] flex flex-col items-center justify-start pt-2 z-20">
          <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full border-4 border-gray-200 shadow-inner flex items-center justify-center">
            <div className={`w-full h-full rounded-full flex items-center justify-center transition-transform duration-700 ${isSpinning ? 'rotate-[360deg]' : ''}`}>
               <div className="w-10 h-3 md:w-12 md:h-4 bg-gray-300 rounded-full absolute shadow-md"></div>
               <div className="w-3 h-10 md:w-4 md:h-12 bg-gray-300 rounded-full absolute shadow-md"></div>
               <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-400 rounded-full border-2 border-white z-10"></div>
            </div>
          </div>
          <div className="mt-auto mb-2 md:mb-3 w-12 h-6 md:w-16 md:h-8 bg-gray-800 rounded-t-lg border-2 border-gray-300 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-black/20"></div>
             <div className="w-full h-full flex items-end justify-center">
                <div className="w-6 h-1 bg-gray-600 rounded-full mb-1"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ■ 質問カード (段階的表示機能付き)
const QuestionCard = ({ item, index, isExpanded, onToggleExpand }) => {
  const [step, setStep] = useState(0);
  
  // 各セクションの翻訳表示状態管理
  const [showTransQ1, setShowTransQ1] = useState(false);
  const [showTransA1, setShowTransA1] = useState(false);
  const [showTransGreen, setShowTransGreen] = useState(false);

  useEffect(() => {
    if (!isExpanded) {
      setStep(0);
      setShowTransQ1(false);
      setShowTransA1(false);
      setShowTransGreen(false);
    }
  }, [isExpanded]);

  if (!item) return null;

  const q1 = item.question1 || { en: "No Data", ja: "" };
  const a1List = item.answer1_variations || [];
  const detail = item.answer1_detail;
  const q2 = item.question2;
  const a2List = item.answer2_variations || [];
  const vocab = item.vocab || [];

  // --- セクション間の矢印 (濃く修正) ---
  const SectionArrow = () => (
    <div className="flex justify-center -my-3 relative z-20">
      <div className="bg-white rounded-full p-1.5 shadow-sm border border-gray-200">
        <ArrowDown size={20} strokeWidth={3} className="text-gray-400" />
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 mb-6 ${isExpanded ? 'ring-4 ring-blue-50 shadow-xl' : 'hover:shadow-md'}`}>
      
      {/* --- カードヘッダー --- */}
      <div onClick={onToggleExpand} className="p-5 flex gap-4 items-center cursor-pointer bg-white relative hover:bg-gray-50 transition-colors">
        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md transform transition-transform ${isExpanded ? 'scale-110 rotate-3' : ''}`}>
          Q{index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-800 font-bold text-lg leading-snug line-clamp-2">
            {q1.en}
          </h3>
          {!isExpanded && (
            <p className="text-blue-400 text-xs font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
              Tap to start conversation <ArrowRight size={12}/>
            </p>
          )}
        </div>
        <ChevronDown size={24} className={`text-gray-300 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} />
      </div>

      {/* --- コンテンツエリア (展開時) --- */}
      {isExpanded && (
        <div className="px-4 pb-6 space-y-5 animate-fade-in bg-white">
          
          {/* ■■■ STEP 0: Question 1 (Blue) ■■■ */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-l-8 border-blue-400 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 relative z-10">
              <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm tracking-wider uppercase">Q1. Question</span>
              <TransToggleButton showTrans={showTransQ1} onClick={() => setShowTransQ1(!showTransQ1)} />
            </div>
            
            <SentenceRow 
              textEn={q1.en} 
              textJa={q1.ja} 
              vocab={vocab} 
              showTrans={showTransQ1}
            />
          </div>

          {/* 矢印 */}
          <SectionArrow />

          {/* ■■■ STEP 1: Answer Ideas (Orange) ■■■ */}
          {step === 0 ? (
            <button 
              onClick={() => setStep(1)}
              className="w-full py-4 rounded-2xl bg-orange-50 border-2 border-orange-200 border-dashed text-orange-500 font-bold flex items-center justify-center gap-2 hover:bg-orange-100 transition-all animate-heartbeat shadow-sm"
            >
              <Lightbulb size={20} className="fill-orange-500" />
              Tap to see Answer Ideas
            </button>
          ) : (
            <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-50 to-orange-100 border-l-8 border-orange-400 shadow-sm animate-pop-up">
              <div className="flex justify-between items-center mb-4">
                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm tracking-wider uppercase">A1. Answer Ideas</span>
                <TransToggleButton showTrans={showTransA1} onClick={() => setShowTransA1(!showTransA1)} />
              </div>
              
              <div className="space-y-4">
                {a1List.map((ans, idx) => (
                  <div key={idx} className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-orange-200 shadow-sm">
                    <SentenceRow 
                      textEn={ans.en} 
                      textJa={ans.ja} 
                      vocab={vocab} 
                      showTrans={showTransA1}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ■■■ STEP 2: More Detail (Green) ■■■ */}
          {step >= 1 && (
            <>
              <SectionArrow />
              
              {step === 1 ? (
                 <button 
                  onClick={() => setStep(2)}
                  className="w-full py-3 rounded-2xl bg-green-50 border-2 border-green-200 border-dashed text-green-600 font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition-all"
                >
                  <Sparkles size={18} />
                  さらに詳しく説明、回答してみよう
                </button>
              ) : (
                <div className="rounded-2xl p-5 bg-gradient-to-b from-green-50 to-green-100 border-l-8 border-green-400 shadow-sm animate-pop-up">
                  
                  {/* ヘッダー: 一括翻訳ボタン */}
                  <div className="flex justify-end mb-2">
                    <TransToggleButton showTrans={showTransGreen} onClick={() => setShowTransGreen(!showTransGreen)} />
                  </div>

                  {/* Detail */}
                  {detail && (
                    <div className="mb-6">
                      <span className="text-green-600 font-black text-xs uppercase tracking-widest flex items-center gap-1 mb-2"><Sparkles size={12}/> More Detail</span>
                      <div className="bg-white/60 rounded-xl p-4 border border-green-100 shadow-sm">
                         <SentenceRow 
                           textEn={detail.en} 
                           textJa={detail.ja} 
                           vocab={vocab} 
                           showTrans={showTransGreen}
                         />
                      </div>
                    </div>
                  )}

                   {/* ■■■ STEP 3: Follow-Up (Green Dark) ■■■ */}
                   {step >= 2 && q2 && (
                     <>
                        <div className="relative py-4">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-green-300 border-dashed"></div></div>
                          <div className="relative flex justify-center"><ArrowDown size={14} className="text-green-400 bg-green-50 rounded-full p-0.5" /></div>
                        </div>

                        {step === 2 ? (
                           <button 
                             onClick={() => setStep(3)}
                             className="w-full py-3 rounded-xl bg-white/50 border border-green-200 text-green-700 font-bold hover:bg-white transition-all text-sm animate-heartbeat"
                           >
                             Next Question... ?
                           </button>
                        ) : (
                          <div className="animate-fade-in">
                            <span className="bg-green-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm tracking-wider uppercase mb-3 inline-block">Q2. Follow-up</span>
                            
                            {/* Q2 */}
                            <div className="mb-4">
                              <SentenceRow 
                                textEn={q2.en} 
                                textJa={q2.ja} 
                                vocab={vocab} 
                                showTrans={showTransGreen}
                                className="mb-2" 
                              />
                            </div>

                            {/* A2 */}
                            {a2List.length > 0 && (
                              <div className="pl-3 border-l-4 border-green-300 space-y-3">
                                {a2List.map((ans, idx) => (
                                  <div key={idx} className="bg-white/80 p-3 rounded-lg text-sm shadow-sm">
                                    <SentenceRow 
                                      textEn={ans.en} 
                                      textJa={ans.ja} 
                                      vocab={vocab} 
                                      showTrans={showTransGreen}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                     </>
                   )}
                </div>
              )}
            </>
          )}

        </div>
      )}
    </div>
  );
};

// ■ モーダル画面
const OpenModal = ({ isOpen, onClose, topic, topicIndex, initialStep = 0 }) => {
  const [step, setStep] = useState(initialStep); 
  const [capsuleColor, setCapsuleColor] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const currentColor = topicIndex !== null ? getThemeColor(topicIndex) : "bg-blue-400";
  const TopicIcon = topic ? getTopicIcon(topic.title) : Smile;

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setCapsuleColor(CAPSULE_COLORS[Math.floor(Math.random() * CAPSULE_COLORS.length)]);
      setExpandedQuestion(null);
    }
  }, [isOpen, initialStep]);

  const toggleAnswer = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  if (!isOpen || !topic) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
      <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50">
        <X size={28} className="text-gray-500" />
      </button>

      {/* STEP 0: カプセル */}
      {step === 0 && (
        <div onClick={() => setStep(1)} className={`cursor-pointer w-64 h-64 rounded-full bg-gradient-to-br ${capsuleColor} shadow-[0_0_50px_rgba(255,255,255,0.5)] flex items-center justify-center relative animate-bounce-in border-4 border-white ring-4 ring-white/30 touch-manipulation`}>
          <div className="absolute top-8 left-10 w-20 h-12 bg-white opacity-40 rounded-full rotate-[-20deg]"></div>
          <div className="bg-white/20 backdrop-blur-sm px-8 py-3 rounded-full border-2 border-white text-white font-black text-xl tracking-widest shadow-lg animate-pulse">TAP!</div>
        </div>
      )}

      {/* STEP 1: トピック発表 */}
      {step === 1 && (
        <div onClick={() => setStep(2)} className="bg-white w-full max-w-sm rounded-3xl p-10 shadow-2xl flex flex-col items-center text-center animate-pop-up relative overflow-hidden cursor-pointer group touch-manipulation">
          <div className={`absolute top-0 left-0 w-full h-32 ${currentColor} opacity-20 rounded-b-[50%]`}></div>
          <div className={`relative w-28 h-28 rounded-full ${currentColor} flex items-center justify-center text-white text-6xl shadow-xl mb-6 group-hover:scale-110 transition-transform duration-300 ring-4 ring-white`}>
             {TopicIcon}
          </div>
          <h2 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Today's Topic</h2>
          <h3 className="text-3xl font-black text-gray-800 mb-8 leading-tight">{topic.title}</h3>
          <div className="w-full bg-gray-50 hover:bg-indigo-50 transition-colors py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-gray-600 group-hover:text-indigo-600 border-2 border-dashed border-gray-200">
            Start Learning <ChevronRight size={20} />
          </div>
        </div>
      )}

      {/* STEP 2: 学習リスト */}
      {step === 2 && (
        <div className="bg-gray-50 w-full max-w-xl max-h-[90vh] flex flex-col rounded-[2rem] overflow-hidden shadow-2xl animate-slide-up border-4 border-white/50">
          <div className={`${currentColor} p-6 text-white flex items-center gap-4 shrink-0 shadow-md z-10 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
            <div className="text-white text-4xl bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner relative z-10">
               {TopicIcon}
            </div>
            <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-black line-clamp-1">{topic.title}</h3>
              <p className="text-white/80 font-bold text-xs bg-white/20 inline-block px-2 py-1 rounded mt-1">
                {topic.questions.length} Lessons
              </p>
            </div>
          </div>
          
          <div className="p-4 md:p-6 overflow-y-auto flex-1 overscroll-contain bg-slate-50">
            {topic.questions.map((item, i) => (
              <QuestionCard 
                key={i}
                index={i}
                item={item}
                isExpanded={expandedQuestion === i}
                onToggleExpand={() => toggleAnswer(i)}
              />
            ))}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 text-center shrink-0 safe-area-bottom">
             <button onClick={onClose} className="bg-gray-800 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:bg-gray-900 transition-transform active:scale-95 touch-manipulation w-full md:w-auto">
               Close
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ■ メインアプリ
const App = () => {
  const [spinningId, setSpinningId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(null);
  const [modalStep, setModalStep] = useState(0);
  const [viewMode, setViewMode] = useState('gacha'); 

  const handleSpin = (id) => {
    if (spinningId || modalOpen) return;
    setSpinningId(id);
    const categoryList = categories || [];
    if (categoryList.length === 0) return;

    const randomIndex = Math.floor(Math.random() * categoryList.length);
    setCurrentTopic(categoryList[randomIndex]);
    setCurrentTopicIndex(randomIndex);
    setModalStep(0);
    setTimeout(() => {
      setSpinningId(null);
      setModalOpen(true);
    }, 1500);
  };

  const handleListSelect = (topic, index) => {
    setCurrentTopic(topic);
    setCurrentTopicIndex(index);
    setModalStep(2);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setCurrentTopic(null);
    setCurrentTopicIndex(null);
  };

  const categoryList = categories || [];

  return (
    <div className="w-full h-[100dvh] overflow-hidden relative font-sans select-none bg-white touch-none">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 animate-gradient-flow opacity-80"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Header */}
      <div className="absolute top-4 w-full flex justify-between items-start px-4 z-40 pointer-events-none">
         <div className="hidden md:block pointer-events-auto">
            <div className="bg-white/60 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border-2 border-white/80 transform -rotate-2">
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                CHAT GACHA
              </h1>
            </div>
         </div>
         <div className="flex gap-2 ml-auto pointer-events-auto">
            <button 
              onClick={() => setViewMode(viewMode === 'gacha' ? 'list' : 'gacha')}
              className="flex items-center gap-2 bg-white border-2 border-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-indigo-50 transition-all active:scale-95 text-sm"
            >
              {viewMode === 'gacha' ? <><LayoutGrid size={18} /><span className="hidden sm:inline">List</span></> : <><Gamepad2 size={18} /><span className="hidden sm:inline">Gacha</span></>}
            </button>
         </div>
      </div>

      <div className="absolute top-24 w-full text-center md:hidden pointer-events-none z-0 opacity-80">
          <h1 className="text-5xl font-black text-white drop-shadow-md tracking-wider opacity-60">GACHA</h1>
      </div>

      {/* Gacha View (2x2 on Mobile) */}
      {viewMode === 'gacha' && (
        <div className="absolute bottom-0 w-full h-[70vh] flex items-center md:items-end justify-center pb-8 z-10 animate-slide-up">
          <div className="grid grid-cols-2 md:flex gap-x-6 gap-y-2 md:gap-8 px-6 items-end justify-items-center w-full max-w-4xl mx-auto">
            {[1, 2, 3, 4].map(id => (
              <Machine3D 
                key={id}
                id={id} 
                colorClass={id === 1 ? "bg-red-400" : id === 2 ? "bg-blue-400" : id === 3 ? "bg-yellow-400" : "bg-green-400"} 
                onClick={() => handleSpin(id)} 
                isSpinning={spinningId === id} 
              />
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="absolute inset-0 pt-20 px-4 pb-8 overflow-y-auto z-20 bg-white/30 backdrop-blur-sm animate-fade-in overscroll-contain">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-10">
            {categoryList.map((topic, i) => {
              const color = getThemeColor(i);
              return (
                <button 
                  key={topic.id} 
                  onClick={() => handleListSelect(topic, i)}
                  className="bg-white/90 hover:bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl border-2 border-transparent hover:border-indigo-300 transition-all text-left group flex items-center gap-4 active:scale-[0.98]"
                >
                  <div className={`${color} w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    {getTopicIcon(topic.title)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-700 text-lg group-hover:text-indigo-600 transition-colors truncate">{topic.title}</h3>
                    <p className="text-gray-400 text-xs md:text-sm font-bold">{topic.questions.length} Lessons</p>
                  </div>
                  <ChevronRight className="ml-auto text-gray-300 group-hover:text-indigo-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <OpenModal 
        isOpen={modalOpen} 
        onClose={handleClose} 
        topic={currentTopic} 
        topicIndex={currentTopicIndex} 
        initialStep={modalStep}
      />

      <style>{`
        @keyframes bounce-in { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
        .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes pop-up { 0% { transform: scale(0.8) translateY(20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        .animate-pop-up { animation: pop-up 0.4s ease-out; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        @keyframes gradient-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-gradient-flow { background-size: 300% 300%; animation: gradient-flow 20s ease infinite; }
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 10s infinite; }
        @keyframes heartbeat { 0% { transform: scale(1); } 15% { transform: scale(1.05); } 30% { transform: scale(1); } 45% { transform: scale(1.05); } 60% { transform: scale(1); } }
        .animate-heartbeat { animation: heartbeat 2s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
};

export default App;