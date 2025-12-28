import { BLEPrinter as BLEPrinterOriginal } from 'react-native-thermal-receipt-printer-image-qr';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

const BLEPrinter = BLEPrinterOriginal as any;

export type PrinterType = 'BLE' | 'NATIVE';

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
};

const formatDate = (date: Date) => {
  return date.toLocaleString('pt-BR');
};

export const printTicket = async (
  numbers: number[],
  ticketId: string,
  date: Date,
  amount: string | number,
  gameType: string,
  printerType: PrinterType = 'BLE',
  imageUri?: string,
  possiblePrize?: string
) => {
  try {
    console.log(`Printing ticket: ${ticketId}, Game: ${gameType}, Type: ${printerType}, Image: ${!!imageUri}`);

    // If Image URI is provided and Type is BLE, try printing image first
    if (printerType === 'BLE' && imageUri) {
      try {
        let base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

        // Clean up base64 if it has prefix (FileSystem usually returns raw, but just in safe)
        if (base64.startsWith('data:image')) {
          base64 = base64.split(',')[1];
        }

        console.log(`Printing Image Base64: Length=${base64.length}`);

        // Some printers need a few line feeds before/after
        await BLEPrinter.printText("\n");

        // Try standard width 384 (58mm) and center alignment
        try {
          await BLEPrinter.printImageBase64(base64, { imageWidth: 384, paddingX: 0 });
        } catch (innerErr) {
          console.warn("Standard printImageBase64 failed, making one fallback attempt", innerErr);
          await BLEPrinter.printImageBase64(base64);
        }

        await BLEPrinter.printText("\n\n\n"); // Feed
        return true;
      } catch (imgError) {
        console.warn("Failed to print image FINAL, falling back to text:", imgError);
        // Fallback to text if image fails
      }
    }

    const dateStr = formatDate(date);
    const amountStr = formatCurrency(amount);

    // Determine padding based on game type
    let padLength = 2;
    if (gameType.includes("2x1000") || gameType.includes("MILHAR")) padLength = 4;
    else if (gameType.includes("CENTENA")) padLength = 3;

    // Format numbers like 08 13 16 ... (No brackets, as per image)
    const numbersStr = numbers
      .sort((a, b) => a - b)
      .map(n => n.toString().padStart(padLength, '0'))
      .join('  ');

    // Generate HTML for Native Print
    if (printerType === 'NATIVE') {
      if (imageUri) {
        console.log("Printing Image via Native (System) Printer");
        await Print.printAsync({ uri: imageUri });
        return true;
      }

      const html = `
        <html>
          <head>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 0; padding: 0; text-align: center; width: 58mm; }
              h1 { font-size: 16px; margin: 5px 0; }
              .dashed { border-top: 1px dashed black; margin: 10px 0; }
              .bold { font-weight: bold; }
              .big { font-size: 18px; }
              .left { text-align: left; }
              .flex { display: flex; justify-content: space-between; }
              .footer { font-size: 10px; margin-top: 10px; }
            </style>
          </head>
          <body>
            <h1>Fezinha de Hoje</h1>
            <div>COMPROVANTE DE APOSTA</div>
            <div class="dashed"></div>
            
            <div class="bold big">${gameType.toUpperCase()}</div>
            <div>${dateStr}</div>
            
            <div class="dashed"></div>
            
            <div class="bold big" style="font-size: 24px; letter-spacing: 2px;">
              ${numbersStr.replace(/  /g, ' ')}
            </div>
            
            <div class="dashed"></div>
            
            ${possiblePrize ? `
            <div class="bold">PRÊMIO MÁXIMO</div>
            <div class="bold big">${possiblePrize}</div>
            <div class="dashed"></div>
            ` : ''}
            
            <div class="flex">
              <span class="bold">TOTAL A PAGAR</span>
              <span>${amountStr}</span>
            </div>
            
            <div class="dashed"></div>
            
            <div class="footer">
              <div>Barcode Placeholder</div>
              <div>ID: ${ticketId}</div>
              <br/>
              <div>Este bilhete não possui valor fiscal.</div>
              <div>Boa Sorte!</div>
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({ html });
      return true;
    }

    // BLE Printing Logic (Text Fallback or standard)
    console.log("Available BLEPrinter methods:", Object.keys(BLEPrinter));
    let receipt = "";

    // ESC/POS Commands
    const ESC = "\x1b";
    const GS = "\x1d";
    const INITIALIZE = ESC + "@";
    const CENTER = ESC + "\x61\x01";
    const LEFT = ESC + "\x61\x00";

    // Formatting
    const DOUBLE_WIDTH_HEIGHT = GS + "!" + "\x11";
    const DOUBLE_HEIGHT = GS + "!" + "\x10";
    const NORMAL = GS + "!" + "\x00";
    const BOLD_ON = ESC + "\x45\x01";
    const BOLD_OFF = ESC + "\x45\x00";
    const FONT_B = ESC + "!" + "\x01";
    const FONT_A = ESC + "!" + "\x00";

    // Helper to pad text left/right (Assuming 32 chars specific for 58mm printer)
    const MAX_CHARS = 32;
    const padPair = (left: string, right: string) => {
      let space = MAX_CHARS - left.length - right.length;
      if (space < 1) space = 1;
      return left + " ".repeat(space) + right;
    };

    // Build Receipt
    receipt += INITIALIZE;
    receipt += CENTER;

    // Header
    receipt += DOUBLE_WIDTH_HEIGHT + BOLD_ON + "Fezinha de Hoje" + BOLD_OFF + NORMAL + "\n";
    receipt += CENTER + "COMPROVANTE DE APOSTA\n";

    // Separator
    receipt += "- - - - - - - - - - - - - - - -\n\n"; // Dashed line

    // Game Info
    receipt += DOUBLE_WIDTH_HEIGHT + BOLD_ON + gameType.toUpperCase() + BOLD_OFF + NORMAL + "\n";
    receipt += dateStr + "\n\n";

    // Numbers (Two Columns, Centered)
    const sortedNumbers = numbers.sort((a, b) => a - b);
    const formattedNumbers = sortedNumbers.map(n => n.toString().padStart(padLength, '0'));

    // Chunk into pairs
    for (let i = 0; i < formattedNumbers.length; i += 2) {
      const left = formattedNumbers[i];
      const right = formattedNumbers[i + 1];

      let line = "";
      if (right) {
        // Two numbers:   XX      XX
        line = `${left}      ${right}`;
      } else {
        // Single number:      XX
        line = `${left}`;
      }

      receipt += DOUBLE_HEIGHT + BOLD_ON + line + BOLD_OFF + NORMAL + "\n";
    }
    receipt += "\n";

    // Possible Prize
    if (possiblePrize) {
      receipt += "- - - - - - - - - - - - - - - -\n";
      receipt += BOLD_ON + "PREMIO MAXIMO" + BOLD_OFF + "\n";
      receipt += DOUBLE_WIDTH_HEIGHT + BOLD_ON + possiblePrize + BOLD_OFF + NORMAL + "\n";
    }

    // Price
    receipt += "- - - - - - - - - - - - - - - -\n";
    receipt += LEFT;
    receipt += BOLD_ON + padPair("TOTAL A PAGAR", amountStr) + BOLD_OFF + "\n";

    // Footer Details (Small Font)
    receipt += CENTER; // Center align footer

    // Barcode Simulation (Visual stripes)
    receipt += "\n";
    receipt += "|| ||| || |||| ||| || ||||| ||||\n";
    receipt += FONT_B;
    receipt += `ID: ${ticketId}\n`;
    receipt += "\nEste bilhete não possui valor fiscal.\n";
    receipt += "Boa Sorte!\n";
    receipt += FONT_A;
    receipt += "\n\n\n"; // Feed lines

    // Use printBill if available, otherwise printText
    if (BLEPrinter.printBill) {
      await BLEPrinter.printBill(receipt);
    } else if (BLEPrinter.printText) {
      await BLEPrinter.printText(receipt);
    } else {
      throw new Error("No text printing method found");
    }

    return true;
  } catch (error) {
    console.error("Print error:", error);
    return false;
  }
};

export const formatDailyReport = (
  data: {
    date: Date;
    totalSales: number;
    totalCredits: number;
    totalDebits: number;
    finalBalance: number;
    transactions: any[];
  }
) => {
  const formatDate = (date: Date) => date.toLocaleString('pt-BR');
  const formatCurrency = (val: number) => `R$ ${Number(val).toFixed(2).replace('.', ',')}`;

  const dateStr = formatDate(new Date(data.date));

  // Commands
  const ESC = "\x1b";
  const GS = "\x1d";
  const INITIALIZE = ESC + "@";
  const CENTER = ESC + "\x61\x01";
  const LEFT = ESC + "\x61\x00";
  const BOLD_ON = ESC + "\x45\x01";
  const BOLD_OFF = ESC + "\x45\x00";
  const DOUBLE_WIDTH_HEIGHT = GS + "!" + "\x11";
  const NORMAL = GS + "!" + "\x00";

  const MAX_CHARS = 32;
  const padPair = (left: string, right: string) => {
    let space = MAX_CHARS - left.length - right.length;
    if (space < 1) space = 1;
    return left + " ".repeat(space) + right;
  };

  let receipt = "";
  receipt += INITIALIZE;
  receipt += CENTER;
  receipt += DOUBLE_WIDTH_HEIGHT + BOLD_ON + "FECHAMENTO" + BOLD_OFF + NORMAL + "\n";
  receipt += "RELATORIO DIARIO\n";
  receipt += dateStr + "\n";
  receipt += "- - - - - - - - - - - - - - - -\n\n";

  receipt += LEFT;
  receipt += padPair("VENDAS:", formatCurrency(data.totalSales)) + "\n";
  receipt += padPair("CREDITOS:", formatCurrency(data.totalCredits)) + "\n";
  receipt += padPair("DEBITOS:", formatCurrency(data.totalDebits)) + "\n";
  receipt += "- - - - - - - - - - - - - - - -\n";

  receipt += BOLD_ON;
  receipt += padPair("SALDO FINAL:", formatCurrency(data.finalBalance)) + "\n";
  receipt += BOLD_OFF;
  receipt += "\n";

  if (data.transactions && data.transactions.length > 0) {
    receipt += CENTER + "MOVIMENTACOES\n" + LEFT;
    data.transactions.forEach(t => {
      const symbol = t.type === 'CREDIT' ? '+' : '-';
      receipt += `${symbol} ${t.description.substring(0, 15)} ${formatCurrency(t.amount)}\n`;
    });
    receipt += "\n";
  }

  receipt += CENTER;
  receipt += "\n\n________________________________\n";
  receipt += "Assinatura Cambista\n\n";

  return receipt;
};

export const printDailyReport = async (
  data: {
    date: Date;
    totalSales: number;
    totalCredits: number;
    totalDebits: number;
    finalBalance: number;
    transactions: any[];
  },
  printerType: PrinterType = 'BLE',
  imageUri?: string
) => {
  try {
    const receipt = formatDailyReport(data);

    if (printerType === 'NATIVE') {
      if (imageUri) {
        console.log("Printing Daily Report Image via Native (System) Printer");
        await Print.printAsync({ uri: imageUri });
        return true;
      }

      const html = `
        <html>
          <head>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 0; padding: 0; width: 58mm; }
              h1 { font-size: 16px; text-align: center; margin: 10px 0; }
              h3 { font-size: 14px; text-align: center; margin: 5px 0; }
              .dashed { border-top: 1px dashed black; margin: 5px 0; }
              .bold { font-weight: bold; }
              .flex { display: flex; justify-content: space-between; }
              .center { text-align: center; }
              .item { margin-bottom: 2px; }
            </style>
          </head>
          <body>
            <br/>
            <h1>FECHAMENTO DO CAIXA</h1>
            <h3>RELATÓRIO DIÁRIO</h3>
            <div class="center">${data.date.toLocaleString('pt-BR')}</div>
            <div class="dashed"></div>
            
            <div class="flex item"><span>VENDAS:</span> <span>${Number(data.totalSales).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            <div class="flex item"><span>CRÉDITOS:</span> <span>${Number(data.totalCredits).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            <div class="flex item"><span>DÉBITOS:</span> <span>${Number(data.totalDebits).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            
            <div class="dashed"></div>
            
            <div class="flex bold item"><span>SALDO FINAL:</span> <span>${Number(data.finalBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            
            <br/>
            <div class="dashed"></div>
            <br/>
            <div class="center">Assinatura Cambista</div>
            <br/><br/>
          </body>
        </html>
      `;
      await Print.printAsync({ html });
      return true;
    }

    // BLE Logic
    // If Image URI is provided and Type is BLE, try printing image first
    if (printerType === 'BLE' && imageUri) {
      try {
        let base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

        if (base64.startsWith('data:image')) {
          base64 = base64.split(',')[1];
        }

        console.log(`Printing Daily Report Image Base64: Length=${base64.length}`);

        await BLEPrinter.printText("\n");

        if (BLEPrinter.printImageBase64) {
          try {
            // Try standard width 384 (58mm) which is standard for most portable bluetooth printers
            // Using 576 (80mm) on a 58mm printer often causes vertical stretching or cropping.
            // PaddingX 0 ensures it uses full width.
            await BLEPrinter.printImageBase64(base64, { imageWidth: 384, paddingX: 0 });
          } catch (innerErr) {
            console.warn("Standard printImageBase64 failed, making one fallback attempt", innerErr);
            // Fallback: try with default settings (often assumes 384 anyway)
            await BLEPrinter.printImageBase64(base64);
          }
        } else {
          console.warn("BLEPrinter.printImageBase64 is not available.");
          // Fallback to text
          throw new Error("Generic BL Printer does not support image printing or method missing");
        }

        await BLEPrinter.printText("\n\n\n"); // Feed
        return true;
      } catch (imgError) {
        console.warn("Failed to print image FINAL, falling back to text:", imgError);
        // Fallback to text if image fails
      }
    }

    const receiptWithFeed = receipt + "\n\n\n"; // Feed lines

    if (BLEPrinter.printBill) {
      await BLEPrinter.printBill(receiptWithFeed);
    } else if (BLEPrinter.printText) {
      await BLEPrinter.printText(receiptWithFeed);
    }

    return true;
  } catch (error) {
    console.error("Print Daily Report Error", error);
    return false;
  }
};

export const printSangriaReceipt = async (
  data: {
    date: Date;
    amount: number;
    cambistaName: string;
    cobradorName: string;
    transactionId: string;
  },
  printerType: PrinterType = 'BLE',
  imageUri?: string
) => {
  const formatDate = (date: Date) => date.toLocaleString('pt-BR');
  const formatCurrency = (val: number) => `R$ ${Number(val).toFixed(2).replace('.', ',')}`;

  const dateStr = formatDate(new Date(data.date));

  try {
    // ---------------------------------------------------------
    // IMAGE PRINTING STRATEGY (High Quality, Logo, Styling)
    // ---------------------------------------------------------
    if (imageUri) {
      console.log(`Printing Sangria Image: Type=${printerType}`);

      if (printerType === 'BLE') {
        try {
          let base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
          if (base64.startsWith('data:image')) {
            base64 = base64.split(',')[1];
          }

          console.log(`Printing Sangria Image Base64: Length=${base64.length}`);

          await BLEPrinter.printText("\n");
          try {
            // 384px width for standard 58mm
            await BLEPrinter.printImageBase64(base64, { imageWidth: 384, paddingX: 0 });
          } catch (innerErr) {
            console.warn("Fallback printImageBase64", innerErr);
            await BLEPrinter.printImageBase64(base64);
          }
          await BLEPrinter.printText("\n\n\n");
          return true;
        } catch (imgErr) {
          console.error("Sangria Image Print Failed (BLE)", imgErr);
          // Fallback to text below
        }
      } else {
        // NATIVE
        console.log("Printing Sangria Image via Native System");
        await Print.printAsync({ uri: imageUri });
        return true;
      }
    }

    // ---------------------------------------------------------
    // TEXT/HTML FALLBACK (Old logic)
    // ---------------------------------------------------------

    // ESC/POS Commands
    const ESC = "\x1b";
    const GS = "\x1d";
    const INITIALIZE = ESC + "@";
    const CENTER = ESC + "\x61\x01";
    const LEFT = ESC + "\x61\x00";
    const BOLD_ON = ESC + "\x45\x01";
    const BOLD_OFF = ESC + "\x45\x00";
    const DOUBLE_WIDTH_HEIGHT = GS + "!" + "\x11";
    const DOUBLE_HEIGHT = GS + "!" + "\x10";
    const NORMAL = GS + "!" + "\x00";

    const buildReceipt = (copyName: string, signerLabel: string) => {
      let r = "";
      r += INITIALIZE;
      r += CENTER;
      r += DOUBLE_WIDTH_HEIGHT + BOLD_ON + "SANGRIA / RECOLHIMENTO" + BOLD_OFF + NORMAL + "\n";
      r += dateStr + "\n";
      r += "- - - - - - - - - - - - - - - -\n\n";

      r += LEFT;
      r += `VALOR RECOLHIDO: ${formatCurrency(data.amount)}\n`;
      r += `CAMBISTA: ${data.cambistaName}\n`;
      r += `COBRADOR: ${data.cobradorName}\n`;
      r += `ID: ${data.transactionId.substring(0, 8)}\n`;
      r += "\n";
      r += CENTER;
      r += BOLD_ON + copyName.toUpperCase() + BOLD_OFF + "\n";
      r += "\n\n________________________________\n";
      r += `Assinatura ${signerLabel}\n`;
      r += "\n\n\n";
      return r;
    };

    const receipt1 = buildReceipt("Via do Cambista", "Cobrador");
    const receipt2 = buildReceipt("Via do Cobrador", "Cambista");

    if (printerType === 'BLE') {
      if (BLEPrinter.printBill) {
        await BLEPrinter.printBill(receipt1);
        await new Promise(r => setTimeout(r, 2000));
        await BLEPrinter.printBill(receipt2);
      } else {
        await BLEPrinter.printText(receipt1 + "\n\n\n");
        await new Promise(r => setTimeout(r, 2000));
        await BLEPrinter.printText(receipt2 + "\n\n\n");
      }
    } else {
      const html = `
        <html>
        <head>
          <style>
             body { font-family: monospace; font-size: 12px; margin: 0; padding: 0; width: 58mm; text-align: center; }
             h2 { font-size: 14px; margin: 5px 0; }
             .dashed { border-top: 1px dashed black; margin: 10px 0; }
             .bold { font-weight: bold; }
             .left { text-align: left; }
             .cut { border-bottom: 2px dotted black; margin: 20px 0; padding: 10px 0; }
          </style>
        </head>
        <body>
           ${[1, 2].map(i => `
              <h2>SANGRIA / RECOLHIMENTO</h2>
              <div>${dateStr}</div>
              <div class="dashed"></div>
              <div class="left">
                <div>VALOR: <b>${formatCurrency(data.amount)}</b></div>
                <div>CAMBISTA: ${data.cambistaName}</div>
                <div>COBRADOR: ${data.cobradorName}</div>
                <div>ID: ${data.transactionId.substring(0, 8)}</div>
              </div>
              <br/>
              <div class="bold">${i === 1 ? 'VIA DO CAMBISTA' : 'VIA DO COBRADOR'}</div>
              <br/><br/>
              <div class="dashed" style="border-top: 1px solid black; width: 80%; margin: 0 auto;"></div>
              <div>Assinatura ${i === 1 ? 'Cobrador' : 'Cambista'}</div>
              <br/><br/>
              ${i === 1 ? '<div class="cut">--- CORTE AQUI ---</div>' : ''}
           `).join('')}
        </body>
        </html>
      `;
      await Print.printAsync({ html });
    }

    return true;
  } catch (e) {
    console.error("Print Sangria Error", e);
    return false;
  }
};
