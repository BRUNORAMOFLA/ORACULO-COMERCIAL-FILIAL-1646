
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Save, ArrowRight, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onSaveAndContinue: () => void;
  onContinueWithoutSaving: () => void;
  onCancel: () => void;
}

export const SwitchPeriodModal: React.FC<Props> = ({ 
  isOpen, 
  onSaveAndContinue, 
  onContinueWithoutSaving, 
  onCancel 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-black/5"
          >
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                  <AlertTriangle size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-zinc-900">Alterações não salvas</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Existem alterações neste período. Deseja salvar os dados atuais antes de mudar para o novo período?
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onSaveAndContinue}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
                >
                  <Save size={18} /> SALVAR E AVANÇAR
                </button>
                <button
                  onClick={onContinueWithoutSaving}
                  className="w-full py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
                >
                  <ArrowRight size={18} /> AVANÇAR SEM SALVAR
                </button>
                <button
                  onClick={onCancel}
                  className="w-full py-4 text-zinc-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:text-zinc-600 transition-all"
                >
                  <X size={18} /> CANCELAR
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
