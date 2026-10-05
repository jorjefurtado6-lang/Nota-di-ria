// SEFAZ State Codes and Official Consultation Portals for NFC-e / NF-e
export interface SefazPortalInfo {
  uf: string;
  stateName: string;
  url: string;
  name: string;
  isNational?: boolean;
}

export const SEFAZ_UF_MAP: Record<string, { uf: string; stateName: string; url: string; name: string }> = {
  '11': { uf: 'RO', stateName: 'Rondônia', url: 'https://www.sefin.ro.gov.br/nfce', name: 'SEFIN-RO' },
  '12': { uf: 'AC', stateName: 'Acre', url: 'https://sefaznet.ac.gov.br/nfce/consulta', name: 'SEFAZ-AC' },
  '13': { uf: 'AM', stateName: 'Amazonas', url: 'https://sistemas.sefaz.am.gov.br/nfceweb/consultarNFCe.jsp', name: 'SEFAZ-AM' },
  '14': { uf: 'RR', stateName: 'Roraima', url: 'https://portalnfe.sefaz.rr.gov.br/', name: 'SEFAZ-RR' },
  '15': { uf: 'PA', stateName: 'Pará', url: 'https://appnfc.sefa.pa.gov.br/portal/view/consultas/nfce/consultanfce.faces', name: 'SEFA-PA' },
  '16': { uf: 'AP', stateName: 'Amapá', url: 'https://www.sefaz.ap.gov.br/', name: 'SEFAZ-AP' },
  '17': { uf: 'TO', stateName: 'Tocantins', url: 'http://apps.sefaz.to.gov.br/portal-servicos/', name: 'SEFAZ-TO' },
  '21': { uf: 'MA', stateName: 'Maranhão', url: 'https://sistemas1.sefaz.ma.gov.br/nfce/consulta', name: 'SEFAZ-MA' },
  '22': { uf: 'PI', stateName: 'Piauí', url: 'https://web.sefaz.pi.gov.br/nfceweb/consultarNFCe.jsf', name: 'SEFAZ-PI' },
  '23': { uf: 'CE', stateName: 'Ceará', url: 'http://nfce.sefaz.ce.gov.br/pages/ShowNFCe.html', name: 'SEFAZ-CE' },
  '24': { uf: 'RN', stateName: 'Rio Grande do Norte', url: 'https://nfce.set.rn.gov.br/consultarNFCe.aspx', name: 'SET-RN' },
  '25': { uf: 'PB', stateName: 'Paraíba', url: 'https://www.sefaz.pb.gov.br/nfce/consulta', name: 'SEFAZ-PB' },
  '26': { uf: 'PE', stateName: 'Pernambuco', url: 'http://nfce.sefaz.pe.gov.br/nfce-web/consultarNFCe', name: 'SEFAZ-PE' },
  '27': { uf: 'AL', stateName: 'Alagoas', url: 'http://nfce.sefaz.al.gov.br/consultaNFCe.aspx', name: 'SEFAZ-AL' },
  '28': { uf: 'SE', stateName: 'Sergipe', url: 'http://www.nfe.se.gov.br/portal/consultarNFCe.jsp', name: 'SEFAZ-SE' },
  '29': { uf: 'BA', stateName: 'Bahia', url: 'http://nfe.sefaz.ba.gov.br/servicos/nfce/default.aspx', name: 'SEFAZ-BA' },
  '31': { uf: 'MG', stateName: 'Minas Gerais', url: 'http://nfce.fazenda.mg.gov.br/portalnfce/sistema/consultaarg.xhtml', name: 'SEF-MG' },
  '32': { uf: 'ES', stateName: 'Espírito Santo', url: 'https://app.sefaz.es.gov.br/ConsultaNFCe', name: 'SEFAZ-ES' },
  '33': { uf: 'RJ', stateName: 'Rio de Janeiro', url: 'http://www4.fazenda.rj.gov.br/consultaNFCe/', name: 'SEFAZ-RJ' },
  '35': { uf: 'SP', stateName: 'São Paulo', url: 'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaPublica.aspx', name: 'SEFAZ-SP' },
  '41': { uf: 'PR', stateName: 'Paraná', url: 'http://www.fazenda.pr.gov.br/nfce/consulta', name: 'SEFA-PR' },
  '42': { uf: 'SC', stateName: 'Santa Catarina', url: 'http://sat.sef.sc.gov.br/nfce/consulta', name: 'SEF-SC' },
  '43': { uf: 'RS', stateName: 'Rio Grande do Sul', url: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx', name: 'SEFAZ-RS' },
  '50': { uf: 'MS', stateName: 'Mato Grosso do Sul', url: 'http://www.dfe.ms.gov.br/nfce/consulta', name: 'SEFAZ-MS' },
  '51': { uf: 'MT', stateName: 'Mato Grosso', url: 'https://www.sefaz.mt.gov.br/nfce/consultanfce', name: 'SEFAZ-MT' },
  '52': { uf: 'GO', stateName: 'Goiás', url: 'http://www.sefaz.go.gov.br/nfce/consulta', name: 'ECONOMIA-GO' },
  '53': { uf: 'DF', stateName: 'Distrito Federal', url: 'http://dec.fazenda.df.gov.br/ConsultarNFCe.aspx', name: 'SEEC-DF' },
};

export const NATIONAL_NFE_PORTAL: SefazPortalInfo = {
  uf: 'BR',
  stateName: 'Portal Nacional (Receita Federal / SPED)',
  url: 'https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa',
  name: 'Portal Nacional NF-e / SPED',
  isNational: true
};

export const DEFAULT_ES_SEFAZ: SefazPortalInfo = {
  uf: 'ES',
  stateName: 'Espírito Santo',
  url: 'https://app.sefaz.es.gov.br/ConsultaNFCe',
  name: 'SEFAZ-ES'
};

/**
 * Resolves the official SEFAZ consultation portal from a 44-digit NFC-e / NF-e key or default location
 * Automatically intercepts and corrects legacy or incomplete links (such as sefaz.es.gov.br, /nfce/consulta, etc.).
 */
export function getSefazPortalInfo(chaveOrUrl?: string, location?: string): SefazPortalInfo {
  const inputStr = String(chaveOrUrl || '').trim();
  const cleanKey = inputStr.replace(/\D/g, '');

  // 1. If 44-digit key or starts with valid 2-digit UF code
  if (cleanKey.length >= 2) {
    const ufCode = cleanKey.substring(0, 2);
    if (SEFAZ_UF_MAP[ufCode]) {
      return SEFAZ_UF_MAP[ufCode];
    }
  }

  const lower = inputStr.toLowerCase();

  // 2. Intercept and fix any Espírito Santo variants (sefaz.es.gov.br, fazenda.es.gov.br, etc.)
  if (
    lower.includes('es.gov.br') ||
    lower.includes('sefaz.es') ||
    lower.includes('sefaz-es') ||
    lower.includes('espírito santo') ||
    lower.includes('espirito santo')
  ) {
    return DEFAULT_ES_SEFAZ;
  }

  // 3. Match other state portals by URL host or name
  for (const portal of Object.values(SEFAZ_UF_MAP)) {
    try {
      const portalHost = new URL(portal.url).hostname.toLowerCase();
      if (lower.includes(portalHost) || (portal.uf && lower.includes(portal.uf.toLowerCase()))) {
        return portal;
      }
    } catch {
      // Continue
    }
  }

  // 4. Check location string
  if (location) {
    const locUpper = location.toUpperCase();
    for (const item of Object.values(SEFAZ_UF_MAP)) {
      if (locUpper.includes(item.uf) || locUpper.includes(item.stateName.toUpperCase())) {
        return item;
      }
    }
  }

  // Default to Espírito Santo official consultation portal
  return DEFAULT_ES_SEFAZ;
}

export interface SefazVerificationResult {
  reachable: boolean;
  status: 'online' | 'warning' | 'offline' | 'maintenance' | 'auth_error' | 'not_found' | 'timeout';
  portal: SefazPortalInfo;
  httpStatus?: number;
  latencyMs?: number;
  errorType?: 'NETWORK_UNREACHABLE' | 'AUTH_CERT_ERROR' | 'PORTAL_MAINTENANCE' | 'NOT_FOUND' | 'TIMEOUT' | 'NONE';
  errorMessage?: string;
  userMessage: string;
  troubleshootingHelp: string;
  fallbackUrl: string;
  nationalPortal?: SefazPortalInfo;
}

/**
 * Validates SEFAZ server availability with full try-catch safety against network timeouts or TLS/Auth errors.
 */
export async function checkSefazConnectivity(chaveOrUrl?: string, location?: string): Promise<SefazVerificationResult> {
  const portalInfo = getSefazPortalInfo(chaveOrUrl, location);
  
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('/api/sefaz/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chave_nfce: chaveOrUrl,
        url: portalInfo.url,
        uf: portalInfo.uf
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Servidor retornou código não esperado.`);
    }

    const data = await response.json();
    if (data.success && data.result) {
      return data.result as SefazVerificationResult;
    }

    throw new Error(data.error || 'Resposta inválida do serviço de diagnóstico SEFAZ.');
  } catch (error: any) {
    const isAbort = error?.name === 'AbortError' || error?.message?.includes('aborted');
    return {
      reachable: false,
      status: isAbort ? 'timeout' : 'offline',
      portal: portalInfo,
      httpStatus: isAbort ? 408 : 0,
      latencyMs: 0,
      errorType: isAbort ? 'TIMEOUT' : 'NETWORK_UNREACHABLE',
      errorMessage: error?.message || 'Falha de comunicação de rede ou cliente offline.',
      userMessage: isAbort 
        ? `Tempo limite ao contatar a SEFAZ (${portalInfo.uf}). Os servidores governamentais estão com lentidão.`
        : `Serviço SEFAZ (${portalInfo.uf}) indisponível temporariamente ou inacessível pela rede local.`,
      troubleshootingHelp: 'Você pode abrir o Portal Nacional SPED para consulta pública ou salvar o comprovante com assinatura digital WORM.',
      fallbackUrl: NATIONAL_NFE_PORTAL.url,
      nationalPortal: NATIONAL_NFE_PORTAL
    };
  }
}

