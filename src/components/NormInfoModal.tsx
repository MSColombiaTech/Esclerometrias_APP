import React from 'react';
import { X, BookOpen, CheckCircle2, AlertTriangle, HelpCircle, Compass, ShieldAlert } from 'lucide-react';

interface NormInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NormInfoModal: React.FC<NormInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-3xl text-slate-800 dark:text-slate-100 shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col transition-colors">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-50 via-white to-white dark:from-sky-950/60 dark:via-slate-900 dark:to-slate-900 px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Guía Técnica & Normativa Colombiana
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                NSR-10 (Título C.5) • NTC 3692 • ASTM C805 • ISO 1920-7
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed grow">
          
          {/* Section 1 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              1. Alcance y Procedimiento de Ensayo (NTC 3692 / ASTM C805)
            </h3>
            <p>
              El ensayo de esclerometría (Martillo Schmidt Tipo N, energía de impacto <strong>2.207 N·m</strong>) evalúa la dureza superficial del concreto endurecido para estimar la uniformidad y resistencia a la compresión in-situ.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
              <li><strong>Preparación de la superficie:</strong> Debe pulirse previamente con piedra abrasiva de carburo de silicio (Carborundum) para eliminar lechadas superficiales y carbonatación delgada.</li>
              <li><strong>Malla de impacto:</strong> Se deben realizar un mínimo de <strong>10 lecturas</strong> con una separación no menor a <strong>25 mm (1 pulgada)</strong> entre puntos de impacto.</li>
              <li><strong>Espesor mínimo del elemento:</strong> El elemento debe tener un espesor mínimo de 100 mm y estar debidamente apoyado para evitar vibraciones o disipación de energía elástica.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              2. Regla de Descarte Estadístico Obligatorio (NTC 3692)
            </h3>
            <p>
              La norma colombiana NTC 3692 y la norma ASTM C805 establecen un riguroso criterio de descarte para evitar sesgos por impactos sobre agregados gruesos o porosidades:
            </p>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 rounded-lg text-amber-800 dark:text-amber-200">
              <strong>Criterio de Exclusión:</strong> Se calcula el promedio aritmético preliminar. Se descartan todas las lecturas individuales cuya diferencia respecto al promedio sea <strong>superior a 6 unidades</strong>.
              <p className="mt-1 font-semibold">
                ⚠️ Si se descartan más de 2 lecturas de una serie de 10, la totalidad del ensayo se declara <strong>INVÁLIDO (ANULADO)</strong> y debe repetirse en una zona adyacente.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Compass className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              3. Corrección por Dirección del Impacto (ΔR)
            </h3>
            <p>
              La gravedad modifica la aceleración de la masa percutora del martillo esclerométrico:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white">0° Horizontal (Columnas/Muros)</p>
                <p className="text-slate-500 dark:text-slate-400">ΔR = 0 (Sin corrección)</p>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white">+90° Hacia Arriba ⬆️ (Fondos Vigas/Losas)</p>
                <p className="text-slate-500 dark:text-slate-400">ΔR = +4.3 - 0.043·R (Se suma al rebote)</p>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white">-90° Hacia Abajo ⬇️ (Losas/Pisos)</p>
                <p className="text-slate-500 dark:text-slate-400">ΔR = -7.1 + 0.08·R (Se resta al rebote)</p>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white">±45° Inclinado (Arriba ↗️ / Abajo ↘️)</p>
                <p className="text-slate-500 dark:text-slate-400">Escalado trigonométrico con sin(45°)</p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              4. Criterios de Conformidad NSR-10 (Título C.5.6.5)
            </h3>
            <p>
              El Reglamento Colombiano de Construcción Sismo Resistente NSR-10 establece el siguiente protocolo de toma de decisiones para estructuras de concreto:
            </p>
            <div className="space-y-2">
              <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                <strong>CUMPLE (≥ 95% del f'c):</strong> El elemento satisface la resistencia estructural de diseño.
              </div>
              <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300">
                <strong>ZONA DUDOSA (80% a 95% del f'c):</strong> Según NSR-10 C.5.6.5 se requiere verificación complementaria mediante extracción de <strong>tres núcleos diamantados</strong> (NTC 3658 / ASTM C42) por cada zona representativa.
              </div>
              <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300">
                <strong>NO CUMPLE (&lt; 80% del f'c):</strong> Alerta estructural. Se debe informar de inmediato al Ingeniero Diseñador y a la Interventoría Técnica.
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
