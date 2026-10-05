/**
 * Brazilian Date Formatting & Parsing Utilities (DD/MM/AAAA)
 */

const PT_MONTHS_MAP: Record<string, string> = {
  'jan': '01', 'janeiro': '01',
  'fev': '02', 'fevereiro': '02',
  'mar': '03', 'marco': '03', 'março': '03',
  'abr': '04', 'abril': '04',
  'mai': '05', 'maio': '05',
  'jun': '06', 'junho': '06',
  'jul': '07', 'julho': '07',
  'ago': '08', 'agosto': '08',
  'set': '09', 'setembro': '09',
  'out': '10', 'outubro': '10',
  'nov': '11', 'novembro': '11',
  'dez': '12', 'dezembro': '12'
};

/**
 * Formats any date string (ISO 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ss', timestamp, or 'DD/MM/YYYY')
 * into the standard Brazilian format 'DD/MM/AAAA'.
 */
export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '-';
  const clean = dateStr.trim();
  if (!clean) return '-';

  // Already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean;
  }

  // DD/MM/YY (2 digit year)
  const brMatch2d = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
  if (brMatch2d) {
    const day = brMatch2d[1].padStart(2, '0');
    const month = brMatch2d[2].padStart(2, '0');
    const year = `20${brMatch2d[3]}`;
    return `${day}/${month}/${year}`;
  }

  // DD-MM-YYYY or DD.MM.YYYY or DD/MM/YYYY
  const brMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3];
    return `${day}/${month}/${year}`;
  }

  // YYYY-MM-DD (ISO date)
  const isoMatch = clean.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  // Textual date in Portuguese: "26 de jul. de 2023" or "26 de julho de 2026"
  const textMatch = clean.match(/(\d{1,2})\s+(?:de\s+)?([a-zçáéíóúãõ]+)\.?\s+(?:de\s+)?(\d{4}|\d{2})/i);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const monthKey = textMatch[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 3);
    const month = PT_MONTHS_MAP[monthKey] || '01';
    let year = textMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${day}/${month}/${year}`;
  }

  // Fallback to JS Date parser if valid
  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    // Ignore error and return fallback
  }

  return clean;
}

/**
 * Formats date and time into 'DD/MM/AAAA às HH:MM'
 */
export function formatDateTimeBR(dateStr?: string | null, timeStr?: string | null): string {
  const dateFormatted = formatDateBR(dateStr);
  if (dateFormatted === '-') return '-';

  const cleanTime = (timeStr || '').trim();
  if (cleanTime) {
    const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      return `${dateFormatted} às ${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }
    return `${dateFormatted} às ${cleanTime}`;
  }

  return dateFormatted;
}

/**
 * Formats a date range into 'DD/MM/AAAA até DD/MM/AAAA'
 */
export function formatPeriodBR(startStr?: string | null, endStr?: string | null): string {
  const start = formatDateBR(startStr);
  const end = formatDateBR(endStr);
  if (start === '-' && end === '-') return '-';
  if (start === '-') return `Até ${end}`;
  if (end === '-') return `A partir de ${start}`;
  return `${start} até ${end}`;
}

/**
 * Converts any date representation ('DD/MM/AAAA', '26 de jul. de 2023', 'DD/MM/YY' or ISO)
 * into standard ISO 'YYYY-MM-DD' for HTML input[type="date"] and database persistence.
 */
export function toIsoDate(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date().toISOString().split('T')[0];
  }
  const clean = dateStr.trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // If DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const brMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3];
    return `${year}-${month}-${day}`;
  }

  // If DD/MM/YY (2 digit year)
  const brMatch2d = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
  if (brMatch2d) {
    const day = brMatch2d[1].padStart(2, '0');
    const month = brMatch2d[2].padStart(2, '0');
    const year = `20${brMatch2d[3]}`;
    return `${year}-${month}-${day}`;
  }

  // If ISO with time
  const isoMatch = clean.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Textual date in Portuguese (e.g. "26 de jul. de 2023", "27 de agosto de 2026")
  const textMatch = clean.match(/(\d{1,2})\s+(?:de\s+)?([a-zçáéíóúãõ]+)\.?\s+(?:de\s+)?(\d{4}|\d{2})/i);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const monthKey = textMatch[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 3);
    const month = PT_MONTHS_MAP[monthKey] || '01';
    let year = textMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Ignore error
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Today's date in Brazilian format 'DD/MM/AAAA'
 */
export function todayBrDate(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
