import { CustomDataPoint } from '../components/CurveViewer';

export interface ChartConfigState {
  unit: 'MPa' | 'PSI';
  showSchmidtDirect: boolean;
  showProceqStandard: boolean;
  showProceqCube: boolean;
  showNsr10Comparison: boolean;
  showAstmComparison: boolean;
  showCustomCurve: boolean;
  customCurveParams: { a: number; b: number };
  showRef21: boolean;
  showRef28: boolean;
  showRef35: boolean;
  customRefMpa: number | '';
  showCustomRef: boolean;
  showProjectTests: boolean;
  statusFilter: 'ALL' | 'CUMPLE' | 'DUDOSO' | 'NO_CUMPLE';
  elementTypeFilter: string;
  excludedTestIds: string[];
  customPoints: CustomDataPoint[];
  showDataControls: boolean;
  activeControlTab: 'curves' | 'projectTests' | 'customPoints' | 'references';
}

const STORAGE_CHART_CONFIG_KEY = 'esclerometria_pro_chart_config_v2';

export const DEFAULT_CHART_CONFIG: ChartConfigState = {
  unit: 'PSI',
  showSchmidtDirect: true,
  showProceqStandard: false,
  showProceqCube: false,
  showNsr10Comparison: true,
  showAstmComparison: false,
  showCustomCurve: false,
  customCurveParams: { a: 0.04, b: 2.05 },
  showRef21: true,
  showRef28: true,
  showRef35: false,
  customRefMpa: '',
  showCustomRef: false,
  showProjectTests: true,
  statusFilter: 'ALL',
  elementTypeFilter: 'ALL',
  excludedTestIds: [],
  customPoints: [
    {
      id: 'cp-01',
      label: 'Núcleo Diamantado Eje 2 (Calibración NTC 3658)',
      rebound: 32,
      fcValue: 3350,
      unit: 'PSI',
      status: 'NUCLEO',
      visible: true,
      notes: 'Probeta testigo ensayada en prensa calibrada'
    }
  ],
  showDataControls: true,
  activeControlTab: 'curves'
};

export function getStoredChartConfig(): ChartConfigState {
  try {
    const raw = localStorage.getItem(STORAGE_CHART_CONFIG_KEY);
    if (!raw) {
      return DEFAULT_CHART_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CHART_CONFIG,
      ...parsed,
      customCurveParams: {
        ...DEFAULT_CHART_CONFIG.customCurveParams,
        ...(parsed.customCurveParams || {})
      },
      customPoints: Array.isArray(parsed.customPoints) ? parsed.customPoints : DEFAULT_CHART_CONFIG.customPoints,
      excludedTestIds: Array.isArray(parsed.excludedTestIds) ? parsed.excludedTestIds : []
    };
  } catch (e) {
    console.error('Error loading chart config from local storage:', e);
    return DEFAULT_CHART_CONFIG;
  }
}

export function saveStoredChartConfig(config: ChartConfigState): void {
  try {
    localStorage.setItem(STORAGE_CHART_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving chart config to local storage:', e);
  }
}

export async function syncChartConfigToCloud(config: ChartConfigState, token: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch('/api/chart-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ settings: config })
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to sync chart settings to Cloud SQL:', e);
    return false;
  }
}

export async function fetchChartConfigFromCloud(token: string): Promise<ChartConfigState | null> {
  try {
    const res = await fetch('/api/chart-settings', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.settings) {
      saveStoredChartConfig(data.settings);
      return data.settings;
    }
    return null;
  } catch (e) {
    console.warn('Failed to fetch chart settings from Cloud SQL:', e);
    return null;
  }
}
