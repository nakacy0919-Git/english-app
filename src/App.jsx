import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, Sparkles, X, ChevronRight, Smile, ChevronDown, 
  Lightbulb, Languages, Volume2, LayoutGrid, Gamepad2,
  School, Coffee, Plane, Rocket, Sun, Smartphone, Heart, Music, Globe,
  Briefcase, Utensils, Home, User, BookOpen, Monitor, Award, Activity, Search
} from 'lucide-react';

import topicsData from './data/index.js';

// ■■■ 言語設定 ■■■
const SUPPORTED_LANGS = [
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh-TW', label: '繁體中文 (台湾)', flag: '🇹🇼' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ne', label: 'नेपाली (Nepal)', flag: '🇳🇵' },
  { code: 'fil', label: 'Filipino', flag: '🇵🇭' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

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

const speak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};

// ■■■ 単語ポップアップコンポーネント ■■■
const WordPopup = ({ word, definition, lang, onClose }) => {
  const googleTranslateUrl = `https://translate.google.com/?sl=en&tl=${lang}&text=${word}&op=translate`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-2 border-indigo-100 transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-3xl font-black text-indigo-600">{word}</h3>
          <button onClick={(e) => { e.stopPropagation(); speak(word); }} className="p-2 bg-indigo-50 text-indigo-500 rounded-full hover:bg-indigo-100">
            <Volume2 size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Meaning ({SUPPORTED_LANGS.find(l => l.code === lang)?.label})</p>
          <p className="text-xl font-bold text-gray-800">
            {definition || "辞書データなし"}
          </p>
        </div>

        <a 
          href={googleTranslateUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors"
        >
          <Search size={18} /> Google翻訳で見る
        </a>
      </div>
    </div>
  );
};

// ■■■ スマートテキスト (単語分解機能) ■■■
const SmartText = ({ text, vocabulary, lang }) => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [definition, setDefinition] = useState(null);
  
  // 単語以外（スペースや記号）で分割して単語リストを作る
  // 例: "I like dogs." -> ["I", " ", "like", " ", "dogs", "."]
  const tokens = text.split(/([a-zA-Z0-9'-]+)/).filter(t => t);

  const handleWordClick = (word) => {
    // 記号やスペースは無視
    if (!word.match(/[a-zA-Z0-9]/)) return;

    // 辞書(vocabulary)から意味を探す
    // 小文字に統一して検索 (Apple -> apple)
    const cleanWord = word.toLowerCase();
    const found = vocabulary && vocabulary[cleanWord];
    
    // 見つかったらその言語の意味を、なければ空にする（Google翻訳ボタン用）
    const def = found ? (found[lang] || found['ja'] || found['en']) : null;
    
    setSelectedWord(word);
    setDefinition(def);
  };

  return (
    <>
      <span className="leading-snug">
        {tokens.map((token, i) => {
          const isWord = /[a-zA-Z0-9]/.test(token);
          // 辞書に登録されている単語なら下線を引く
          const hasDefinition = isWord && vocabulary && vocabulary[token.toLowerCase()];
          
          return isWord ? (
            <span 
              key={i}
              onClick={(e) => { e.stopPropagation(); handleWordClick(token); }}
              className={`inline-block cursor-pointer rounded px-0.5 -mx-0.5 transition-colors active:scale-95 ${hasDefinition ? 'border-b-2 border-indigo-200 text-indigo-700 font-bold' : 'hover:bg-yellow-100 active:bg-yellow-200'}`}
            >
              {token}
            </span>
          ) : (
            <span key={i}>{token}</span>
          );
        })}
      </span>

      {selectedWord && (
        <WordPopup 
          word={selectedWord} 
          definition={definition} 
          lang={lang} 
          onClose={() => setSelectedWord(null)} 
        />
      )}
    </>
  );
};

// --- Components ---

const LanguageSelector = ({ currentLang, setLang }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/90 backdrop-blur border-2 border-slate-200 px-3 py-2 rounded-full shadow-sm hover:bg-slate-50 transition-all font-bold text-slate-600 text-sm"
      >
        <Globe size={18} />
        {SUPPORTED_LANGS.find(l => l.code === currentLang)?.flag}
        <span className="hidden sm:inline">{SUPPORTED_LANGS.find(l => l.code === currentLang)?.label}</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-12 right-0 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden min-w-[160px] max-h-[60vh] overflow-y-auto animate-fade-in">
          {SUPPORTED_LANGS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLang(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors ${currentLang === lang.code ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'}`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Machine3D = ({ id, colorClass, onClick, isSpinning }) => {
  return (
    <div className="relative group perspective-1000 cursor-pointer touch-manipulation" onClick={onClick}>
      <div className={`relative w-24 h-48 md:w-36 md:h-72 transition-transform duration-300 ${isSpinning ? 'scale-95' : 'group-hover:-translate-y-2 group-hover:rotate-1'}`}>
        <div className={`absolute top-0 w-full h-[55%] ${colorClass} rounded-t-2xl border-4 border-white shadow-inner overflow-hidden z-10`}>
          <div className="absolute inset-2 bg-white/30 rounded-lg backdrop-blur-sm border-2 border-white/50 shadow-inner flex items-center justify-center">
            <div className="flex flex-wrap gap-1 justify-center p-2 opacity-80">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-red-400 shadow-sm border border-black/10"></div>
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-blue-400 shadow-sm border border-black/10"></div>
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-yellow-400 shadow-sm border border-black/10"></div>
            </div>
            <div className="absolute top-1 right-2 w-3 h-10 md:w-4 md:h-12 bg-white/40 skew-x-12 rounded-full"></div>
          </div>
        </div>
        <div className="absolute bottom-0 w-full h-[45%] bg-white rounded-b-2xl border-4 border-white shadow-[0_10px_0_rgba(0,0,0,0.1)] flex flex-col items-center justify-start pt-2 z-20">
          <div className="relative w-14 h-14 md:w-20 md:h-20 bg-gray-100 rounded-full border-4 border-gray-200 shadow-inner flex items-center justify-center">
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

const QuestionCard = ({ item, index, topicColor, isExpanded, onToggleExpand, lang }) => {
  const [showTrans, setShowTrans] = useState(false);

  const toggleTranslation = (e) => {
    e.stopPropagation();
    setShowTrans(!showTrans);
  };

  const handleSpeak = (e, text) => {
    e.stopPropagation();
    speak(text);
  };

  const textEn = item.question?.en || item.textEn || "No Text";
  const textTrans = item.question?.[lang] || item.textJa || "No Translation";
  const answerEn = item.answer?.en || item.answerEn || "";
  const answerTrans = item.answer?.[lang] || item.answerJa || "";
  const followUpEn = item.followUp?.en || item.followUpEn || "";
  const followUpTrans = item.followUp?.[lang] || item.followUpJa || "";

  // 辞書データがある場合は取得
  const vocab = item.vocabulary || null;

  return (
    <div 
      onClick={onToggleExpand}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-md active:scale-[0.99] touch-manipulation ${isExpanded ? 'ring-2 ring-blue-300' : ''}`}
    >
      <div className="p-4 flex gap-3 items-start relative">
        <span className={`flex-shrink-0 w-8 h-8 rounded-full ${topicColor} text-white font-bold flex items-center justify-center mt-0.5 text-sm`}>
          Q{index + 1}
        </span>
        <div className="flex-1 pr-2">
          {/* SmartTextを使用 */}
          <div className="text-gray-700 font-bold text-lg leading-snug">
             <SmartText text={textEn} vocabulary={vocab} lang={lang} />
          </div>
          
          {showTrans && (
            <p className="text-gray-500 text-sm mt-2 font-medium border-l-4 border-gray-300 pl-2 animate-fade-in">
              {textTrans}
            </p>
          )}
          {!isExpanded && (
            <p className="text-gray-400 text-xs mt-2 font-medium animate-pulse">Tap for answer idea</p>
          )}
        </div>
        <div className="flex flex-col gap-2 items-center">
          <button onClick={(e) => handleSpeak(e, textEn)} className="p-3 md:p-2 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
            <Volume2 size={20} />
          </button>
          <button onClick={toggleTranslation} className={`p-3 md:p-2 rounded-full transition-colors ${showTrans ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
            <Languages size={20} />
          </button>
          <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 mt-2 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {isExpanded && (
        <div className="bg-blue-50 px-4 py-4 border-t border-blue-100 flex gap-3 animate-fade-in">
          <Lightbulb size={24} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Model Answer</p>
                <button onClick={(e) => handleSpeak(e, answerEn)} className="text-blue-400 hover:text-blue-600 p-1"><Volume2 size={16}/></button>
            </div>
            
            <div className="text-gray-700 text-base leading-relaxed font-medium">
              <SmartText text={answerEn} vocabulary={vocab} lang={lang} />
            </div>

            {showTrans && <p className="text-gray-500 text-sm mt-2 font-medium border-l-4 border-blue-200 pl-2">{answerTrans}</p>}
            
            {followUpEn && (
                <div className="mt-4 pt-3 border-t border-blue-200/50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-purple-500 uppercase tracking-widest">Follow Up</span>
                        <button onClick={(e) => handleSpeak(e, followUpEn)} className="text-purple-400 hover:text-purple-600 p-1"><Volume2 size={16}/></button>
                    </div>
                    <div className="text-gray-700">
                      <SmartText text={followUpEn} vocabulary={vocab} lang={lang} />
                    </div>
                    {showTrans && <p className="text-gray-500 text-sm mt-1 border-l-4 border-purple-200 pl-2">{followUpTrans}</p>}
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const OpenModal = ({ isOpen, onClose, topic, topicIndex, initialStep = 0, lang }) => {
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
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
      <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50">
        <X size={28} className="text-gray-500" />
      </button>
      {step === 0 && (
        <div onClick={() => setStep(1)} className={`cursor-pointer w-64 h-64 rounded-full bg-gradient-to-br ${capsuleColor} shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center justify-center relative animate-bounce-in border-4 border-white ring-4 ring-white/30 touch-manipulation`}>
          <div className="absolute top-8 left-10 w-20 h-12 bg-white opacity-40 rounded-full rotate-[-20deg]"></div>
          <div className="bg-white/20 backdrop-blur-sm px-8 py-3 rounded-full border-2 border-white text-white font-black text-xl tracking-widest shadow-lg animate-pulse">TAP!</div>
        </div>
      )}
      {step === 1 && (
        <div onClick={() => setStep(2)} className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center animate-pop-up relative overflow-hidden cursor-pointer group touch-manipulation">
          <div className={`absolute top-0 left-0 w-full h-32 ${currentColor} opacity-20 rounded-b-[50%]`}></div>
          <div className={`relative w-24 h-24 rounded-full ${currentColor} flex items-center justify-center text-white text-5xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
             {TopicIcon}
          </div>
          <h2 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Today's Topic</h2>
          <h3 className="text-3xl font-black text-gray-800 mb-8 leading-tight">{topic.title}</h3>
          <div className="w-full bg-gray-100 hover:bg-gray-200 transition-colors py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-gray-600">
            See Questions <ChevronRight size={20} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="bg-white w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl animate-slide-up border-4 border-white/50">
          <div className={`${currentColor} p-6 text-white flex items-center gap-4 shrink-0 shadow-md z-10`}>
            <div className="text-white text-4xl bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
               {TopicIcon}
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black line-clamp-1">{topic.title}</h3>
              <p className="text-white/80 font-medium text-sm">Tap any word for meaning!</p>
            </div>
          </div>
          <div className="p-4 space-y-3 bg-amber-50/50 overflow-y-auto flex-1 overscroll-contain">
            {topic.questions.map((item, i) => (
              <QuestionCard 
                key={i}
                index={i}
                item={item}
                topicColor={currentColor}
                isExpanded={expandedQuestion === i}
                onToggleExpand={() => toggleAnswer(i)}
                lang={lang}
              />
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-center shrink-0 safe-area-bottom">
             <button onClick={onClose} className="bg-gray-800 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-900 transition-transform active:scale-95 touch-manipulation">
               Close Topic
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [spinningId, setSpinningId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(null);
  const [modalStep, setModalStep] = useState(0);
  const [viewMode, setViewMode] = useState('gacha'); 
  const [lang, setLang] = useState('ja');

  const handleSpin = (id) => {
    if (spinningId || modalOpen) return;
    setSpinningId(id);
    const randomIndex = Math.floor(Math.random() * topicsData.length);
    setCurrentTopic(topicsData[randomIndex]);
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

  return (
    <div className="w-full h-[100dvh] overflow-hidden relative font-sans select-none bg-white touch-none">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 animate-gradient-flow opacity-60"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute w-full h-full opacity-10" style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="absolute top-4 w-full flex justify-between items-start px-4 z-40 pointer-events-none">
         <div className="hidden md:block pointer-events-auto">
            <div className="bg-white/60 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border-2 border-white/80 transform -rotate-2">
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                CHAT GACHA
              </h1>
            </div>
         </div>
         <div className="flex gap-2 ml-auto pointer-events-auto">
            <LanguageSelector currentLang={lang} setLang={setLang} />
            <button 
              onClick={() => setViewMode(viewMode === 'gacha' ? 'list' : 'gacha')}
              className="flex items-center gap-2 bg-white border-2 border-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-indigo-50 transition-all active:scale-95 text-sm"
            >
              {viewMode === 'gacha' ? <><LayoutGrid size={18} /><span className="hidden sm:inline">List</span></> : <><Gamepad2 size={18} /><span className="hidden sm:inline">Gacha</span></>}
            </button>
         </div>
      </div>

      <div className="absolute top-20 w-full text-center md:hidden pointer-events-none z-0 opacity-80">
          <h1 className="text-4xl font-black text-white drop-shadow-md tracking-wider opacity-50">GACHA</h1>
      </div>

      {viewMode === 'gacha' && (
        <>
          <div className="absolute bottom-0 w-full h-[75vh] flex items-end justify-center pb-8 z-10 animate-slide-up">
            <div className="flex gap-2 md:gap-8 px-4 overflow-x-auto items-end pb-8 snap-x w-full justify-center">
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
        </>
      )}

      {viewMode === 'list' && (
        <div className="absolute inset-0 pt-20 px-4 pb-8 overflow-y-auto z-20 bg-white/30 backdrop-blur-sm animate-fade-in overscroll-contain">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-10">
            {topicsData.map((topic, i) => {
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
                    <p className="text-gray-400 text-xs md:text-sm font-bold">{topic.questions.length} Questions</p>
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
        lang={lang}
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
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
};

export default App;