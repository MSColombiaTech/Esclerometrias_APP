import { Project, SclerometryTest } from '../types';

export async function fetchProjectsFromCloud(token: string): Promise<Project[] | null> {
  try {
    const res = await fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.projects && Array.isArray(data.projects)) {
      return data.projects.map((p: any) => ({
        id: p.id,
        code: p.code || '',
        name: p.name,
        client: p.client || '',
        location: p.location || '',
        municipality: p.municipality || 'Bogotá D.C.',
        department: p.department || 'Cundinamarca',
        contractor: p.contractor || '',
        supervision: p.supervision || '',
        engineerInCharge: p.engineerInCharge || '',
        licenseNumber: p.licenseNumber || '',
        defaultHammerModel: p.defaultHammerModel || 'Schmidt Tipo N',
        defaultHammerSerial: p.defaultHammerSerial || '',
        defaultCurve: p.defaultCurve || 'PROCEQ_N_STANDARD',
        notes: p.notes || '',
        createdAt: p.createdAt ? new Date(p.createdAt).getTime() : Date.now(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt).getTime() : Date.now(),
      }));
    }
    return null;
  } catch (e) {
    console.warn('Failed to fetch projects from Cloud SQL:', e);
    return null;
  }
}

export async function saveProjectToCloud(project: Project, token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(project)
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to save project to Cloud SQL:', e);
    return false;
  }
}

export async function deleteProjectFromCloud(projectId: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to delete project from Cloud SQL:', e);
    return false;
  }
}

export async function fetchTestsFromCloud(token: string): Promise<SclerometryTest[] | null> {
  try {
    const res = await fetch('/api/tests', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.tests && Array.isArray(data.tests)) {
      return data.tests.map((t: any) => ({
        id: t.id,
        projectId: t.projectId,
        elementTag: t.elementTag,
        elementType: t.elementType,
        levelAxis: t.levelAxis || '',
        fcDesignMpa: Number(t.fcDesignMpa) || 21,
        fcDesignPsi: Number(t.fcDesignPsi) || 3000,
        concreteAgeDays: Number(t.concreteAgeDays) || 28,
        hammerModel: t.hammerModel || 'Schmidt Tipo N',
        hammerSerial: t.hammerSerial || '',
        impactAngle: Number(t.impactAngle) || 0,
        surfaceCondition: t.surfaceCondition || 'Pulido con piedra Carborundum',
        carbonationDepthMm: Number(t.carbonationDepthMm) || 0,
        curveModel: t.curveModel || 'PROCEQ_N_STANDARD',
        customCurveParams: t.customCurveParams || undefined,
        readings: Array.isArray(t.readings) ? t.readings : [],
        excludedIndices: Array.isArray(t.excludedIndices) ? t.excludedIndices : [],
        meanRaw: Number(t.meanRaw) || 0,
        correctionAngle: Number(t.correctionAngle) || 0,
        meanCorrected: Number(t.meanCorrected) || 0,
        stdDev: Number(t.stdDev) || 0,
        cov: Number(t.cov) || 0,
        estimatedFcMpa: Number(t.estimatedFcMpa) || 0,
        estimatedFcKgcm2: Number(t.estimatedFcKgcm2) || 0,
        estimatedFcPsi: Number(t.estimatedFcPsi) || 0,
        complianceRatio: Number(t.complianceRatio) || 0,
        status: t.status || 'DIAGNOSTICO',
        statusNotes: t.statusNotes || '',
        photos: Array.isArray(t.photos) ? t.photos : [],
        notes: t.notes || '',
        operatorName: t.operatorName || '',
        createdAt: t.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
        updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now(),
      }));
    }
    return null;
  } catch (e) {
    console.warn('Failed to fetch tests from Cloud SQL:', e);
    return null;
  }
}

export async function saveTestToCloud(test: SclerometryTest, token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(test)
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to save test to Cloud SQL:', e);
    return false;
  }
}

export async function deleteTestFromCloud(testId: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/tests/${testId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to delete test from Cloud SQL:', e);
    return false;
  }
}
