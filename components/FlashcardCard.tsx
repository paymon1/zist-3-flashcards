import React from 'react';
import { Flashcard } from '../types';

interface FlashcardCardProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  examMode: boolean;
  colorTheme?: { bg: string; text: string; border: string; badge: string; subtext: string } | null;
}

export const FlashcardCard: React.FC<FlashcardCardProps> = ({ card, isFlipped, onFlip, examMode, colorTheme }) => {
  
  // Default styles
  const frontStyles = colorTheme 
    ? { backgroundColor: colorTheme.bg, borderColor: colorTheme.border, color: colorTheme.text } 
    : {}; // Handled by Tailwind classes for default
    
  const backStyles = colorTheme
    ? { backgroundColor: colorTheme.text, color: colorTheme.bg }
    : {}; // Handled by Tailwind classes for default

  return (
    <div 
      className="w-full max-w-md aspect-[4/3] relative perspective-1000 cursor-pointer group"
      onClick={onFlip}
    >
      <div 
        className={`w-full h-full relative transition-all duration-500 transform-style-3d shadow-xl rounded-2xl ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front of Card (Question) */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-2xl p-8 flex flex-col justify-between backface-hidden border-2 
            ${colorTheme ? '' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
          style={frontStyles}
        >
          <div className="flex justify-between items-start">
            <span className={`text-xs font-semibold tracking-wider uppercase px-2 py-1 rounded-md
              ${colorTheme ? '' : 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300'}`}
              style={colorTheme ? { backgroundColor: colorTheme.badge, color: colorTheme.text } : {}}
            >
              {card.category.split(':')[0]}
            </span>
            <span className={`text-xs ${colorTheme ? '' : 'text-slate-400 dark:text-slate-500'}`}
               style={colorTheme ? { color: colorTheme.subtext } : {}}
            >
              سوال
            </span>
          </div>
          <div className="flex-grow flex items-center justify-center text-center">
            <h3 className={`text-xl md:text-2xl font-bold leading-relaxed
               ${colorTheme ? '' : 'text-slate-800 dark:text-slate-100'}`}
            >
              {card.question}
            </h3>
          </div>
          <div className={`text-center text-sm font-medium ${colorTheme ? '' : 'text-slate-400 dark:text-slate-500'}`}
             style={colorTheme ? { color: colorTheme.subtext } : {}}
          >
            {examMode ? "برای نمایش پاسخ ضربه بزنید" : "برای چرخش ضربه بزنید"}
          </div>
        </div>

        {/* Back of Card (Answer) */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-2xl p-8 flex flex-col justify-between rotate-y-180 backface-hidden shadow-inner
            ${colorTheme ? '' : 'bg-blue-600 dark:bg-blue-700 text-white'}`}
          style={backStyles}
        >
           <div className="flex justify-between items-start">
            <span className={`text-xs font-semibold tracking-wider uppercase px-2 py-1 rounded-md
               ${colorTheme ? '' : 'text-blue-100 bg-blue-500/30'}`}
               style={colorTheme ? { backgroundColor: 'rgba(255,255,255,0.2)' } : {}}
            >
              پاسخ
            </span>
          </div>
          <div className="flex-grow flex items-center justify-center text-center overflow-y-auto no-scrollbar">
            <p className="text-lg md:text-xl font-medium leading-relaxed">
              {card.answer}
            </p>
          </div>
           <div className={`text-center text-sm font-medium ${colorTheme ? '' : 'text-blue-200'}`}
             style={colorTheme ? { opacity: 0.7 } : {}}
           >
            برای دیدن سوال ضربه بزنید
          </div>
        </div>
      </div>
    </div>
  );
};
