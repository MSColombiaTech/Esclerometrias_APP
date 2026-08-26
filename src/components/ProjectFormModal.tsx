import React, { useState } from 'react';
import { Project, CurveModel } from '../types';
import { X, Building2, HardHat, FileBadge, Save, MapPin } from 'lucide-react';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  initialData?: Project | null;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [code, setCode] = useState(initialData?.code || `OBRA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [name, setName] = useState(initialData?.name || '');
  const [client, setClient] = useState(initialData?.client || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [municipality, setMunicipality] = useState(initialData?.municipality || 'Bogotá D.C.');
  const [department, setDepartment] = useState(initialData?.department || 'Cundinamarca');
  const [contractor, setContractor] = useState(initialData?.contractor || '');
  const [supervision, setSupervision] = useState(initialData?.supervision || '');
  const [engineerInCharge, setEngineerInCharge] = useState(initialData?.engineerInCharge || '');
  const [licenseNumber, setLicenseNumber] = useState(initialData?.licenseNumber || '');
  const [defaultHammerModel, setDefaultHammerModel] = useState(initialData?.defaultHammerModel || 'Schmidt Original Tipo N (2.207 Nm)');
  const [defaultHammerSerial, setDefaultHammerSerial] = useState(initialData?.defaultHammerSerial || 'SCH-N-');
  const [defaultCurve, setDefaultCurve] = useState<CurveModel>(initialData?.defaultCurve || 'PROCEQ_N_STANDARD');
  const [notes, setNotes] = useState(initialData?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Por favor diligencia el código y el nombre del proyecto.');
      return;
    }

    const now = Date.now();
    const project: Project = {
      id: initialData?.id || `prj-${now}`,
      code: code.trim(),
      name: name.trim(),
      client: client.trim() || 'Particular',
      location: location.trim() || 'En obra',
      municipality: municipality.trim() || 'Colombia',
      department: department.trim() || 'Colombia',
      contractor: contractor.trim() || 'N/A',
      supervision: supervision.trim() || 'N/A',
      engineerInCharge: engineerInCharge.trim() || 'Ingeniero Residente',
      licenseNumber: licenseNumber.trim(),
      defaultHammerModel,
      defaultHammerSerial,
      defaultCurve,
      notes: notes.trim(),
      createdAt: initialData?.createdAt || now,
      updatedAt: now
    };

    onSave(project);
    onClose();
  };

  const colombianDepartments = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá',
    'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca',
    'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño',
    'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia',
    'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {initialData ? 'Editar Proyecto de Obra' : 'Nuevo Proyecto de Esclerometría'}
              </h2>
              <p className="text-xs text-slate-400">
                Parámetros de control de calidad bajo normativa NTC 3692 y NSR-10
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          
          {/* Identificación de la Obra */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Identificación del Proyecto
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Código de Obra *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ej: PRJ-2026-01"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre del Proyecto / Estructura *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: Torres del Parque - Bloque A"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cliente / Contratante
                </label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="ej: Constructora Bolívar S.A."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dirección / Sector
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="ej: Cra 7 # 72-41"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Departamento (Colombia)
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  {colombianDepartments.map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Municipio / Ciudad
                </label>
                <input
                  type="text"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  placeholder="ej: Bogotá D.C."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Actores Técnicos e Interventoría */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <HardHat className="h-3.5 w-3.5" /> Responsables Técnicos & Interventoría
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Empresa Contratista
                </label>
                <input
                  type="text"
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  placeholder="ej: Consorcio Estructuras 2026"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supervisión / Interventoría
                </label>
                <input
                  type="text"
                  value={supervision}
                  onChange={(e) => setSupervision(e.target.value)}
                  placeholder="ej: Interventoría Técnica Integral SAS"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ingeniero Especialista / Responsable
                </label>
                <input
                  type="text"
                  value={engineerInCharge}
                  onChange={(e) => setEngineerInCharge(e.target.value)}
                  placeholder="ej: Ing. Carlos Restrepo"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Matrícula Profesional (T.P.)
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="ej: TP 25202-18456 CND"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Configuración del Equipo y Curvas */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <FileBadge className="h-3.5 w-3.5" /> Equipo de Ensayo & Curva Base
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Modelo del Esclerómetro
                </label>
                <select
                  value={defaultHammerModel}
                  onChange={(e) => setDefaultHammerModel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Schmidt Original Tipo N (2.207 Nm)">Schmidt Original Tipo N (2.207 Nm) - Estándar Edificaciones</option>
                  <option value="Schmidt Tipo L (0.735 Nm)">Schmidt Tipo L (0.735 Nm) - Elementos Delgados / Baja Resistencia</option>
                  <option value="SilverSchmidt Tipo N (Digital)">SilverSchmidt Tipo N (Digital Proceq)</option>
                  <option value="Esclerómetro Digital Portátil">Esclerómetro Digital Portátil Calibrado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Serial / Placa de Calibración
                </label>
                <input
                  type="text"
                  value={defaultHammerSerial}
                  onChange={(e) => setDefaultHammerSerial(e.target.value)}
                  placeholder="ej: SCH-N-88492"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Curva de Conversión Predeterminada
              </label>
              <select
                value={defaultCurve}
                onChange={(e) => setDefaultCurve(e.target.value as CurveModel)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="PROCEQ_N_STANDARD">Curva Universal Estándar NTC 3692 / Tipo N (f'c = 0.0436·R^2.052)</option>
                <option value="NSR10_COLOMBIA">Curva Ajustada Agregados Colombianos NSR-10 (f'c = 0.0385·R^2.085)</option>
                <option value="ASTM_POLYNOMIAL">Modelo Polinomial ASTM C805 (Segundo Orden)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Observaciones / Alcance de la Inspección
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ej: Evaluación no destructiva de vigas y columnas para aceptación de desencofrado..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-brand-500/25"
            >
              <Save className="h-4 w-4" />
              <span>{initialData ? 'Guardar Cambios' : 'Crear Proyecto'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
