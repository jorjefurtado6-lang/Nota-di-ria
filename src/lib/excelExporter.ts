import * as XLSX from "xlsx";
import { Viagem, Despesa } from "../types";
import { formatDateBR } from "./dateUtils";

export function generateTripExcelReport(viagem: Viagem, despesas: Despesa[]) {
  const dataRows = despesas.map((d) => ({
    "ID Despesa": d.id,
    "Viagem / Projeto": viagem.projeto,
    "Data": formatDateBR(d.data),
    "Hora": d.hora,
    "Estabelecimento": d.empresa,
    "Razão Social": d.razao_social || "",
    "CNPJ": d.cnpj,
    "Categoria": d.categoria,
    "Valor (R$)": d.valor,
    "Forma Pagamento": d.pagamento,
    "Status Aprovação": d.status_aprovacao,
    "Status Compliance": d.compliance,
    "Chave NFC-e": d.chave_nfce || "",
    "Hash SHA-256 (WORM)": d.hash,
    "Red Flags": (d.red_flags || []).join(" | "),
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Despesas");

  // Generate file download
  XLSX.writeFile(workbook, `Relatorio_Despesas_${viagem.projeto.replace(/\s+/g, "_")}.xlsx`);
}
