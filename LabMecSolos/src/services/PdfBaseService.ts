import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { jsPDF } from 'jspdf';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

const PDF_TIMEOUT_MS = 15000;
export const PRIMARY_COLOR = '#164194';
export const TEXT_COLOR = '#2c2926';
export const MEDIUM_COLOR = '#898888';
const BORDER_COLOR = '#E0E0E0';
const LIGHT_BG = '#F4F5F8';

function formatarDataHora(): string {
  const agora = new Date();
  return agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function criarCabecalho(titulo: string, subtitulo?: string): Content[] {
  const items: Content[] = [
    { text: 'LabMecSolos', fontSize: 13, bold: true, color: PRIMARY_COLOR, margin: [0, 0, 0, 2] },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: PRIMARY_COLOR }], margin: [0, 2, 0, 8] },
    { text: titulo, fontSize: 18, bold: true, color: TEXT_COLOR, margin: [0, 0, 0, 2] },
  ];

  if (subtitulo) {
    items.push({ text: subtitulo, fontSize: 11, color: MEDIUM_COLOR, margin: [0, 0, 0, 4] });
  }

  items.push(
    { text: `Emitido em: ${formatarDataHora()}`, fontSize: 9, color: MEDIUM_COLOR, margin: [0, 2, 0, 0] },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: BORDER_COLOR }], margin: [0, 6, 0, 0] }
  );

  return items;
}

export function criarTabelaResumo(dados: [string, string][]): any {
  return {
    table: {
      widths: ['*', 'auto'],
      body: dados.map(([label, valor], i) => {
        const bg = i % 2 === 0 ? LIGHT_BG : '#FFFFFF';
        return [
          { text: label, fontSize: 10, color: TEXT_COLOR, margin: [4, 3, 4, 3], fillColor: bg },
          { text: valor, fontSize: 10, bold: true, color: TEXT_COLOR, margin: [4, 3, 4, 3], fillColor: bg, alignment: 'right' },
        ];
      }),
    },
    margin: [0, 4, 0, 0],
  };
}

export function criarTabelaDados(cabecalhos: string[], linhas: string[][]): any {
  return {
    table: {
      headerRows: 1,
      widths: cabecalhos.map(() => '*'),
      body: [
        cabecalhos.map((h) => ({ text: h, fontSize: 9, bold: true, color: '#FFFFFF', fillColor: PRIMARY_COLOR, margin: [4, 3, 4, 3] })),
        ...linhas.map((linha) =>
          linha.map((celula) => ({ text: String(celula), fontSize: 9, color: TEXT_COLOR, margin: [4, 3, 4, 3] }))
        ),
      ],
    },
    margin: [0, 4, 0, 0],
  };
}

export async function gerarPdf(docDefinition: TDocumentDefinitions): Promise<string> {
  const pdfDoc = (pdfMake as any).createPdf(docDefinition, undefined, undefined, vfs) as {
    getDataUrl: (cb: (url: string) => void) => void;
  };

  const dataUrl = await Promise.race([
    new Promise<string>((resolve, reject) => {
      try {
        pdfDoc.getDataUrl((url: string) => {
          if (url) resolve(url);
          else reject(new Error('pdfmake retornou vazio'));
        });
      } catch (e: unknown) { reject(e); }
    }),
    new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout ao gerar PDF')), PDF_TIMEOUT_MS)
    ),
  ]);

  return dataUrl;
}

export async function exportarPDF(dataUrlOrDocDef: string | TDocumentDefinitions, fileName: string): Promise<void> {
  let dataUrl: string;

  if (typeof dataUrlOrDocDef === 'string') {
    dataUrl = dataUrlOrDocDef;
  } else {
    dataUrl = await gerarPdf(dataUrlOrDocDef);
  }

  const isNative = Capacitor.getPlatform() !== 'web';

  if (isNative) {
    const base64 = dataUrl.split(',')[1] || dataUrl;
    try {
      await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });
      try {
        const { FileOpener } = await import('@capawesome-team/capacitor-file-opener');
        await FileOpener.openFile({ path: fileName });
      } catch {}
    } catch {
      await Filesystem.writeFile({
        path: `Download/${fileName}`,
        data: base64,
        directory: Directory.External,
        recursive: true,
      });
    }
  } else {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export function gerarPdfFallback(titulo: string, dados: Record<string, string>): string {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text('LabMecSolos', 14, 20);
  doc.setFontSize(12);
  doc.text(titulo, 14, 32);
  doc.setFontSize(10);
  let y = 48;
  for (const [chave, valor] of Object.entries(dados)) {
    doc.text(`${chave}: ${valor}`, 14, y);
    y += 7;
  }
  doc.setFontSize(8);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, y + 10);
  return doc.output('dataurlstring');
}
