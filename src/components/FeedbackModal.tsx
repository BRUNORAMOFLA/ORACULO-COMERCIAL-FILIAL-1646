
import React, { useState, useEffect } from 'react';
import { Seller, Period } from '../types/oracle';
import { X, Check, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type FeedbackType = 'Automatico' | 'Reconhecimento' | 'Corretivo' | 'Ajuste de Rota' | 'Desenvolvimento';

interface Props {
  seller: Seller | null;
  period: Period;
  onClose: () => void;
}

export const FeedbackModal: React.FC<Props> = ({ seller, period, onClose }) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType | ''>('');
  const [feedbackText, setFeedbackText] = useState('');
  const [showToast, setShowToast] = useState(false);

  if (!seller) return null;

  const gerarFeedback = (s: Seller, p: Period, type: FeedbackType) => {
    const mercantil = s.pillars.mercantil.icm;
    const cdc = s.pillars.cdc.icm;
    const services = s.pillars.services.icm;

    const titulo = `${s.name.toUpperCase()} – Feedback ${p.label}`;
    
    let b1 = ''; // Leitura Técnica
    let b2 = ''; // Diagnóstico Operacional
    let b3 = ''; // Impacto
    let b4 = ''; // Direcionamento
    let b5 = ''; // Encerramento Estratégico

    if (type === 'Automatico') {
      if (mercantil >= 100 && cdc >= 100 && services >= 100) {
        b1 = "Entrega de alta performance com equilíbrio total entre volume e rentabilidade financeira.";
        b2 = "Execução impecável da proposta completa em todos os atendimentos realizados.";
        b3 = "Sua operação sustenta o crescimento da unidade com margem saudável e segura.";
        b4 = "Mantenha o rigor na execução para consolidar esse patamar de entrega estratégica.";
        b5 = "Equilíbrio entre pilares é o que sustenta performance.";
      } else if (mercantil >= 100 && (cdc < 90 || services < 90)) {
        b1 = "O volume de Mercantil está batendo a meta, mas a ativação de CDC e Serviços está descolada. Isso indica venda focada em produto sem ativação financeira completa.";
        b2 = "Existe abordagem de produto, mas falta estrutura na proposta de valor agregado e financiamento.";
        b3 = "Sem ativar CDC e Serviços, o ticket médio e a margem da sua operação ficam comprometidos.";
        b4 = "Inicie a oferta pelo financiamento e inclua serviços como parte natural da proposta de fechamento.";
        b5 = "Volume sem margem não sustenta o negócio.";
      } else if (cdc >= 100 && services < 90) {
        b1 = "A performance em CDC é positiva, porém a conversão de Serviços não acompanha o ritmo da operação.";
        b2 = "Foco excessivo no fechamento financeiro, esquecendo de agregar proteção e valor através dos serviços.";
        b3 = "A eficiência da venda fica incompleta e a rentabilidade individual abaixo do potencial real.";
        b4 = "Trabalhe o serviço como um benefício de segurança atrelado diretamente à parcela do financiamento.";
        b5 = "A venda completa é o único caminho para a excelência.";
      } else if (services >= 100 && mercantil < 90) {
        b1 = "A rentabilidade de Serviços está alta, mas o volume de Mercantil está abaixo do esperado para o período.";
        b2 = "Foco em valor agregado, mas com baixa conversão de fluxo ou falta de agressividade no produto principal.";
        b3 = "A margem é positiva, mas o faturamento total da unidade fica prejudicado pela falta de volume.";
        b4 = "Aumente a agressividade no fechamento do produto principal para ganhar escala e aproveitar a boa margem.";
        b5 = "Volume e margem precisam caminhar juntos.";
      } else if (mercantil < 80 && cdc < 80 && services < 80) {
        b1 = "Desbalanceamento crítico com todos os pilares operando abaixo do mínimo aceitável para a operação.";
        b2 = "Falha grave na execução básica e falta de atitude comercial ativa no salão de vendas.";
        b3 = "A operação perde competitividade e o resultado global da unidade é severamente comprometido.";
        b4 = "Reação imediata com foco em abordagem ativa e oferta obrigatória de 100% do mix de produtos.";
        b5 = "Execução é o que separa o plano do resultado.";
      } else {
        b1 = "Performance oscilante com falta de equilíbrio técnico entre os indicadores de volume e rentabilidade.";
        b2 = "Abordagem inconsistente que gera resultados irregulares e dependência de um único pilar.";
        b3 = "A instabilidade dificulta a previsibilidade de entrega e a saúde financeira da sua carteira.";
        b4 = "Padronize seu atendimento e garanta a oferta estruturada em cada oportunidade de venda.";
        b5 = "Consistência gera resultados sustentáveis.";
      }
    } else {
      switch (type) {
        case 'Reconhecimento':
          b1 = "Entrega equilibrada e acima da média em todos os pilares estratégicos da unidade.";
          b2 = "Execução de proposta completa em cada atendimento, garantindo volume e rentabilidade.";
          b3 = "Isso garante a saúde financeira da operação e eleva o nível técnico de toda a equipe.";
          b4 = "Mantenha o rigor na oferta e lidere pelo exemplo de consistência no time.";
          b5 = "Consistência gera liderança.";
          break;
        case 'Corretivo':
          b1 = "Os pilares de volume e rentabilidade estão operando abaixo do mínimo aceitável.";
          b2 = "Falta de atitude comercial e falha na estrutura básica de abordagem ao cliente.";
          b3 = "O resultado da unidade fica comprometido e a operação perde tração no mercado.";
          b4 = "Retome o básico: abordagem ativa e oferta obrigatória de todos os itens do mix.";
          b5 = "Execução não é opcional.";
          break;
        case 'Ajuste de Rota':
          const lowest = Math.min(mercantil, cdc, services);
          const pillarName = lowest === mercantil ? 'Mercantil' : lowest === cdc ? 'CDC' : 'Serviços';
          b1 = `Seu resultado em ${pillarName} está travando sua evolução e desequilibrando os demais pilares.`;
          b2 = "A venda está sendo concluída, mas sem a ativação correta deste indicador específico.";
          b3 = "Isso derruba sua eficiência individual e a rentabilidade média da unidade.";
          b4 = `Foque especificamente na conversão de ${pillarName} para equilibrar sua entrega técnica.`;
          b5 = "O detalhe define o resultado.";
          break;
        case 'Desenvolvimento':
          b1 = "Existe volume de atendimento, mas a conversão em rentabilidade financeira é insuficiente.";
          b2 = "Falta técnica de contorno de objeções e estruturação de fechamento de venda.";
          b3 = "Muito esforço operacional para pouco resultado financeiro real no final do período.";
          b4 = "Trabalhe a estrutura da sua venda para ganhar escala e consistência diária.";
          b5 = "Conhecimento técnico vira venda.";
          break;
      }
    }

    return `${titulo}\n\n${b1}\n\n${b2}\n\n${b3}\n\n${b4}\n\n${b5}`;
  };

  useEffect(() => {
    if (feedbackType) {
      const text = gerarFeedback(seller, period, feedbackType as FeedbackType);
      setFeedbackText(text);
    }
  }, [feedbackType, seller, period]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(feedbackText);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative"
      >
        <div className="p-6 border-b flex justify-between items-center bg-zinc-50">
          <div>
            <h3 className="text-lg font-black text-zinc-900">{seller.name}</h3>
            <span className="text-[10px] font-bold uppercase text-zinc-400">{period.label}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Mercantil', val: seller.pillars.mercantil.icm },
              { label: 'CDC', val: seller.pillars.cdc.icm },
              { label: 'Serviços', val: seller.pillars.services.icm },
            ].map(p => (
              <div key={p.label} className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-center">
                <span className="text-[8px] font-black uppercase text-zinc-400 block">{p.label}</span>
                <span className="text-sm font-black text-zinc-900">{p.val.toFixed(1)}%</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400">Tipo de Feedback</label>
            <select 
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-xs font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900 transition-all cursor-pointer"
            >
              <option value="" disabled>Selecione o tipo...</option>
              <option value="Automatico">Automático (Baseado em Dados)</option>
              <option value="Reconhecimento">Reconhecimento</option>
              <option value="Corretivo">Corretivo</option>
              <option value="Ajuste de Rota">Ajuste de Rota</option>
              <option value="Desenvolvimento">Desenvolvimento</option>
            </select>
          </div>

          <AnimatePresence mode="wait">
            {feedbackType && (
              <motion.div 
                key="feedback-area"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-[10px] font-black uppercase text-zinc-400">Texto do Feedback (Editável)</label>
                <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full h-48 bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-xs font-medium text-zinc-700 leading-relaxed outline-none focus:ring-2 focus:ring-zinc-900 transition-all resize-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={copyToClipboard}
            disabled={!feedbackText}
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
          >
            <MessageCircle size={16} />
            COPIAR PARA WHATSAPP
          </button>
        </div>

        <AnimatePresence>
          {showToast && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-2 z-[110]"
            >
              <Check size={14} /> COPIADO COM SUCESSO
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
