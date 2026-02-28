
import React from 'react';
import { EvolutionAlert } from '../../types/intelligence';
import { AlertTriangle, ShieldAlert, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  alerts: EvolutionAlert[];
}

export const AlertsPanel: React.FC<Props> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldAlert size={20} className="text-red-500" />
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Alertas e Ações Recomendadas</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-3xl border ${
              alert.type === 'C' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
            } space-y-4`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  alert.type === 'C' ? 'text-amber-600' : 'text-red-600'
                }`}>
                  Alerta Tipo {alert.type}
                </span>
                <h4 className={`text-sm font-black ${
                  alert.type === 'C' ? 'text-amber-900' : 'text-red-900'
                }`}>
                  {alert.title}
                </h4>
              </div>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                alert.type === 'C' ? 'bg-amber-200 text-amber-700' : 'bg-red-200 text-red-700'
              }`}>
                {alert.type === 'C' ? <AlertTriangle size={16} /> : <Zap size={16} />}
              </div>
            </div>

            <p className={`text-xs font-medium leading-relaxed ${
              alert.type === 'C' ? 'text-amber-700' : 'text-red-700'
            }`}>
              {alert.reason}
            </p>

            <div className={`p-4 rounded-2xl ${
              alert.type === 'C' ? 'bg-white/50 border border-amber-200' : 'bg-white/50 border border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                <ArrowRight size={14} className={alert.type === 'C' ? 'text-amber-600 mt-0.5' : 'text-red-600 mt-0.5'} />
                <p className={`text-xs font-bold ${
                  alert.type === 'C' ? 'text-amber-900' : 'text-red-900'
                }`}>
                  {alert.action}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
