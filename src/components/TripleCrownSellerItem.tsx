import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Seller } from '../types/oracle';
import { usePhotoStorage } from '../hooks/usePhotoStorage';

interface Props {
  seller: Seller;
  onSelect: (seller: Seller) => void;
  periodKey: string;
}

export const TripleCrownSellerItem: React.FC<Props> = ({ seller, onSelect, periodKey }) => {
  const { photo, fileInputRef, triggerInput, handleFileChange, removePhoto } = usePhotoStorage(`triplice_photo_${seller.id}_${periodKey}`);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 border rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors text-left relative group">
      <div 
        className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 cursor-pointer relative overflow-hidden flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          if (photo) {
            setShowMenu(!showMenu);
          } else {
            triggerInput();
          }
        }}
      >
        {photo ? (
          <img src={photo} alt={seller.name} className="w-full h-full object-cover" />
        ) : (
          <Star size={16} fill="currentColor" />
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
        />

        <AnimatePresence>
          {showMenu && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-1 z-10"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); triggerInput(); setShowMenu(false); }}
                className="text-[7px] font-bold uppercase text-white hover:text-accent transition-colors"
              >
                Trocar
              </button>
              <div className="w-4 h-[1px] bg-white/20" />
              <button 
                onClick={(e) => { e.stopPropagation(); removePhoto(); setShowMenu(false); }}
                className="text-[7px] font-bold uppercase text-white hover:text-red-400 transition-colors"
              >
                Apagar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <button 
        onClick={() => onSelect(seller)}
        className="flex-1 text-sm font-bold text-zinc-900 underline decoration-zinc-200 underline-offset-4 text-left"
      >
        {seller.name}
      </button>
    </div>
  );
};
