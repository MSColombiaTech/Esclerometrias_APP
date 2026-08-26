import React, { useState } from 'react';
import { SclerometryTest, TestPhoto } from '../types';
import { Camera, Eye, Download, X, Calendar, Tag } from 'lucide-react';

interface PhotoGalleryProps {
  tests: SclerometryTest[];
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ tests }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<{
    photo: TestPhoto;
    test: SclerometryTest;
  } | null>(null);
  const [filterElement, setFilterElement] = useState<string>('ALL');

  // Collect all photos with their test reference
  const allPhotosWithTests: { photo: TestPhoto; test: SclerometryTest }[] = [];
  tests.forEach(test => {
    if (test.photos && test.photos.length > 0) {
      test.photos.forEach(photo => {
        allPhotosWithTests.push({ photo, test });
      });
    }
  });

  const filtered = filterElement === 'ALL'
    ? allPhotosWithTests
    : allPhotosWithTests.filter(item => item.test.elementTag === filterElement);

  const uniqueElements = Array.from(new Set(allPhotosWithTests.map(p => p.test.elementTag)));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-sky-400" />
            Registro Fotográfico de Campo ({allPhotosWithTests.length} fotos)
          </h3>
          <p className="text-xs text-slate-400">
            Evidencia visual de zonas de impacto, preparación superficial y elementos ensayados
          </p>
        </div>

        {/* Filter by Element */}
        {uniqueElements.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Tag className="h-4 w-4 text-slate-400" />
            <select
              value={filterElement}
              onChange={(e) => setFilterElement(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">Todos los elementos ({allPhotosWithTests.length})</option>
              {uniqueElements.map(el => (
                <option key={el} value={el}>Elemento {el}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Photos Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(({ photo, test }, idx) => (
            <div
              key={`${test.id}-${photo.id}-${idx}`}
              className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 hover:border-slate-600 transition shadow-lg flex flex-col justify-between"
            >
              <div 
                className="relative h-48 overflow-hidden cursor-pointer"
                onClick={() => setSelectedPhoto({ photo, test })}
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.caption || `Foto ${test.elementTag}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <div className="p-2 rounded-full bg-slate-900/80 text-white">
                    <Eye className="h-5 w-5" />
                  </div>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur border border-slate-700">
                    {test.elementTag}
                  </span>
                </div>
              </div>

              {/* Photo Caption / Meta */}
              <div className="p-3 bg-slate-900 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white truncate">{test.elementType}</span>
                  <span className="font-mono text-brand-400 font-bold">{test.estimatedFcMpa} MPa</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{test.levelAxis}</p>
                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(photo.timestamp).toLocaleDateString('es-CO')}
                  </span>
                  <a
                    href={photo.dataUrl}
                    download={`Foto_${test.elementTag}_${new Date(photo.timestamp).toISOString().slice(0, 10)}.jpg`}
                    className="text-slate-400 hover:text-white"
                    title="Descargar foto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
          <Camera className="h-8 w-8 mx-auto text-slate-500" />
          <p className="text-sm font-semibold text-slate-300">No hay fotos en este proyecto o elemento</p>
          <p className="text-xs">
            Al registrar o editar un ensayo, usa la opción "Tomar / Subir Foto" para adjuntar evidencias.
          </p>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <span>Elemento: {selectedPhoto.test.elementTag} ({selectedPhoto.test.elementType})</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    selectedPhoto.test.status === 'CUMPLE' ? 'bg-emerald-500/20 text-emerald-300' :
                    selectedPhoto.test.status === 'DUDOSO' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {selectedPhoto.test.status}
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedPhoto.test.levelAxis} • {new Date(selectedPhoto.photo.timestamp).toLocaleString('es-CO')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedPhoto.photo.dataUrl}
                  download={`Foto_${selectedPhoto.test.elementTag}.jpg`}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center gap-1.5 transition"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Descargar</span>
                </a>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Big Image */}
            <div className="p-3 bg-slate-950 flex items-center justify-center overflow-auto grow">
              <img
                src={selectedPhoto.photo.dataUrl}
                alt="Foto grande"
                className="max-h-[60vh] w-auto object-contain rounded-lg"
              />
            </div>

            {/* Footer Test Data */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
              <div>
                <span className="text-slate-400">Rebote Corregido: </span>
                <span className="text-white font-bold">{selectedPhoto.test.meanCorrected}</span>
              </div>
              <div>
                <span className="text-slate-400">f'c Estimado: </span>
                <span className="text-brand-400 font-bold">{selectedPhoto.test.estimatedFcMpa} MPa ({selectedPhoto.test.estimatedFcPsi} PSI)</span>
              </div>
              <div>
                <span className="text-slate-400">f'c Diseño: </span>
                <span className="text-slate-300 font-bold">{selectedPhoto.test.fcDesignMpa} MPa</span>
              </div>
              <div>
                <span className="text-slate-400">Cumplimiento: </span>
                <span className="text-emerald-400 font-bold">{selectedPhoto.test.complianceRatio}%</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
