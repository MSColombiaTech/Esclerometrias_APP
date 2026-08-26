import React, { useState, useEffect } from 'react';
import { Project, SclerometryTest, ImpactAngle } from './types';
import { 
  getStoredProjects, 
  saveProjects, 
  getStoredTests, 
  saveTests, 
  getActiveProjectId, 
  setActiveProjectId 
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { ProjectDetail } from './components/ProjectDetail';
import { ProjectList } from './components/ProjectList';
import { ProjectFormModal } from './components/ProjectFormModal';
import { TestFormModal } from './components/TestFormModal';
import { QuickCalculatorModal } from './components/QuickCalculatorModal';
import { NormativeInfoModal } from './components/NormativeInfoModal';
import { ArrowLeft, Plus } from 'lucide-react';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tests, setTests] = useState<SclerometryTest[]>([]);
  const [activeProjectId, setActiveId] = useState<string | null>(null);
  
  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<SclerometryTest | null>(null);
  const [isQuickCalcOpen, setIsQuickCalcOpen] = useState(false);
  const [isNormsOpen, setIsNormsOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    const loadedProjects = getStoredProjects();
    const loadedTests = getStoredTests();
    const activeId = getActiveProjectId();

    setProjects(loadedProjects);
    setTests(loadedTests);
    if (activeId && loadedProjects.some(p => p.id === activeId)) {
      setActiveId(activeId);
    } else if (loadedProjects.length > 0) {
      setActiveId(loadedProjects[0].id);
    }
  }, []);

  const handleRefreshData = () => {
    const loadedProjects = getStoredProjects();
    const loadedTests = getStoredTests();
    setProjects(loadedProjects);
    setTests(loadedTests);
    if (loadedProjects.length > 0) {
      setActiveId(loadedProjects[0].id);
    }
  };

  const handleSelectProject = (id: string) => {
    setActiveId(id);
    setActiveProjectId(id);
  };

  const handleSaveProject = (project: Project) => {
    const index = projects.findIndex(p => p.id === project.id);
    let updated: Project[];
    if (index >= 0) {
      updated = [...projects];
      updated[index] = project;
    } else {
      updated = [project, ...projects];
    }
    setProjects(updated);
    saveProjects(updated);
    setActiveId(project.id);
    setActiveProjectId(project.id);
  };

  const handleDeleteProject = (projectId: string) => {
    const prj = projects.find(p => p.id === projectId);
    if (!prj) return;
    if (confirm(`¿Estás seguro de eliminar el proyecto "${prj.name}" y todos sus ensayos registrados?`)) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      const updatedTests = tests.filter(t => t.projectId !== projectId);
      setProjects(updatedProjects);
      setTests(updatedTests);
      saveProjects(updatedProjects);
      saveTests(updatedTests);
      if (updatedProjects.length > 0) {
        setActiveId(updatedProjects[0].id);
        setActiveProjectId(updatedProjects[0].id);
      } else {
        setActiveId(null);
      }
    }
  };

  const handleSaveTest = (test: SclerometryTest) => {
    const index = tests.findIndex(t => t.id === test.id);
    let updated: SclerometryTest[];
    if (index >= 0) {
      updated = [...tests];
      updated[index] = test;
    } else {
      updated = [test, ...tests];
    }
    setTests(updated);
    saveTests(updated);
  };

  const handleDeleteTest = (testId: string) => {
    if (confirm('¿Deseas eliminar este ensayo de esclerometría?')) {
      const updated = tests.filter(t => t.id !== testId);
      setTests(updated);
      saveTests(updated);
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  const projectTests = activeProjectId ? tests.filter(t => t.projectId === activeProjectId) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onNewProject={() => {
          setEditingProject(null);
          setIsProjectModalOpen(true);
        }}
        onNewTest={() => {
          setEditingTest(null);
          setIsTestModalOpen(true);
        }}
        onOpenCalculator={() => setIsQuickCalcOpen(true)}
        onOpenNorms={() => setIsNormsOpen(true)}
        tests={tests}
        onRefreshData={handleRefreshData}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 grow w-full">
        
        {/* Navigation Breadcrumb / Project Back */}
        {activeProject ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveId(null)}
                className="text-xs text-slate-400 hover:text-brand-400 flex items-center gap-1.5 transition font-semibold"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Ver todos los proyectos de obra</span>
              </button>
            </div>

            {/* Active Project Detail View */}
            <ProjectDetail
              project={activeProject}
              tests={projectTests}
              onEditProject={() => {
                setEditingProject(activeProject);
                setIsProjectModalOpen(true);
              }}
              onDeleteProject={() => handleDeleteProject(activeProject.id)}
              onNewTest={() => {
                setEditingTest(null);
                setIsTestModalOpen(true);
              }}
              onEditTest={(t) => {
                setEditingTest(t);
                setIsTestModalOpen(true);
              }}
              onDeleteTest={handleDeleteTest}
            />
          </div>
        ) : (
          /* Project List Directory */
          <ProjectList
            projects={projects}
            tests={tests}
            onSelectProject={handleSelectProject}
            onNewProject={() => {
              setEditingProject(null);
              setIsProjectModalOpen(true);
            }}
          />
        )}

      </main>

      {/* Modals */}
      
      {/* Project Create/Edit Modal */}
      <ProjectFormModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialData={editingProject}
      />

      {/* Test Create/Edit Modal */}
      {activeProject && (
        <TestFormModal
          isOpen={isTestModalOpen}
          onClose={() => {
            setIsTestModalOpen(false);
            setEditingTest(null);
          }}
          onSave={handleSaveTest}
          projectId={activeProject.id}
          initialData={editingTest}
          defaultHammerModel={activeProject.defaultHammerModel}
          defaultHammerSerial={activeProject.defaultHammerSerial}
        />
      )}

      {/* Quick Field Calculator Modal */}
      <QuickCalculatorModal
        isOpen={isQuickCalcOpen}
        onClose={() => setIsQuickCalcOpen(false)}
        onSendToProject={(readings, angle, fcDesign) => {
          if (!activeProject) {
            alert('Por favor selecciona o crea un proyecto primero para asociar el ensayo.');
            return;
          }
          setEditingTest({
            id: '',
            projectId: activeProject.id,
            elementTag: 'ELEM-' + Math.floor(Math.random() * 900 + 100),
            elementType: 'Columna',
            levelAxis: 'En obra',
            fcDesignMpa: fcDesign,
            fcDesignPsi: Math.round(fcDesign * 145.038),
            concreteAgeDays: 28,
            hammerModel: activeProject.defaultHammerModel,
            hammerSerial: activeProject.defaultHammerSerial,
            impactAngle: angle,
            surfaceCondition: 'Pulido con piedra Carborundum',
            carbonationDepthMm: 0,
            curveModel: 'PROCEQ_N_STANDARD',
            readings,
            excludedIndices: [],
            meanRaw: 0,
            correctionAngle: 0,
            meanCorrected: 0,
            stdDev: 0,
            cov: 0,
            estimatedFcMpa: 0,
            estimatedFcKgcm2: 0,
            estimatedFcPsi: 0,
            complianceRatio: 0,
            status: 'CUMPLE',
            statusNotes: '',
            photos: [],
            operatorName: activeProject.engineerInCharge,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          setIsTestModalOpen(true);
        }}
      />

      {/* Normative Reference Modal */}
      <NormativeInfoModal
        isOpen={isNormsOpen}
        onClose={() => setIsNormsOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          Esclerometría PRO Colombia • Control de Calidad en Concreto según Normativa NTC 3692, NSR-10 Capítulo C.5 y ASTM C805.
        </p>
      </footer>

    </div>
  );
};
