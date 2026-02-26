import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, User, ArrowRight, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAIAssistance } from '../services/geminiService';
import { getAllProfessionals } from '../services/userService';
import { Professional, UnlockToken } from '../types';
import ProfessionalCard from './ProfessionalCard';

interface AIMatchingAssistantProps {
  onViewProfile: (pro: Professional) => void;
  isAuth: boolean;
  currentUserId?: string;
  unlockedPros: Record<string, UnlockToken>;
  onUnlock: (id: string, e?: React.MouseEvent) => void;
  userCoords?: { lat: number, lng: number } | null;
}

const AIMatchingAssistant: React.FC<AIMatchingAssistantProps> = ({ 
  onViewProfile,
  isAuth,
  currentUserId,
  unlockedPros,
  onUnlock,
  userCoords
}) => {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    answer: string;
    pros: Professional[];
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    if (results) {
      updateScrollButtons();
      window.addEventListener('resize', updateScrollButtons);
      return () => window.removeEventListener('resize', updateScrollButtons);
    }
  }, [results]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = direction === 'left' ? -cardWidth * 0.8 : cardWidth * 0.8;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const allPros = await getAllProfessionals();
      const response = await getAIAssistance(query, allPros, i18n.language);
      
      const matchedPros = allPros.filter(p => response.recommendedProIds.includes(p.id));
      
      setResults({
        answer: response.answer,
        pros: matchedPros
      });
    } catch (error) {
      console.error("AI Matching Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setQuery('');
    setResults(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-24 px-4">
      <div className="bg-white rounded-[32px] md:rounded-[48px] border border-indigo-100 shadow-2xl shadow-indigo-500/5 overflow-hidden">
        <div className="p-8 md:p-12">
          {!results ? (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                  <Sparkles size={14} /> {t('landing.aiAssistant.tag')}
                </div>
                <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 tracking-tight">
                  {t('landing.aiAssistant.title')}
                </h2>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                  {t('landing.aiAssistant.subtitle')}
                </p>
              </div>

              <form onSubmit={handleMatch} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex flex-col md:flex-row gap-4">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('landing.aiAssistant.placeholder')}
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-3xl px-8 py-6 text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all resize-none h-32 md:h-auto min-h-[120px]"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="bg-indigo-600 text-white px-8 py-6 rounded-3xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <Send size={24} />
                    )}
                    <span className="md:hidden lg:inline">{t('landing.aiAssistant.btn')}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-gray-50">
                <div className="space-y-2 flex-1">
                  <div className="inline-flex items-center gap-2 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                    <Sparkles size={14} /> {t('landing.aiAssistant.resultTitle')}
                  </div>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed font-medium">
                    {results.answer}
                  </p>
                </div>
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest transition-colors group shrink-0"
                >
                  <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                  {t('landing.aiAssistant.back')}
                </button>
              </div>

              {results.pros.length > 0 ? (
                <div className="relative group/carousel">
                  <div 
                    ref={scrollContainerRef}
                    onScroll={updateScrollButtons}
                    className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 md:gap-6 pb-4"
                  >
                    {results.pros.map(pro => (
                      <div key={pro.id} className="snap-center shrink-0 w-[80vw] md:w-[calc(50%-0.75rem)]">
                        <ProfessionalCard 
                          professional={pro} 
                          isUnlocked={!!unlockedPros[pro.id]} 
                          isAuth={isAuth} 
                          currentUserId={currentUserId}
                          onUnlock={(id, e) => onUnlock(id, e)} 
                          onViewProfile={onViewProfile} 
                          userCoords={userCoords}
                        />
                      </div>
                    ))}
                  </div>

                  {canScrollLeft && (
                    <button 
                      onClick={() => scroll('left')}
                      className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-xl p-2 rounded-full shadow-lg border border-gray-100 text-indigo-600 hover:scale-110 active:scale-90 transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}

                  {canScrollRight && (
                    <button 
                      onClick={() => scroll('right')}
                      className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-xl p-2 rounded-full shadow-lg border border-gray-100 text-indigo-600 hover:scale-110 active:scale-90 transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium text-sm">{t('landing.aiAssistant.noPros')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMatchingAssistant;
