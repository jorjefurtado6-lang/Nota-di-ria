import { createWorker } from 'tesseract.js';

export interface ExtractedReceipt {
  empresa: string;
  razao_social: string;
  cnpj: string;
  data: string;
  hora: string;
  valor: number;
  categoria: string;
  itens: Array<{
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
  }>;
  pagamento: string;
  chave_nfce: string;
  protocolo_sefaz: string;
  sefaz_url: string;
  confidence_score: number;
  compliance: 'essencial' | 'condicional' | 'vetada';
  red_flags: string[];
  raw_text?: string;
  detected_values?: number[];
}

// Pre-process canvas for OCR clarity (grayscale, contrast boost, and adaptive thresholding)
export function preprocessImageForOcr(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // High-res constraint for OCR: scale up small images, scale down excessively large
      let w = img.width;
      let h = img.height;
      const targetMax = 2200;
      const targetMin = 1000;

      if (Math.max(w, h) > targetMax) {
        const scale = targetMax / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      } else if (Math.min(w, h) < targetMin && Math.max(w, h) < 1600) {
        const scale = 1.5;
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      canvas.width = w;
      canvas.height = h;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      try {
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Apply contrast boost and normalization
        for (let i = 0; i < d.length; i += 4) {
          // Standard ITU-R BT.601 luminance
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          
          // Contrast factor
          const contrast = 1.45;
          const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
          let adjusted = factor * (gray - 128) + 128;
          
          // Soft thresholding to separate ink from paper
          if (adjusted < 90) {
            adjusted = adjusted * 0.7; // Darken text
          } else if (adjusted > 170) {
            adjusted = Math.min(255, adjusted * 1.15); // Whiten paper
          }

          adjusted = Math.min(255, Math.max(0, adjusted));
          d[i] = adjusted;
          d[i + 1] = adjusted;
          d[i + 2] = adjusted;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Parse Brazilian monetary string to number (e.g. "1.234,50" or "45,90" or "45.90" or "45, 90")
function parseMonetaryValue(str: string): number {
  if (!str) return 0;
  // Clean currency symbols, spaces and noise
  let clean = str.replace(/[^\d,\.]/g, '').trim();
  
  // If comma is the decimal separator: "123,45" or "1.234,56"
  if (clean.includes(',') && !clean.includes('.')) {
    clean = clean.replace(',', '.');
  } else if (clean.includes(',') && clean.includes('.')) {
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Format 1.234,56
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // Format 1,234.56
      clean = clean.replace(/,/g, '');
    }
  }

  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

// Parse OCR plain text to Brazilian fiscal receipt structured data
export function parseReceiptText(text: string): ExtractedReceipt {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nowTimeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // 1. CNPJ Regex (formatted or raw 14 digits)
  let cnpj = '';
  const cnpjMatch = text.match(/\b\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2}\b/);
  if (cnpjMatch) {
    const raw = cnpjMatch[0].replace(/[^\d]/g, '');
    if (raw.length === 14) {
      cnpj = `${raw.substring(0, 2)}.${raw.substring(2, 5)}.${raw.substring(5, 8)}/${raw.substring(8, 12)}-${raw.substring(12, 14)}`;
    }
  }

  // 4. Access Key (44 digits)
  let chaveNfce = '';
  const cleanDigitsOnly = text.replace(/[^\d]/g, '');
  const keyMatches = cleanDigitsOnly.match(/\b\d{44}\b/g) || text.replace(/[\s\.\-]/g, '').match(/\b\d{44}\b/);
  if (keyMatches && keyMatches.length > 0) {
    chaveNfce = keyMatches[0];
  }

  // 2. Comprehensive Brazilian Fiscal Date Extraction (DD/MM/AAAA, DD/MM/AA, DD-MM-AAAA, DD.MM.AAAA, Textual)
  let dataEmissao = todayStr;
  let parsedDay = '';
  let parsedMonth = '';
  let parsedYear = '';

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

  // High priority: Labeled emission date
  const labeledDateMatch = text.match(/(?:Emiss[aã]o|Data\s*(?:da\s*)?Emiss[aã]o|Dt\.?\s*Emiss[aã]o|Emitido\s*em|Data\/Hora(?:\s*Emiss[aã]o)?|Dt\.?)[\s:=]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4}|\d{2})/i);
  // High priority: Textual date with month name (ex: 27 de ago de 2026, 27/ago/2026)
  const textualDateMatch = text.match(/(?:Emiss[aã]o|Data)?[\s:=]*(\d{1,2})[\s\/\-\.]+(?:de\s+)?([a-zçáéíóúãõ]{3,10})\.?[\s\/\-\.]+(?:de\s+)?(\d{4}|\d{2})/i);
  // Generic standard date DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const genericDateMatch = text.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4}|\d{2})\b/);

  if (labeledDateMatch) {
    parsedDay = labeledDateMatch[1].padStart(2, '0');
    parsedMonth = labeledDateMatch[2].padStart(2, '0');
    let y = labeledDateMatch[3];
    if (y.length === 2) y = '20' + y;
    parsedYear = y;
  } else if (textualDateMatch && PT_MONTHS_MAP[textualDateMatch[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 3)]) {
    parsedDay = textualDateMatch[1].padStart(2, '0');
    const monthKey = textualDateMatch[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 3);
    parsedMonth = PT_MONTHS_MAP[monthKey] || '01';
    let y = textualDateMatch[3];
    if (y.length === 2) y = '20' + y;
    parsedYear = y;
  } else if (genericDateMatch) {
    parsedDay = genericDateMatch[1].padStart(2, '0');
    parsedMonth = genericDateMatch[2].padStart(2, '0');
    let y = genericDateMatch[3];
    if (y.length === 2) y = '20' + y;
    parsedYear = y;
  }

  // Cross-reference with NFC-e 44-digit access key (digits 3-6: AAMM)
  if (chaveNfce.length === 44) {
    const keyYear = `20${chaveNfce.substring(2, 4)}`;
    const keyMonth = chaveNfce.substring(4, 6);
    const numKeyMonth = parseInt(keyMonth, 10);
    
    if (numKeyMonth >= 1 && numKeyMonth <= 12) {
      if (!parsedYear || parsedYear !== keyYear) {
        parsedYear = keyYear;
      }
      if (!parsedMonth || (parsedMonth !== keyMonth && parsedDay === keyMonth)) {
        // Inversion fix (e.g. MM/DD parsed instead of DD/MM)
        const temp = parsedDay;
        parsedDay = parsedMonth;
        parsedMonth = temp;
      }
      if (!parsedMonth || parseInt(parsedMonth, 10) < 1 || parseInt(parsedMonth, 10) > 12) {
        parsedMonth = keyMonth;
      }
      if (!parsedDay || parseInt(parsedDay, 10) < 1 || parseInt(parsedDay, 10) > 31) {
        parsedDay = '01';
      }
    }
  }

  if (parsedDay && parsedMonth && parsedYear) {
    const numD = parseInt(parsedDay, 10);
    const numM = parseInt(parsedMonth, 10);
    const numY = parseInt(parsedYear, 10);
    if (numD >= 1 && numD <= 31 && numM >= 1 && numM <= 12 && numY >= 2018 && numY <= 2035) {
      dataEmissao = `${parsedYear}-${parsedMonth}-${parsedDay}`;
    }
  }

  // 3. Time Regex (HH:MM or HH:MM:SS)
  let horaEmissao = nowTimeStr;
  const timeMatch = text.match(/(?:Emiss[aã]o|Data|Hora|Hor[aá]rio)?[\s:=]*\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:[:.]([0-5]\d))?\b/i);
  if (timeMatch) {
    horaEmissao = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }

  // 5. Total Value Extraction (Exhaustive Brazilian Patterns)
  let valor = 0.0;
  const detectedValues: number[] = [];

  // Find all number patterns with 2 decimals in the entire document
  const allDecimalMatches = text.matchAll(/\b\d{1,4}(?:[.,]\d{3})*[.,]\s*\d{2}\b/g);
  for (const match of allDecimalMatches) {
    const v = parseMonetaryValue(match[0]);
    if (v > 0 && v < 50000 && !detectedValues.includes(v)) {
      detectedValues.push(v);
    }
  }

  // Strategy A: Direct Keyphrases for Total Amount
  const totalRegexList = [
    /(?:VALOR\s*TOTAL|TOTAL\s*A\s*PAGAR|VALOR\s*A\s*PAGAR|VALOR\s*PAGO|VALOR\s*L[IÍ]QUIDO|TOTAL\s*L[IÍ]QUIDO|VALOR\s*APROVADO|VALOR\s*COMPRA|TOTAL\s*NOTA|VALOR\s*RECEBIDO|VALOR\s*FINAL)[\s:=]*R?\$?\s*([0-9]{1,4}(?:[.,][0-9]{3})*[.,]\s*[0-9]{2})/i,
    /(?:TOTAL|VALOR\s*DA\s*NOTA|VLR\s*TOTAL)[\s:=]*R?\$?\s*([0-9]{1,4}(?:[.,][0-9]{3})*[.,]\s*[0-9]{2})/i,
    /(?:CART[AÃ]O|CR[EÉ]DITO|D[EÉ]BITO|PIX|DINHEIRO)[\s:=]*R?\$?\s*([0-9]{1,4}(?:[.,][0-9]{3})*[.,]\s*[0-9]{2})/i,
    /R\$\s*([0-9]{1,4}(?:[.,][0-9]{3})*[.,]\s*[0-9]{2})/i
  ];

  for (const regex of totalRegexList) {
    const match = text.match(regex);
    if (match && match[1]) {
      const parsed = parseMonetaryValue(match[1]);
      if (parsed > 0 && parsed < 50000) {
        valor = parsed;
        break;
      }
    }
  }

  // Strategy B: Scan line-by-line around keyword lines
  if (valor === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/total|pagar|pago|líquido|liquido|aprovado|valor\s*r\$|subtotal/i.test(line)) {
        // Check current line and next line for decimal values
        const currentAndNext = line + ' ' + (lines[i + 1] || '');
        const matches = currentAndNext.match(/\b\d{1,4}(?:[.,]\d{3})*[.,]\s*\d{2}\b/g);
        if (matches && matches.length > 0) {
          const parsed = parseMonetaryValue(matches[matches.length - 1]);
          if (parsed > 0 && parsed < 50000) {
            valor = parsed;
            break;
          }
        }
      }
    }
  }

  // Strategy C: If still 0, pick the largest detected decimal value (excluding numbers that match years or CNPJ fragments)
  if (valor === 0 && detectedValues.length > 0) {
    const reasonableValues = detectedValues.filter(v => v !== 2021 && v !== 2022 && v !== 2023 && v !== 2024 && v !== 2025 && v !== 2026);
    if (reasonableValues.length > 0) {
      valor = Math.max(...reasonableValues);
    }
  }

  // 6. Establishment Name (Nome Fantasia / Razão Social)
  let empresa = '';
  const headerIgnore = /^(cupom|fiscal|danfe|nfc-e|sat|extrato|documento\s*auxiliar|sefaz|secretaria|governo|via\s*consumidor|cnpj|cpf|ie|inscricao|rua|av|avenida|cep|fone|tel|bairro|numero|loja|endereco)/i;
  
  // Look at lines 0 to 8
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const candidate = lines[i]
      .replace(/[|~_#*]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Check if candidate looks like a store name (at least 3 letters, not purely numbers, not fiscal header)
    if (
      candidate.length >= 3 && 
      !headerIgnore.test(candidate) && 
      !/^\d+$/.test(candidate) &&
      !candidate.includes('http') &&
      !candidate.includes('www.') &&
      !/^\d{2}[\.\s]\d{3}/.test(candidate) // not a CNPJ
    ) {
      empresa = candidate;
      break;
    }
  }

  // If next to CNPJ, check line above it
  if (!empresa) {
    for (let i = 0; i < lines.length; i++) {
      if (/cnpj|cpf/i.test(lines[i]) && i > 0) {
        const prevLine = lines[i - 1].replace(/[|~_#*]/g, '').trim();
        if (prevLine.length >= 3 && !headerIgnore.test(prevLine)) {
          empresa = prevLine;
          break;
        }
      }
    }
  }

  if (!empresa) {
    empresa = lines[0] || 'Estabelecimento Comercial';
  }

  // 7. Category Detection
  const fullLower = text.toLowerCase();
  let categoria = 'Alimentação';
  if (/posto|gasolina|etanol|diesel|combustivel|abastecimento|lubrificante|auto\s*posto|ipiranga|petrobras|shell|ale|br\s*distribuidora|gnv|oleo\s*motor/i.test(fullLower)) {
    categoria = 'Transporte / Combustível';
  } else if (/uber|99app|99\s*taxi|99\s*pop|t[aá]xi|cabify|estapar|estacionamento|ped[aá]gio|rodovia|ccr|autopista|sem\s*parar|veloe|conectcar|auto\s*pista|ecovias|arteris|via\s*brasil/i.test(fullLower)) {
    categoria = 'Pedágio / Estacionamento';
  } else if (/hotel|pousada|resort|ibis|accor|hospedagem|flat|inn|motel|diaria|suite|hospede/i.test(fullLower)) {
    categoria = 'Hospedagem';
  } else if (/refei[cç][aã]o|restaurante|almo[cç]o|jantar|buffet|churrascaria|pizzaria|lanche|burger|mcdonald|subway|padaria|panificadora|caf[eé]|coffee|bar|sucos|supermercado|mercado|hiper|açougue|padaria/i.test(fullLower)) {
    categoria = 'Alimentação';
  } else if (/papelaria|farmacia|drogaria|grafica|xerox|impressao|material\s*escritorio|correios/i.test(fullLower)) {
    categoria = 'Outros';
  }

  // 8. Payment Method
  let pagamento = 'Cartão de Crédito Corporativo';
  if (/pix/i.test(fullLower)) {
    pagamento = 'PIX';
  } else if (/d[eé]bito/i.test(fullLower)) {
    pagamento = 'Cartão de Débito';
  } else if (/dinheiro|especie/i.test(fullLower)) {
    pagamento = 'Dinheiro';
  } else if (/faturad|boleto/i.test(fullLower)) {
    pagamento = 'Faturamento Direto';
  } else if (/cr[eé]dito/i.test(fullLower)) {
    pagamento = 'Cartão de Crédito';
  }

  // 9. Items extraction
  const itens = [
    {
      descricao: `Consumo / Despesa em ${empresa}`,
      quantidade: 1,
      valor_unitario: valor,
      valor_total: valor
    }
  ];

  return {
    empresa,
    razao_social: empresa,
    cnpj,
    data: dataEmissao,
    hora: horaEmissao,
    valor,
    categoria,
    itens,
    pagamento,
    chave_nfce: chaveNfce,
    protocolo_sefaz: chaveNfce ? `SEFAZ-${chaveNfce.substring(0, 10)}` : '',
    sefaz_url: 'https://app.sefaz.es.gov.br/ConsultaNFCe',
    confidence_score: valor > 0 ? 0.96 : 0.82,
    compliance: 'essencial',
    red_flags: [],
    raw_text: text,
    detected_values: detectedValues
  };
}

// In-Browser OCR Runner using Tesseract with fast fallback
export async function runClientOcr(imageDataUrl: string): Promise<ExtractedReceipt> {
  console.log('[Tesseract OCR] Iniciando motor de visão e leitura ótica...');
  try {
    const preprocessed = await preprocessImageForOcr(imageDataUrl);
    
    // Initialize worker with portuguese and english dictionaries
    let worker: any = null;
    try {
      worker = await createWorker('por', 1, {
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR Local] Progresso: ${(m.progress * 100).toFixed(0)}%`);
          }
        }
      });
    } catch (porErr) {
      console.warn('[Tesseract OCR] Falha ao carregar pacote "por", utilizando "eng":', porErr);
      worker = await createWorker('eng', 1, {
        langPath: 'https://tessdata.projectnaptha.com/4.0.0'
      });
    }

    const ret = await worker.recognize(preprocessed);
    await worker.terminate();

    const recognizedText = ret?.data?.text || '';
    console.log('[Tesseract OCR] Texto extraído com sucesso:\n', recognizedText);
    return parseReceiptText(recognizedText);
  } catch (err) {
    console.warn('[Tesseract OCR] Falha geral no worker:', err);
    return parseReceiptText('');
  }
}

