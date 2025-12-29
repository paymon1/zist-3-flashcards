import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Brain, GraduationCap, CheckCircle2, RotateCcw, Shuffle, XCircle, 
  Info, BookOpen, Settings, Moon, Sun, Play, Pause, Palette, Share2, AlertTriangle 
} from 'lucide-react';
import { FLASHCARD_DATA } from './data';
import { Flashcard, StudyMode } from './types';
import { FlashcardCard } from './components/FlashcardCard';

// Storage Keys
const STORAGE_KEY_MASTERED = 'flashmaster_mastered_ids';
const STORAGE_KEY_THEME = 'flashmaster_theme';

// Pastel Color Themes for "Random Colors" mode
const COLOR_THEMES = [
  { bg: '#FFF1F2', text: '#881337', border: '#FECDD3', badge: '#FFE4E6', subtext: '#9F1239' }, // Rose
  { bg: '#ECFEFF', text: '#164E63', border: '#A5F3FC', badge: '#CFFAFE', subtext: '#155E75' }, // Cyan
  { bg: '#F0FDF4', text: '#14532D', border: '#BBF7D0', badge: '#DCFCE7', subtext: '#166534' }, // Green
  { bg: '#FEFCE8', text: '#713F12', border: '#FEF08A', badge: '#FEF9C3', subtext: '#854D0E' }, // Yellow
  { bg: '#F5F3FF', text: '#4C1D95', border: '#DDD6FE', badge: '#EDE9FE', subtext: '#5B21B6' }, // Violet
  { bg: '#FFF7ED', text: '#7C2D12', border: '#FFEDD5', badge: '#FFEDD5', subtext: '#9A3412' }, // Orange
];

const App: React.FC = () => {
  // State: Data & Navigation
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // State: Filters
  const [mode, setMode] = useState<StudyMode>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [showMastered, setShowMastered] = useState(false);

  // State: Settings / UI Features
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRandomColor, setIsRandomColor] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [autoplayDelay, setAutoplayDelay] = useState(3); // Seconds

  // Initialize Data, Storage & Theme
  useEffect(() => {
    // Load mastered status
    const savedMastered = localStorage.getItem(STORAGE_KEY_MASTERED);
    if (savedMastered) {
      try {
        setMasteredIds(JSON.parse(savedMastered));
      } catch (e) {
        console.error("Failed to parse mastered cards", e);
      }
    }

    // Load Theme
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Initialize deck
    const shuffled = [...FLASHCARD_DATA].sort(() => Math.random() - 0.5);
    setAllCards(shuffled);
  }, []);

  // Filter Deck
  const activeDeck = useMemo(() => {
    let filtered = allCards;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c => c.question.toLowerCase().includes(q) || c.answer.toLowerCase().includes(q)
      );
    }
    if (!showMastered && searchQuery === '') {
      filtered = filtered.filter(c => !masteredIds.includes(c.id));
    }
    return filtered;
  }, [allCards, searchQuery, masteredIds, showMastered, selectedCategory]);

  const currentCard = activeDeck[currentIndex];

  // Handlers
  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % activeDeck.length);
    }, 200);
  }, [activeDeck.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + activeDeck.length) % activeDeck.length);
    }, 200);
  }, [activeDeck.length]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('آدرس برنامه کپی شد! می‌توانید آن را با دوستان خود به اشتراک بگذارید.');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in search
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(p => !p);
      } else if (e.code === 'ArrowLeft') { // In RTL, Left is Next conceptually for timeline, but technically Prev button is on Right. Let's map intuitively.
        handleNext(); 
      } else if (e.code === 'ArrowRight') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Autoplay Logic
  useEffect(() => {
    let timer: number;
    if (isAutoplay && activeDeck.length > 0) {
      timer = window.setTimeout(() => {
        if (isFlipped) {
          handleNext();
        } else {
          setIsFlipped(true);
        }
      }, autoplayDelay * 1000);
    }
    return () => clearTimeout(timer);
  }, [isAutoplay, isFlipped, autoplayDelay, handleNext, activeDeck.length]);

  // Derived Color Theme
  const currentColorTheme = useMemo(() => {
    if (!isRandomColor || !currentCard) return null;
    // Generate a consistent index based on card ID char code sum
    const charCodeSum = currentCard.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLOR_THEMES[charCodeSum % COLOR_THEMES.length];
  }, [isRandomColor, currentCard]);

  // Reset index on filter change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [activeDeck.length, selectedCategory]);

  const toggleMastered = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    const isMastered = masteredIds.includes(currentCard.id);
    let newMastered = isMastered 
      ? masteredIds.filter(id => id !== currentCard.id) 
      : [...masteredIds, currentCard.id];
    
    setMasteredIds(newMastered);
    localStorage.setItem(STORAGE_KEY_MASTERED, JSON.stringify(newMastered));
    
    if (!isMastered && !searchQuery) setTimeout(handleNext, 300);
  };

  const handleShuffle = () => {
    setAllCards([...allCards].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const resetProgress = () => {
    if (confirm("آیا از حذف تمام پیشرفت‌ها اطمینان دارید؟")) {
      setMasteredIds([]);
      localStorage.removeItem(STORAGE_KEY_MASTERED);
    }
  };

  const categories = useMemo(() => Array.from(new Set(allCards.map(c => c.category))).sort(), [allCards]);

  // Guard for empty
  if (FLASHCARD_DATA.length === 0) return <div className="p-10 text-center">داده‌ای یافت نشد.</div>;

  return (
    <div className="flex flex-col h-full max-h-[100dvh] bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between shrink-0 z-20 gap-3 shadow-sm">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-slate-800 dark:text-white text-xl tracking-tight">زیست کنکور</h1>
          </div>
          
          <div className="flex gap-2 md:hidden">
             <button onClick={handleShare} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
               <Share2 className="w-5 h-5" />
             </button>
             <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Toolbar */}
        <div className="flex flex-col-reverse md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0 md:min-w-[200px] w-full">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer appearance-none text-right dir-rtl"
              dir="rtl"
            >
              <option value="all">همه فصل‌ها</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="hidden md:flex items-center gap-2">
             <button onClick={handleShare} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors" title="اشتراک‌گذاری">
               <Share2 className="w-5 h-5" />
             </button>
             <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
              title="تنظیمات"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 animate-fade-in shadow-lg z-10">
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span className="text-sm font-medium dark:text-slate-200">حالت شب</span>
              <button onClick={toggleTheme} className="p-2 rounded-lg bg-white dark:bg-slate-600 shadow-sm border border-slate-200 dark:border-slate-500 text-slate-700 dark:text-slate-200">
                {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>

            {/* Random Color Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span className="text-sm font-medium dark:text-slate-200">رنگ‌های تصادفی</span>
              <button 
                onClick={() => setIsRandomColor(!isRandomColor)} 
                className={`p-2 rounded-lg shadow-sm border transition-colors ${isRandomColor ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-white dark:bg-slate-600 border-slate-200 dark:border-slate-500 text-slate-400'}`}
              >
                <Palette className="w-5 h-5" />
              </button>
            </div>

            {/* Autoplay Controls */}
            <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium dark:text-slate-200">پخش خودکار</span>
                <button 
                  onClick={() => setIsAutoplay(!isAutoplay)} 
                  className={`p-2 rounded-lg shadow-sm border transition-colors ${isAutoplay ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white dark:bg-slate-600 border-slate-200 dark:border-slate-500 text-slate-400'}`}
                >
                  {isAutoplay ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              </div>
              {isAutoplay && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">سرعت: {autoplayDelay} ثانیه</span>
                  <input 
                    type="range" min="1" max="10" step="1" 
                    value={autoplayDelay}
                    onChange={(e) => setAutoplayDelay(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Search & Stats Bar */}
        <div className="px-4 py-4 max-w-3xl mx-auto w-full space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در کارت‌ها..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="w-full pr-10 pl-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400 dark:text-slate-100 text-right dir-rtl"
              dir="rtl"
            />
          </div>

          <div className="flex flex-row-reverse items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span className="font-medium whitespace-nowrap">
                کارت {activeDeck.length > 0 ? currentIndex + 1 : 0} از {activeDeck.length}
              </span>
              {masteredIds.length > 0 && (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1 whitespace-nowrap bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  {masteredIds.length} یاد گرفته شده
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
               <button 
                onClick={() => setShowMastered(!showMastered)}
                className={`px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap ${showMastered ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                {showMastered ? 'مخفی کردن بلدها' : 'نمایش همه'}
              </button>
              <button onClick={handleShuffle} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="بر زدن">
                <Shuffle className="w-4 h-4" />
              </button>
              <button onClick={resetProgress} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-400 hover:text-red-500" title="ریست کردن">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Card Display Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 overflow-hidden">
          {activeDeck.length > 0 ? (
            <div className="w-full flex flex-col items-center animate-fade-in relative z-0">
              <FlashcardCard 
                card={currentCard}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)}
                examMode={mode === 'exam'}
                colorTheme={currentColorTheme}
              />
              
              {/* Navigation Buttons */}
              <div className="mt-6 md:mt-8 flex items-center gap-4 w-full max-w-md justify-between">
                 <button 
                  onClick={handlePrev}
                  className="p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-400 hover:text-blue-600 hover:border-blue-200 active:scale-95 transition-all"
                  aria-label="Previous card"
                >
                  <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>

                <button
                  onClick={toggleMastered}
                  className={`flex-1 mx-2 py-3 px-4 md:px-6 rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 ${
                    masteredIds.includes(currentCard.id)
                      ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {masteredIds.includes(currentCard.id) ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="hidden md:inline">یاد گرفتم</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-current opacity-40" />
                      <span className="hidden md:inline">بلدم</span>
                      <span className="md:hidden">بلدم</span>
                    </>
                  )}
                </button>

                <button 
                  onClick={handleNext}
                  className="p-4 rounded-full bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-none text-white hover:bg-blue-700 active:scale-95 transition-all"
                  aria-label="Next card"
                >
                  <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              
              {/* Keyboard Hints (Desktop only) */}
              <div className="mt-4 hidden md:flex gap-4 text-xs text-slate-400 dark:text-slate-600">
                <span>Space: چرخش</span>
                <span>←: بعدی</span>
                <span>→: قبلی</span>
              </div>

            </div>
          ) : (
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 max-w-sm animate-fade-in">
              <XCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">کارتی یافت نشد</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                با این فیلترها کارتی وجود ندارد.
              </p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setShowMastered(true);
                  setSelectedCategory('all');
                }}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                حذف فیلترها
              </button>
            </div>
          )}
        </div>

        {/* Disclaimer Footer */}
        <div className="p-2 text-center bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-900/30">
          <p className="text-[10px] md:text-xs text-amber-700 dark:text-amber-500 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            توجه: این محتوا ممکن است حاوی خطاهای علمی یا نگارشی باشد. لطفاً با کتاب درسی تطبیق دهید.
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
