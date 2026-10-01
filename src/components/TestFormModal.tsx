import React, { useState, useEffect } from 'react';
import { 
  SclerometryTest, 
  ElementType, 
  ImpactAngle, 
  SurfaceCondition, 
  CurveModel, 
  TestPhoto 
} from '../types';
import { 
  evaluateSclerometryTest, 
  COLOMBIAN_CONCRETE_PRESETS,
  CURVE_MODEL_DESCRIPTIONS,
  getCarbonationFactor,
  mpaToPsi,
  psiToMpa,
  generateRealisticReadingsForTargetFc
} from '../utils/sclerometryNorms';
import { compressImageFile } from '../utils/imageCompressor';
import { 
  X, 
  Camera, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Save, 
  Compass, 
  Sparkles,
  Layers,
  Info,
  Dices,
  RotateCcw,
  Wand2
} from 'lucide-react';

interface TestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (test: SclerometryTest) => void;
  projectId: string;
  initialData?: SclerometryTest | null;
  defaultHammerModel?: string;
  defaultHammerSerial?: string;
}

export const TestFormModal: React.FC<TestFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectId,
  initialData,
  defaultHammerModel = 'Schmidt Original Tipo N (2.207 Nm)',
  defaultHammerSerial = 'SCH-N-88492-COL'
}) => {
  // Element Metadata
  const [elementTag, setElementTag] = useState(initialData?.elementTag || '');
  const [elementType, setElementType] = useState<ElementType>(initialData?.elementType || 'Columna');
  const [levelAxis, setLevelAxis] = useState(initialData?.levelAxis || '');
  const initialMpa = initialData 
    ? ((initialData.fcDesignMpa && initialData.fcDesignMpa > 0) 
        ? initialData.fcDesignMpa 
        : (initialData.fcDesignPsi && initialData.fcDesignPsi > 0 ? psiToMpa(initialData.fcDesignPsi) : (initialData.fcDesignMpa === 0 ? 0 : 21)))
    : 21;
  const [fcDesignMpa, setFcDesignMpa] = useState<number>(initialMpa);
  const [concreteAgeDays, setConcreteAgeDays] = useState<number>(initialData?.concreteAgeDays || 28);
  const [hammerModel, setHammerModel] = useState(initialData?.hammerModel || defaultHammerModel);
  const [hammerSerial, setHammerSerial] = useState(initialData?.hammerSerial || defaultHammerSerial);
  
  // Test Parameters
  const [impactAngle, setImpactAngle] = useState<ImpactAngle>(initialData?.impactAngle !== undefined ? initialData.impactAngle : 0);
  const [surfaceCondition, setSurfaceCondition] = useState<SurfaceCondition>(initialData?.surfaceCondition || 'Pulido con piedra Carborundum');
  const [carbonationDepthMm, setCarbonationDepthMm] = useState<number>(initialData?.carbonationDepthMm || 0);
  const [curveModel, setCurveModel] = useState<CurveModel>(initialData?.curveModel || 'SCHMIDT_N_DIRECT');
  
  // Readings (10 to 12 readings)
  const defaultReadings = initialData?.readings 
    ? [...initialData.readings] 
    : generateRealisticReadingsForTargetFc(
        fcDesignMpa > 0 ? fcDesignMpa * 0.95 : 22.0,
        fcDesignMpa > 0 ? fcDesignMpa * 1.15 : 38.0,
        impactAngle,
        curveModel
      );
  while (defaultReadings.length < 10) defaultReadings.push(0);
  
  const [readings, setReadings] = useState<number[]>(defaultReadings);
  const [photos, setPhotos] = useState<TestPhoto[]>(initialData?.photos || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [operatorName, setOperatorName] = useState(initialData?.operatorName || 'Ing. Fredy Piraquive');

  // Live calculation
  const carbonationFactor = getCarbonationFactor(carbonationDepthMm);
  const evaluation = evaluateSclerometryTest(
    readings, 
    impactAngle, 
    fcDesignMpa, 
    curveModel, 
    carbonationFactor
  );

  // Helper para generar valores de muestra aleatorios y realistas
  const handleGenerateSampleReadings = (mode: 'AUTO' | 'VARIED' | 'CONFORM' | 'DIAGNOSTIC' | 'DOUBTFUL' | 'HIGH' = 'AUTO') => {
    let minT = 22.0;
    let maxT = 38.0;

    if (mode === 'CONFORM' && fcDesignMpa > 0) {
      minT = Number((fcDesignMpa * 0.98).toFixed(1));
      maxT = Number((fcDesignMpa * 1.16).toFixed(1));
    } else if (mode === 'DOUBTFUL' && fcDesignMpa > 0) {
      minT = Number((fcDesignMpa * 0.82).toFixed(1));
      maxT = Number((fcDesignMpa * 0.93).toFixed(1));
    } else if (mode === 'HIGH') {
      minT = 35.0;
      maxT = 46.0;
    } else if (mode === 'DIAGNOSTIC' || fcDesignMpa === 0) {
      // Valores diversos para diagnóstico estructural
      const diagPresets = [
        [20.0, 26.0],
        [24.0, 31.0],
        [27.0, 35.0],
        [31.0, 39.0],
        [22.0, 38.0]
      ];
      const chosen = diagPresets[Math.floor(Math.random() * diagPresets.length)];
      minT = chosen[0];
      maxT = chosen[1];
    } else if (fcDesignMpa > 0) {
      minT = Number((fcDesignMpa * 0.92).toFixed(1));
      maxT = Number((fcDesignMpa * 1.15).toFixed(1));
    }

    const newSample = generateRealisticReadingsForTargetFc(minT, maxT, impactAngle, curveModel);
    setReadings(newSample);
  };

  const handleClearReadings = () => {
    setReadings(Array(10).fill(0));
  };

  useEffect(() => {
    if (initialData) {
      setElementTag(initialData.elementTag);
      setElementType(initialData.elementType);
      setLevelAxis(initialData.levelAxis);
      const mpa = (initialData.fcDesignMpa && initialData.fcDesignMpa > 0)
        ? initialData.fcDesignMpa
        : (initialData.fcDesignPsi && initialData.fcDesignPsi > 0 ? psiToMpa(initialData.fcDesignPsi) : (initialData.fcDesignMpa === 0 ? 0 : 21));
      setFcDesignMpa(mpa);
      setConcreteAgeDays(initialData.concreteAgeDays);
      setImpactAngle(initialData.impactAngle);
      setSurfaceCondition(initialData.surfaceCondition);
      setCarbonationDepthMm(initialData.carbonationDepthMm || 0);
      setCurveModel(initialData.curveModel);
      setReadings([...initialData.readings]);
      setPhotos(initialData.photos || []);
      setNotes(initialData.notes || '');
      setOperatorName(initialData.operatorName || 'Ing. Fredy Piraquive');
    } else if (isOpen) {
      // Generar valores aleatorios diversos únicos al abrir un nuevo registro
      const minT = fcDesignMpa > 0 ? fcDesignMpa * 0.94 : 22.0;
      const maxT = fcDesignMpa > 0 ? fcDesignMpa * 1.14 : 38.0;
      setReadings(generateRealisticReadingsForTargetFc(minT, maxT, impactAngle, curveModel));
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleReadingChange = (index: number, valStr: string) => {
    const val = parseInt(valStr, 10);
    const updated = [...readings];
    updated[index] = isNaN(val) ? 0 : Math.min(70, Math.max(0, val));
    setReadings(updated);
  };

  const handleAddReadingSlot = () => {
    if (readings.length < 12) {
      setReadings([...readings, 0]);
    }
  };

  const handleRemoveReadingSlot = (index: number) => {
    if (readings.length > 10) {
      const updated = readings.filter((_, i) => i !== index);
      setReadings(updated);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const compressedDataUrl = await compressImageFile(file, 800, 0.68);
        const newPhoto: TestPhoto = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          dataUrl: compressedDataUrl,
          caption: `Ensayo ${elementTag || 'Elemento'}`,
          timestamp: Date.now()
        };
        setPhotos(prev => [...prev, newPhoto]);
      } catch (err) {
        console.error('Error procesando foto:', err);
      }
    }

    e.target.value = '';
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handlePresetSelect = (mpa: number) => {
    setFcDesignMpa(mpa);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!elementTag.trim()) {
      alert('Por favor especifica el código o identificación del elemento (ej: C-101).');
      return;
    }

    const validNumbers = readings.filter(r => r > 0);
    if (validNumbers.length < 9) {
      if (!confirm('Se recomiendan al menos 10 impactos según la norma NTC 3692. ¿Deseas guardar con lecturas incompletas?')) {
        return;
      }
    }

    const now = Date.now();
    const testRecord: SclerometryTest = {
      id: initialData?.id || `test-${now}`,
      projectId,
      elementTag: elementTag.trim(),
      elementType,
      levelAxis: levelAxis.trim() || 'No especificado',
      fcDesignMpa,
      fcDesignPsi: mpaToPsi(fcDesignMpa),
      concreteAgeDays,
      hammerModel,
      hammerSerial,
      impactAngle,
      surfaceCondition,
      carbonationDepthMm,
      curveModel,
      readings: validNumbers,
      excludedIndices: evaluation.excludedIndices,
      meanRaw: evaluation.meanRaw,
      correctionAngle: evaluation.correctionAngle,
      meanCorrected: evaluation.meanCorrected,
      stdDev: evaluation.stdDev,
      cov: evaluation.cov,
      estimatedFcMpa: evaluation.estimatedFcMpa,
      estimatedFcKgcm2: evaluation.estimatedFcKgcm2,
      estimatedFcPsi: evaluation.estimatedFcPsi,
      complianceRatio: evaluation.complianceRatio,
      status: evaluation.status,
      statusNotes: evaluation.statusNotes,
      photos,
      notes: notes.trim(),
      operatorName: operatorName.trim(),
      createdAt: initialData?.createdAt || now,
      updatedAt: now
    };

    onSave(testRecord);
    onClose();
  };

  const angleOptions: { angle: ImpactAngle; label: string; desc: string; icon: string }[] = [
    { angle: 0, label: '0° Horizontal', desc: 'Columnas, muros y caras laterales de vigas', icon: '➡️' },
    { angle: 90, label: '+90° Arriba', desc: 'Fondos de vigas y losas (cielo rasos)', icon: '⬆️' },
    { angle: 45, label: '+45° Inclinado Arriba', desc: 'Achaflanados y ménsulas ascendentes', icon: '↗️' },
    { angle: -45, label: '-45° Inclinado Abajo', desc: 'Taludes y caras inclinadas descendentes', icon: '↘️' },
    { angle: -90, label: '-90° Abajo', desc: 'Losas superiores, pisos y pavimentos', icon: '⬇️' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-4xl text-slate-800 dark:text-slate-100 shadow-2xl overflow-hidden my-auto max-h-[96vh] flex flex-col transition-colors">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {initialData ? 'Editar Ensayo de Esclerometría' : 'Registrar Ensayo de Esclerometría'}
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-500/30">
                  NTC 3692 / ASTM C805
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro de 10 impactos, corrección por ángulo y cálculo instantáneo de f'c
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 grow">
          
          {/* Section 1: Element Identification */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <span>1. Datos del Elemento Estructural</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Código / Identificación *
                </label>
                <input
                  type="text"
                  required
                  value={elementTag}
                  onChange={(e) => setElementTag(e.target.value)}
                  placeholder="ej: C-101, V-204, L-N3"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-bold focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Elemento
                </label>
                <select
                  value={elementType}
                  onChange={(e) => setElementType(e.target.value as ElementType)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="Columna">Columna</option>
                  <option value="Viga">Viga</option>
                  <option value="Losa">Losa</option>
                  <option value="Muro Estructural">Muro Estructural</option>
                  <option value="Zapata">Zapata</option>
                  <option value="Pavimento / Piso">Pavimento / Piso</option>
                  <option value="Pilote">Pilote</option>
                  <option value="Cimentación">Cimentación</option>
                  <option value="Pedestal">Pedestal</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nivel / Eje / Abscisa
                </label>
                <input
                  type="text"
                  value={levelAxis}
                  onChange={(e) => setLevelAxis(e.target.value)}
                  placeholder="ej: Nivel +3.20 / Eje B-2"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Design Strength Presets & Toggle */}
            <div className="pt-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Resistencia de Diseño Especificada (f'c)
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    (Opcional para patología/estructuras existentes)
                  </span>
                </div>
                {fcDesignMpa > 0 ? (
                  <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-300">
                    {fcDesignMpa} MPa ({mpaToPsi(fcDesignMpa)} PSI / {(fcDesignMpa * 10.197).toFixed(1)} kg/cm²)
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-300 dark:border-sky-800">
                    Sin f'c especificado (Evaluación Diagnóstica)
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1.5 items-center">
                <button
                  type="button"
                  onClick={() => setFcDesignMpa(0)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                    fcDesignMpa === 0
                      ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-400 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
                  }`}
                  title="Selecciona esta opción si no conoces el f'c de diseño (ej: patología, peritajes, estructuras existentes)"
                >
                  <span>🔍 Sin f'c de diseño (Diagnóstico)</span>
                </button>

                {COLOMBIAN_CONCRETE_PRESETS.map(preset => (
                  <button
                    key={preset.mpa}
                    type="button"
                    onClick={() => handlePresetSelect(preset.mpa)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                      fcDesignMpa === preset.mpa
                        ? 'bg-brand-600 text-white font-bold ring-2 ring-brand-400'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {preset.mpa} MPa ({preset.psi} PSI)
                  </button>
                ))}
              </div>

              {fcDesignMpa === 0 && (
                <p className="text-[11px] text-sky-700 dark:text-sky-300 bg-sky-50/80 dark:bg-sky-950/40 p-2 rounded-lg border border-sky-200 dark:border-sky-800/60 mt-1.5">
                  ℹ️ <strong>Modo Diagnóstico Activado:</strong> Se estimará la resistencia in-situ (MPa, PSI, kg/cm²) mediante la curva de calibración del esclerómetro, sin emitir calificación de conformidad porcentual.
                </p>
              )}
            </div>

            <div className={`grid grid-cols-1 ${fcDesignMpa > 0 ? 'sm:grid-cols-2' : ''} gap-3 pt-1`}>
              {fcDesignMpa > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Edad del Concreto (días)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={concreteAgeDays}
                    onChange={(e) => setConcreteAgeDays(parseInt(e.target.value, 10) || 28)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Condición Superficial (NTC 3692)
                </label>
                <select
                  value={surfaceCondition}
                  onChange={(e) => setSurfaceCondition(e.target.value as SurfaceCondition)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="Pulido con piedra Carborundum">Pulido con piedra Carborundum (Recomendado NTC)</option>
                  <option value="Seco al aire">Seco al aire (Sin pulir)</option>
                  <option value="Encofrado metálico liso">Encofrado metálico liso</option>
                  <option value="Encofrado de madera">Encofrado de madera</option>
                  <option value="Húmedo">Superficie Húmeda</option>
                </select>
              </div>
            </div>

            {/* Curva de Calibración / Conversión */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Curva de Calibración / Conversión f'c
                </label>
                <span className="text-[11px] font-mono text-brand-600 dark:text-brand-400">
                  {CURVE_MODEL_DESCRIPTIONS[curveModel]?.specimen}
                </span>
              </div>
              <select
                value={curveModel}
                onChange={(e) => setCurveModel(e.target.value as CurveModel)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="SCHMIDT_N_DIRECT">
                  ⭐ Schmidt Original Tipo N - Placa Directa Fábrica (Ábaco kgf/cm² / PSI)
                </option>
                <option value="PROCEQ_N_STANDARD">
                  Proceq Schmidt N - Cilindro Estándar Ø15x30 cm (NTC 3692 / NSR-10 / ASTM C805)
                </option>
                <option value="PROCEQ_N_CUBE">
                  Proceq Schmidt N - Probeta Cúbica 150 mm (EN 12504-2 / DIN 1048)
                </option>
                <option value="NSR10_COLOMBIA">
                  Curva Regional NSR-10 / ASOCRETO (Agregados Colombianos)
                </option>
                <option value="ASTM_POLYNOMIAL">
                  Modelo Polinomial ASTM C805 / ACI 228.1R
                </option>
                <option value="CUSTOM_CALIBRATED">
                  Curva Calibrada in-situ con Núcleos Diamantados (NTC 3658)
                </option>
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                Fórmula / Método: {CURVE_MODEL_DESCRIPTIONS[curveModel]?.formula}
              </p>
            </div>

          </div>

          {/* Section 2: Impact Angle & Readings Grid */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-4">
            
            {/* Direction / Angle */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                <Compass className="h-3.5 w-3.5" /> 2. Dirección del Disparo / Ángulo de Impacto (α)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {angleOptions.map((opt) => (
                  <button
                    key={opt.angle}
                    type="button"
                    onClick={() => setImpactAngle(opt.angle)}
                    className={`p-2 rounded-xl text-left transition border ${
                      impactAngle === opt.angle
                        ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-200 ring-1 ring-amber-400'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-base mb-1">{opt.icon}</div>
                    <p className="font-bold text-xs leading-tight">{opt.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Readings Pad (10 to 12 inputs) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>Malla de 10 Impactos (Valores de Rebote R)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      (Espaciado mín. 25 mm según NTC 3692)
                    </span>
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {readings.length} lecturas
                  </span>
                  {readings.length < 12 && (
                    <button
                      type="button"
                      onClick={handleAddReadingSlot}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold"
                    >
                      + Agregar Impacto 11/12
                    </button>
                  )}
                </div>
              </div>

              {/* Random Values Generator Toolbar */}
              <div className="mb-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleGenerateSampleReadings('AUTO')}
                    className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
                    title="Generar 10 lecturas aleatorias realistas distintas con dispersión según NTC 3692"
                  >
                    <Dices className="h-3.5 w-3.5" />
                    <span>Generar Muestra Aleatoria</span>
                  </button>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                    Variantes rápidas:
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleGenerateSampleReadings('VARIED')}
                    className="px-2 py-1 rounded-md text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
                    title="Genera lecturas en rango variado de 22 a 38 MPa"
                  >
                    🎲 Muy Diverso
                  </button>
                  {fcDesignMpa > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleGenerateSampleReadings('CONFORM')}
                        className="px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition"
                        title={`Genera lecturas conformes con ${fcDesignMpa} MPa (98% - 115%)`}
                      >
                        🎯 Conforme ({fcDesignMpa} MPa)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateSampleReadings('DOUBTFUL')}
                        className="px-2 py-1 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 transition"
                        title={`Genera lecturas en zona dudosa para ${fcDesignMpa} MPa (82% - 93%)`}
                      >
                        ⚠️ Zona Dudosa
                      </button>
                    </>
                  )}
                  {fcDesignMpa === 0 && (
                    <button
                      type="button"
                      onClick={() => handleGenerateSampleReadings('DIAGNOSTIC')}
                      className="px-2 py-1 rounded-md text-[11px] font-medium bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700 transition"
                      title="Genera perfil aleatorio de diagnóstico estructural"
                    >
                      🔍 Diagnóstico
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleGenerateSampleReadings('HIGH')}
                    className="px-2 py-1 rounded-md text-[11px] font-medium bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 transition"
                    title="Genera lecturas de alta resistencia (35 - 46 MPa)"
                  >
                    ⚡ Alta Resistencia
                  </button>
                  <button
                    type="button"
                    onClick={handleClearReadings}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition text-[11px]"
                    title="Poner todas las lecturas en blanco/cero"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid of Inputs */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {readings.map((val, idx) => {
                  const isExcluded = evaluation.excludedIndices.includes(idx);
                  return (
                    <div key={idx} className="relative">
                      <div className="text-[10px] text-center font-mono text-slate-500 dark:text-slate-400 mb-0.5">
                        #{idx + 1}
                      </div>
                      <input
                        type="number"
                        min={10}
                        max={70}
                        value={val || ''}
                        onChange={(e) => handleReadingChange(idx, e.target.value)}
                        className={`w-full text-center py-2 px-1 rounded-lg font-mono text-base font-bold transition border ${
                          isExcluded
                            ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 line-through ring-1 ring-rose-500'
                            : val > 0
                            ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-brand-600 dark:text-brand-300 focus:border-brand-500'
                            : 'bg-slate-100 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      {isExcluded && (
                        <span 
                          title="Descartado según NTC 3692 (difiere > 6 unidades del promedio)" 
                          className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-bold"
                        >
                          ✕
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Notice of Discarded Readings */}
              {evaluation.excludedIndices.length > 0 && (
                <div className="mt-2.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-200">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Criterio de Descarte NTC 3692 / ASTM C805: </span>
                    Se descartaron {evaluation.excludedIndices.length} lectura(s) por diferir en más de 6 unidades respecto al promedio ({evaluation.excludedIndices.map(i => `#${i+1}: ${readings[i]}`).join(', ')}).
                    {evaluation.excludedIndices.length > 2 && (
                      <p className="font-semibold text-rose-700 dark:text-rose-300 mt-0.5">
                        ⚠️ Al descartarse más de 2 lecturas, la norma exige anular el ensayo y repetir en una zona adyacente.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* LIVE CALCULATION KPI DASHBOARD */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-brand-500/30 dark:border-brand-500/40 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Resultados en Tiempo Real (NTC 3692)
                </span>
                
                {/* Status Badge */}
                <div className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                  evaluation.status === 'CUMPLE'
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                    : evaluation.status === 'DUDOSO'
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                    : evaluation.status === 'NO_CUMPLE'
                    ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40'
                    : evaluation.status === 'DIAGNOSTICO'
                    ? 'bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/40'
                    : 'bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                }`}>
                  {evaluation.status === 'CUMPLE' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {evaluation.status === 'DUDOSO' && <AlertTriangle className="h-3.5 w-3.5" />}
                  {evaluation.status === 'NO_CUMPLE' && <XCircle className="h-3.5 w-3.5" />}
                  {evaluation.status === 'DIAGNOSTICO' && <Info className="h-3.5 w-3.5" />}
                  {evaluation.status === 'INVALIDO' && <HelpCircle className="h-3.5 w-3.5" />}
                  <span>{evaluation.status.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Rebote Promedio (R)</p>
                  <p className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                    {evaluation.meanRaw}
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">
                    ΔR Ángulo: {evaluation.correctionAngle >= 0 ? `+${evaluation.correctionAngle}` : evaluation.correctionAngle}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">R Corregido (R corr)</p>
                  <p className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">
                    {evaluation.meanCorrected}
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">
                    CV: {evaluation.cov}% (s = {evaluation.stdDev})
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">f'c Estimado (PSI)</p>
                  <p className="text-lg font-mono font-bold text-brand-600 dark:text-brand-400">
                    {(evaluation.estimatedFcPsi ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">PSI</span>
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                    {evaluation.estimatedFcMpa ?? 0} MPa • {evaluation.estimatedFcKgcm2 ?? 0} kg/cm²
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                    {fcDesignMpa > 0 ? "% f'c de Diseño" : 'Modo Evaluación'}
                  </p>
                  {fcDesignMpa > 0 ? (
                    <>
                      <p className={`text-lg font-mono font-bold ${
                        evaluation.complianceRatio >= 95 ? 'text-emerald-600 dark:text-emerald-400' :
                        evaluation.complianceRatio >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {evaluation.complianceRatio}%
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">
                        Diseño: {fcDesignMpa} MPa
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-sky-600 dark:text-sky-400 mt-1">
                        In-Situ Puro
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">
                        Sin f'c teórico
                      </p>
                    </>
                  )}
                </div>

              </div>

              <div className="mt-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-500 shrink-0" />
                <span>{evaluation.statusNotes}</span>
              </div>
            </div>

          </div>

          {/* Section 3: Photos & Observations */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" /> 3. Registro Fotográfico de Campo ({photos.length})
              </h3>
              
              <label className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm">
                <Camera className="h-4 w-4" />
                <span>Tomar / Subir Foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  multiple 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* Photo Previews */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((p) => (
                  <div key={p.id} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                    <img 
                      src={p.dataUrl} 
                      alt="Foto de ensayo" 
                      className="w-full h-28 object-cover group-hover:scale-105 transition duration-300" 
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(p.id)}
                      className="absolute top-1 right-1 p-1 rounded bg-rose-600/80 text-white hover:bg-rose-600 transition"
                      title="Eliminar foto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="p-1.5 text-[10px] text-slate-700 dark:text-slate-300 truncate bg-white/90 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800">
                      {new Date(p.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                No has adjuntado fotos de este elemento todavía. Puedes tomar fotos de la cuadrícula de impacto o del elemento estructural.
              </p>
            )}

            {/* Operator & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Técnico / Operador del Ensayo
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="ej: Ing. Fredy Piraquive"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Profundidad de Carbonatación (Fenolftaleína mm)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={carbonationDepthMm}
                  onChange={(e) => setCarbonationDepthMm(parseFloat(e.target.value) || 0)}
                  placeholder="0 mm"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observaciones de Campo
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ej: Zona con armadura densa, se evitó la proximidad a varillas de refuerzo. Sonido metálico uniforme..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

          </div>

          {/* Footer Save / Cancel */}
          <div className="pt-2 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 dark:bg-slate-900/90 backdrop-blur py-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-brand-500/25 active:scale-95"
            >
              <Save className="h-4 w-4" />
              <span>{initialData ? 'Actualizar Ensayo' : 'Guardar Ensayo'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
