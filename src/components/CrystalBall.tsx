
import React from 'react';
import { motion } from 'motion/react';

export const CrystalBall: React.FC = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-primary rounded-full blur-md opacity-20"
      />
      <div className="relative w-6 h-6 bg-primary rounded-full border border-white/20 shadow-inner flex items-center justify-center">
        <div className="w-1 h-1 bg-white rounded-full absolute top-1 left-1 opacity-40" />
      </div>
    </div>
  );
};
