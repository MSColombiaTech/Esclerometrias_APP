import React from 'react';
import { X, BookOpen, ShieldCheck, Check, AlertCircle, FileText, Scale } from 'lucide-react';

interface NormativeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NormativeInfoModal: React.FC<NormativeInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl text-slate-100 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Normativa Colombiana & Estándares de Esclerometría
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-mono">
                  NTC 3692 / NSR-10
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Resumen técnico para control de calidad no destructivo en estructuras de concreto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto grow text-xs sm:text-sm leading-relaxed text-slate-300">
          
          {/* Card 1: NTC 3692 / ASTM C805 */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <h3 className="font-bold text-sky-400 text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              NTC 3692 (Equivalente ASTM C805) - Método del Número de Rebote
            </h3>
            <p>
              Establece el procedimiento para determinar el número de rebote en concreto endurecido mediante el esclerómetro Schmidt (Tipo N, energía de 2.207 N·m).
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300">
              <li><strong>Preparación de la Superficie:</strong> Se debe pulir la capa superficial con piedra de carburo de silicio (carborundum) en un área mínima de 150 mm de diámetro para eliminar la lechada débil y textura rugosa.</li>
              <li><strong>Malla de Ensayo:</strong> Tomar al menos <strong>10 lecturas</strong> espaciadas al menos <strong>25 mm (1 pulgada)</strong> entre sí y a más de 25 mm de los bordes del elemento.</li>
              <li><strong>Criterio de Descarte Estadístico:</strong> Calcular el promedio de las 10 lecturas. Descartar cualquier lectura individual que difiera en más de <strong>6 unidades</strong> del promedio. Recalcular el promedio con las lecturas válidas.</li>
              <li><strong>Anulación del Ensayo:</strong> Si se descartan más de <strong>2 lecturas</strong> de 10 (más del 20%), el ensayo completo se anula y debe repetirse en una zona adyacente.</li>
              <li><strong>Verificación en Yunque de Calibración:</strong> El esclerómetro debe verificarse periódicamente en el yunque de acero templado, debiendo arrojar un rebote de <strong>80 ± 2</strong>.</li>
            </ul>
          </div>

          {/* Card 2: NSR-10 Title C */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
              <Scale className="h-4 w-4" />
              NSR-10 Título C (Concreto Estructural) - Capítulo C.5
            </h3>
            <p>
              La NSR-10 reconoce los ensayos no destructivos como métodos complementarios para evaluar la uniformidad del concreto en la estructura y delimitar zonas de baja resistencia relativa:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700/60">
                <p className="font-bold text-emerald-400 mb-1">Zona Conforme (≥ 95% f'c)</p>
                <p className="text-xs text-slate-300">
                  El elemento estructural cumple satisfactoriamente con la resistencia de diseño especificada en los planos estructurales.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700/60">
                <p className="font-bold text-amber-400 mb-1">Zona Dudosa (80% - 95% f'c)</p>
                <p className="text-xs text-slate-300">
                  Según NSR-10 C.5.6.5, ante dudas sobre la calidad del concreto colocado, se recomienda correlacionar mediante extracción de testigos o núcleos diamantados (NTC 3658).
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Extracción de Núcleos NTC 3658 */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Correlación con Núcleos Diamantados (NTC 3658 / ASTM C42)
            </h3>
            <p>
              Para obtener curvas de calibración exactas in situ, la NSR-10 recomienda extraer un mínimo de 3 núcleos diamantados por tipología estructural, correlacionar la resistencia a compresión real (f'c,núcleos) con el rebote corregido (R corregido) y ajustar los coeficientes de la curva:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 text-center font-mono text-brand-300 font-bold">
              f'c (MPa) = a · (R_corr)^b
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
