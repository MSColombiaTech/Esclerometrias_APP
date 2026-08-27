/**
 * Configuración corporativa para el formato de informe LPS Ingeniería S.A.S.
 * Las variables se obtienen de .env (VITE_LPS_*) para mantener la privacidad y personalización.
 */

export interface LPSConfig {
  companyName: string;
  companySubtitle: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  engineerName: string;
  licenseNumber: string;
}

export function getLPSConfig(): LPSConfig {
  const env = (import.meta as any).env || {};

  return {
    companyName: env.VITE_LPS_COMPANY_NAME || 'LPS INGENIERÍA S.A.S.',
    companySubtitle: env.VITE_LPS_COMPANY_SUBTITLE || 'LPS INGENIERÍA ESTRUCTURAL',
    address: env.VITE_LPS_ADDRESS || 'CALLE 5 No. 4-35, Centro, Mosquera (Cundinamarca).',
    phone: env.VITE_LPS_PHONE || 'Cel. 3167349923',
    email: env.VITE_LPS_EMAIL || 'fredy.piraquive@lpscol.com',
    city: env.VITE_LPS_CITY || 'MOSQUERA, CUNDINAMARCA',
    engineerName: env.VITE_LPS_ENGINEER_NAME || 'Ing. Fredy Piraquive',
    licenseNumber: env.VITE_LPS_LICENSE_NUMBER || 'TP 25202-31673 CND'
  };
}
