import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ArrowRight, Timer, Trophy, RefreshCw, Home } from 'lucide-react';
import confetti from 'canvas-confetti';

// ■ 簡易的な効果音再生（ファイルがなくてもビープ音で代用可能）
const playSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'correct') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // A6
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } else {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }
};

const QuizGame = ({ topic, onClose }) => {
  // ゲームの状態管理
  const [quizData, setQuizData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameState, setGameState] = useState('loading'); // loading, playing, result, finished
  const [selectedOption, setSelectedOption] = useState(null);
  
  // タイマー用Ref
  const timerRef = useRef(null);

  // ■ クイズデータの生成（初期化）
  useEffect(() => {
    if (!topic || !topic.questions) return;

    // 全質問から10問をランダムに選出（足りない場合はあるだけ）
    const allQuestions = [...topic.questions];
    const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);

    // 各質問に対して4択を作成
    const preparedQuiz = shuffledQuestions.map(q => {
      const correctAnswer = q.answer1_variations[0].en; // 正解（1つ目の回答バリエーション）
      
      // 他の質問の回答をダミーとして集める
      const otherAnswers = allQuestions
        .filter(item => item.id !== q.id)
        .map(item => item.answer1_variations[0].en)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      // 4択をシャッフル
      const options = [correctAnswer, ...otherAnswers].sort(() => 0.5 - Math.random());

      return {
        questionEn: q.question1.en,
        questionJa: q.question1.ja,
        image: q.image,
        correctAnswer,
        options
      };
    });

    setQuizData(preparedQuiz);
    setGameState('playing');
  }, [topic]);

  // ■ タイマー処理
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      handleTimeUp();
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, gameState]);

  // ■ 時間切れ処理
  const handleTimeUp = () => {
    setGameState('result');
    playSound('wrong');
  };

  // ■ 回答選択処理
  const handleAnswerClick = (option) => {
    if (gameState !== 'playing') return;
    
    clearTimeout(timerRef.current);
    setSelectedOption(option);
    setGameState('result');

    const currentQ = quizData[currentIndex];
    if (option === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
      playSound('correct');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      playSound('wrong');
    }
  };

  // ■ 次の問題へ
  const handleNext = () => {
    if (currentIndex < quizData.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(10);
      setSelectedOption(null);
      setGameState('playing');
    } else {
      setGameState('finished');
      if (score === quizData.length) {
        // 全問正解時の派手な紙吹雪
        const duration = 3000;
        const end = Date.now() + duration;
        (function frame() {
          confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
          confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
          if (Date.now() < end) requestAnimationFrame(frame);
        }());
      }
    }
  };

  if (gameState === 'loading' || quizData.length === 0) {
    return <div className="p-10 text-center font-bold text-gray-500">Loading Quiz...</div>;
  }

  // ■ 結果発表画面
  if (gameState === 'finished') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
        <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl border-4 border-white/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-yellow-300 to-transparent opacity-20"></div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-6 text-yellow-500 shadow-inner">
              <Trophy size={48} />
            </div>
            
            <h2 className="text-3xl font-black text-gray-800 mb-2">Quiz Finished!</h2>
            <p className="text-gray-500 font-bold mb-8">Your Score</p>
            
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-8">
              {score} / {quizData.length}
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={onClose} className="w-full py-4 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <Home size={20}/> Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = quizData[currentIndex];
  const isResult = gameState === 'result';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
      {/* ヘッダー */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center justify-between z-10 shrink-0 safe-area-top">
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-black">
            Q{currentIndex + 1}/{quizData.length}
          </span>
          <span className="font-bold text-gray-700 truncate max-w-[150px]">{topic.title}</span>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      {/* メインエリア */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center justify-center min-h-0">
        <div className="w-full max-w-2xl flex flex-col h-full md:h-auto gap-6">
          
          {/* 画像と質問 */}
          <div className="flex-1 md:flex-none flex flex-col justify-center gap-4">
            {currentQ.image && (
              <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white relative">
                <img src={currentQ.image} alt="Quiz" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
              {/* タイマーバー */}
              <div className="absolute top-0 left-0 h-1.5 bg-gray-100 w-full">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 4 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${(timeLeft / 10) * 100}%` }}
                ></div>
              </div>
              
              <h2 className="text-xl md:text-2xl font-black text-gray-800 mt-2 mb-2 leading-snug">
                {currentQ.questionEn}
              </h2>
              <p className="text-sm text-gray-400 font-bold">{currentQ.questionJa}</p>
            </div>
          </div>

          {/* 選択肢エリア */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full shrink-0">
            {currentQ.options.map((option, idx) => {
              // 結果表示時のスタイル判定
              let btnClass = "bg-white border-2 border-transparent text-gray-600 hover:border-blue-200 hover:bg-blue-50";
              let icon = null;

              if (isResult) {
                if (option === currentQ.correctAnswer) {
                  btnClass = "bg-green-500 border-green-600 text-white shadow-lg scale-[1.02]";
                  icon = <Check size={20} className="shrink-0" />;
                } else if (option === selectedOption) {
                  btnClass = "bg-red-500 border-red-600 text-white opacity-50";
                  icon = <X size={20} className="shrink-0" />;
                } else {
                  btnClass = "bg-gray-100 text-gray-400 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isResult}
                  onClick={() => handleAnswerClick(option)}
                  className={`
                    relative p-4 rounded-xl font-bold text-left text-sm md:text-base transition-all duration-200 
                    flex items-center gap-3 shadow-sm active:scale-95 min-h-[60px]
                    ${btnClass}
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-xs
                    ${isResult && option === currentQ.correctAnswer ? 'bg-white text-green-600' : 'bg-gray-100 text-gray-400'}
                  `}>
                    {['A','B','C','D'][idx]}
                  </div>
                  <span className="flex-1 leading-tight">{option}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Nextボタン（結果表示時のみ出現） */}
          {isResult && (
            <div className="animate-pop-up sticky bottom-4 z-20">
              <button 
                onClick={handleNext}
                className="w-full py-4 bg-gray-800 text-white font-black rounded-xl shadow-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Next Question <ArrowRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizGame;