import React, { useState, useEffect } from 'react';
import { Project, CurveModel } from '../types';
import { X, Building2, Save } from 'lucide-react';

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
  const [code, setCode] = useState(initialData?.code || '');
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
  const [defaultHammerSerial, setDefaultHammerSerial] = useState(initialData?.defaultHammerSerial || 'SCH-N-COL-2026');
  const [defaultCurve, setDefaultCurve] = useState<CurveModel>(initialData?.defaultCurve || 'PROCEQ_N_STANDARD');
  const [notes, setNotes] = useState(initialData?.notes || '');

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setClient(initialData.client);
      setLocation(initialData.location);
      setMunicipality(initialData.municipality);
      setDepartment(initialData.department);
      setContractor(initialData.contractor);
      setSupervision(initialData.supervision);
      setEngineerInCharge(initialData.engineerInCharge);
      setLicenseNumber(initialData.licenseNumber || '');
      setDefaultHammerModel(initialData.defaultHammerModel);
      setDefaultHammerSerial(initialData.defaultHammerSerial);
      setDefaultCurve(initialData.defaultCurve);
      setNotes(initialData.notes || '');
    } else {
      setCode(`OBRA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setClient('');
      setLocation('');
      setMunicipality('Bogotá D.C.');
      setDepartment('Cundinamarca');
      setContractor('');
      setSupervision('');
      setEngineerInCharge('');
      setLicenseNumber('');
      setDefaultHammerModel('Schmidt Original Tipo N (2.207 Nm)');
      setDefaultHammerSerial('SCH-N-COL-2026');
      setDefaultCurve('PROCEQ_N_STANDARD');
      setNotes('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingresa el nombre de la obra o proyecto.');
      return;
    }

    const now = Date.now();
    const projectRecord: Project = {
      id: initialData?.id || `prj-${now}`,
      code: code.trim() || `OBRA-${new Date().getFullYear()}-01`,
      name: name.trim(),
      client: client.trim() || 'Constructora / Cliente',
      location: location.trim() || 'Dirección de obra',
      municipality: municipality.trim() || 'Bogotá D.C.',
      department: department.trim() || 'Cundinamarca',
      contractor: contractor.trim() || 'Contratista de Obra',
      supervision: supervision.trim() || 'Interventoría Técnica',
      engineerInCharge: engineerInCharge.trim() || 'Ingeniero Responsable',
      licenseNumber: licenseNumber.trim(),
      defaultHammerModel: defaultHammerModel.trim(),
      defaultHammerSerial: defaultHammerSerial.trim(),
      defaultCurve: defaultCurve,
      notes: notes.trim(),
      createdAt: initialData?.createdAt || now,
      updatedAt: now
    };

    onSave(projectRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {initialData ? 'Editar Proyecto de Esclerometría' : 'Crear Nuevo Proyecto / Obra'}
              </h2>
              <p className="text-xs text-slate-400">
                Información técnica y datos legales para informes bajo NSR-10
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 grow text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Nombre de la Obra / Estructura *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Torres de San Jerónimo - Etapa 2"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Código de Proyecto
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="OBRA-2026-01"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Cliente / Propietario
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="ej: Constructora Bolívar S.A."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Municipio / Ciudad
              </label>
              <input
                type="text"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                placeholder="ej: Medellín / Bogotá"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Departamento
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="ej: Antioquia / Cundinamarca"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Dirección / Ubicación en Obra
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="ej: Carrera 43A # 1-50, El Poblado"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Contratista Constructor
              </label>
              <input
                type="text"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="ej: Consorcio Edificaciones SAS"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Interventoría / Supervisión Técnica
              </label>
              <input
                type="text"
                value={supervision}
                onChange={(e) => setSupervision(e.target.value)}
                placeholder="ej: Interventorías Colombianas SAS"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Ingeniero Especialista Responsable
              </label>
              <input
                type="text"
                value={engineerInCharge}
                onChange={(e) => setEngineerInCharge(e.target.value)}
                placeholder="ej: Ing. Carlos Andrés Restrepo"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Matrícula Profesional (COPNIA)
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="ej: TP 25202-18456 CND"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-sky-400">Equipo Esclerómetro & Curva Predeterminada</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Modelo de Martillo</label>
                <input
                  type="text"
                  value={defaultHammerModel}
                  onChange={(e) => setDefaultHammerModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Serial / Calibración</label>
                <input
                  type="text"
                  value={defaultHammerSerial}
                  onChange={(e) => setDefaultHammerSerial(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Curva por Defecto</label>
                <select
                  value={defaultCurve}
                  onChange={(e) => setDefaultCurve(e.target.value as CurveModel)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                >
                  <option value="PROCEQ_N_STANDARD">Proceq Tipo N (Cilindro Ø15x30)</option>
                  <option value="PROCEQ_N_CUBE">Proceq Tipo N (Cubo 150mm)</option>
                  <option value="NSR10_COLOMBIA">Curva NSR-10 / ASOCRETO</option>
                  <option value="ASTM_POLYNOMIAL">Modelo ASTM C805</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Notas Generales de la Obra
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Objetivos del estudio, especificaciones de la mezcla de concreto..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-600/30 transition"
            >
              <Save className="h-4 w-4" />
              <span>{initialData ? 'Actualizar Proyecto' : 'Guardar Proyecto'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
