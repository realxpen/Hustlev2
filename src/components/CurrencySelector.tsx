
import React from 'react';
import { useAuth } from '../features/auth';
import { EXCHANGE_RATES, Currency } from '../lib/currency';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CurrencySelector: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentCurrency = (profile?.display_currency || 'USD') as Currency;

  const handleSelect = async (currency: Currency) => {
    await updateProfile({ display_currency: currency });
    setIsOpen(false);
  };

  const currencies: Currency[] = ['USD', 'NGN', 'EUR', 'GBP', 'BTC', 'ETH'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        <Globe size={14} className="text-emerald-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
          {currentCurrency}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 z-50 w-48 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl p-2 overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">Display Currency</p>
              </div>
              <div className="space-y-1">
                {currencies.map((curr) => (
                  <button
                    key={curr}
                    onClick={() => handleSelect(curr)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      currentCurrency === curr 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center font-mono opacity-50">{EXCHANGE_RATES[curr].symbol}</span>
                      <span>{curr}</span>
                    </div>
                    {currentCurrency === curr && <Check size={12} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CurrencySelector;
