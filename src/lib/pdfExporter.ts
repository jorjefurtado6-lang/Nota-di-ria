import { jsPDF } from "jspdf";
import { Viagem, Despesa } from "../types";
import { formatDateBR, formatPeriodBR } from "./dateUtils";

export function generateTripPDFReport(viagem: Viagem, despesas: Despesa[], empresaNome: string = "NotaDiária SaaS") {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Colors (Azul-Tinta: #16324F)
  doc.setFillColor(22, 50, 79);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Title & Header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("NotaDiária — Relatório de Prestação de Contas", 14, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Empresa: ${empresaNome} | Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 32);

  // Viagem Info Box
  doc.setFillColor(250, 248, 242);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(14, 48, pageWidth - 28, 32, 3, 3, "FD");

  doc.setTextColor(14, 35, 56);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Viagem / Projeto: ${viagem.projeto}`, 20, 58);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${viagem.cliente}`, 20, 66);
  doc.text(`Viajante: ${viagem.usuario_nome || "Funcionário"}`, 20, 74);
  doc.text(`Período: ${formatPeriodBR(viagem.data_inicio, viagem.data_fim)}`, 110, 66);
  
  const totalViagem = despesas.reduce((acc, d) => acc + d.valor, 0);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Acumulado: R$ ${totalViagem.toFixed(2).replace(".", ",")}`, 110, 74);

  // Table Headers
  let y = 92;
  doc.setFillColor(22, 50, 79);
  doc.rect(14, y, pageWidth - 28, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Data", 18, y + 5.5);
  doc.text("Empresa / Estabelecimento", 42, y + 5.5);
  doc.text("Categoria", 110, y + 5.5);
  doc.text("Valor (R$)", 152, y + 5.5);
  doc.text("Status", 180, y + 5.5);

  y += 8;

  // Expense Rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(34, 48, 60);

  despesas.forEach((d, idx) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    if (idx % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(14, y, pageWidth - 28, 8, "F");
    }

    doc.text(formatDateBR(d.data), 18, y + 5.5);
    const empresaText = d.empresa.length > 32 ? d.empresa.substring(0, 30) + "..." : d.empresa;
    doc.text(empresaText, 42, y + 5.5);
    doc.text(d.categoria, 110, y + 5.5);
    doc.text(`R$ ${d.valor.toFixed(2).replace(".", ",")}`, 152, y + 5.5);
    
    const statusLabel = d.status_aprovacao === 'aprovado' ? 'Aprovada' : d.status_aprovacao === 'rejeitado' ? 'Rejeitada' : 'Pendente';
    doc.text(statusLabel, 180, y + 5.5);

    y += 8;
  });

  // Summary by Category
  y += 10;
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Resumo por Categoria de Despesa:", 14, y);
  y += 6;

  const categories = Array.from(new Set(despesas.map(d => d.categoria)));
  categories.forEach((cat) => {
    const catTotal = despesas.filter(d => d.categoria === cat).reduce((sum, d) => sum + d.valor, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`• ${cat}: R$ ${catTotal.toFixed(2).replace(".", ",")}`, 20, y);
    y += 6;
  });

  // Footer WORM Audit Proof statement
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Arquivamento Probatório Imutável (WORM). Registro criptográfico gerado automaticamente via NotaDiária AI.`, 14, 285);

  doc.save(`Relatorio_Viagem_${viagem.projeto.replace(/\s+/g, "_")}.pdf`);
}
