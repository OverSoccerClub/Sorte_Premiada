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

const formatDrawDate = (dateStr: string | undefined) => {
  if (!dateStr) return "";
  const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (parts) {
    const [_, day, month, year, hours, minutes] = parts;
    const shortYear = year.substring(2);
    return `${day}/${month}/${shortYear} ÀS ${hours}:${minutes}`;
  }
  return dateStr;
};

import { TicketData } from '../components/ticket/TicketContent';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to check if printer is connected
const checkPrinterConnection = async (): Promise<boolean> => {
  try {
    // Try a simple command to verify connection
    await BLEPrinter.printText("");
    return true;
  } catch (error) {
    console.warn('[PrintingService] Connection check failed:', error);
    return false;
  }
};

// Helper function to attempt reconnection
const attemptReconnection = async (): Promise<boolean> => {
  try {
    const savedMac = await AsyncStorage.getItem('@printer_mac_address');
    if (!savedMac) {
      console.warn('[PrintingService] No saved printer MAC address');
      return false;
    }

    console.log('[PrintingService] Attempting to reconnect to printer...');
    await BLEPrinter.connectPrinter(savedMac);
    console.log('[PrintingService] ✅ Reconnected successfully');
    return true;
  } catch (error) {
    console.error('[PrintingService] ❌ Reconnection failed:', error);
    return false;
  }
};

// Helper function to ensure connection before printing
const ensureConnection = async (): Promise<boolean> => {
  const isConnected = await checkPrinterConnection();

  if (!isConnected) {
    console.log('[PrintingService] Printer not connected, attempting reconnect...');
    return await attemptReconnection();
  }

  return true;
};

export const printTicket = async (
  data: TicketData,
  printerType: PrinterType = 'BLE',
  imageUri?: string,
  template: 'default' | 'alternative' = 'default'
) => {
  const { numbers, ticketId, date, price, gameName, possiblePrize, status, prizes, secondChanceStatus, series, ticketNumber, terminalId, areaName, city } = data;

  console.log(`[printTicket] ========== PRINTING SERVICE START ==========`);
  console.log(`[printTicket] Template: ${template}`);
  console.log(`[printTicket] Printer Type: ${printerType}`);
  console.log(`[printTicket] Image URI: ${imageUri ? 'PROVIDED' : 'NOT PROVIDED'}`);
  console.log(`[printTicket] Ticket ID: ${ticketId}`);
  console.log(`[printTicket] Game: ${gameName}`);

  try {
    console.log(`Printing ticket: ${ticketId}, Game: ${gameName}, Type: ${printerType}, Image: ${!!imageUri}`);

    // For BLE printers, ensure connection before printing
    if (printerType === 'BLE') {
      console.log('[printTicket] Checking printer connection...');
      const isConnected = await ensureConnection();

      if (!isConnected) {
        throw new Error('Impressora desconectada. Por favor, reconecte nas configurações.');
      }
      console.log('[printTicket] ✅ Printer connection verified');
    }

    // If Image URI is provided and Type is BLE, try printing image first
    // Note: Image capture already includes the watermarks if present on screen
    if (printerType === 'BLE' && imageUri) {
      try {
        console.log(`[printTicket] 🖼️ Attempting BLE IMAGE printing...`);
        let base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

        if (base64.startsWith('data:image')) {
          base64 = base64.split(',')[1];
        }

        console.log(`[printTicket] Image Base64 Length: ${base64.length}`);

        await BLEPrinter.printText("\n");

        try {
          console.log(`[printTicket] Calling BLEPrinter.printImageBase64 with width=384...`);
          await BLEPrinter.printImageBase64(base64, { imageWidth: 384, paddingX: 0 });
          console.log(`[printTicket] ✅ Image printed successfully with standard settings`);
        } catch (innerErr) {
          console.warn("[printTicket] ⚠️ Standard printImageBase64 failed, trying fallback...", innerErr);
          await BLEPrinter.printImageBase64(base64);
          console.log(`[printTicket] ✅ Image printed successfully with fallback settings`);
        }

        await BLEPrinter.printText("\n\n\n"); // Feed
        console.log(`[printTicket] ✅ BLE IMAGE PRINT COMPLETE`);
        console.log(`[printTicket] ========== PRINTING SERVICE END ==========`);
        return true;
      } catch (imgError) {
        console.error("[printTicket] ❌ IMAGE PRINT FAILED:", imgError);
        console.warn("[printTicket] ⚠️ Falling back to TEXT printing...");
        // Fallback to text if image fails
      }
    } else {
      if (!imageUri) {
        console.warn(`[printTicket] ⚠️ No image URI provided, will use TEXT printing`);
      }
      if (printerType !== 'BLE') {
        console.log(`[printTicket] Printer type is ${printerType}, checking for NATIVE printing...`);
      }
    }

    const dateStr = date;
    const amountStr = price;

    // Determine padding based on game type
    let padLength = 2;
    if (gameName.includes("2x1000") || gameName.includes("MILHAR")) padLength = 4;
    else if (gameName.includes("CENTENA")) padLength = 3;

    // Format numbers
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
              body { font-family: monospace; font-size: 12px; margin: 0; padding: 0; text-align: center; width: 58mm; position: relative; }
              h1 { font-size: 16px; margin: 5px 0; }
              .dashed { border-top: 1px dashed black; margin: 10px 0; }
              .bold { font-weight: bold; }
              .big { font-size: 18px; }
              .left { text-align: left; }
              .flex { display: flex; justify-content: space-between; }
              .footer { font-size: 10px; margin-top: 10px; }
              .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 40px;
                color: rgba(255, 0, 0, 0.2);
                font-weight: bold;
                border: 4px solid rgba(255, 0, 0, 0.2);
                padding: 10px;
                white-space: nowrap;
                pointer-events: none;
                z-index: 1000;
              }
            </style>
          </head>
          <body>
            ${status === 'CANCELLED' ? '<div class="watermark">CANCELADO</div>' : ''}
            <h1>${data.companyName || 'Sorte Premiada'}</h1>
            <div>COMPROVANTE DE APOSTA</div>
            <div class="dashed"></div>
            
            <div class="bold big">${gameName.toUpperCase()}</div>
            <div>EXTRAÇÃO: ${formatDrawDate(data.drawDate || dateStr)}${city || areaName ? ` - ${city ? `${city}/` : ''}${areaName || ''}` : ''}</div>
            
            <div class="dashed"></div>
            
            <div class="bold big" style="font-size: 24px; letter-spacing: 2px;">
              ${numbersStr.replace(/  /g, ' ')}
            </div>
            
            <div class="dashed"></div>
            
            ${prizes ? `
            <div class="bold">PREMIAÇÃO</div>
            <div class="left">MILHAR: ${prizes.milhar || 'R$ 0,00'}</div>
            <div class="left">CENTENA: ${prizes.centena || 'R$ 0,00'}</div>
            <div class="left">DEZENA: ${prizes.dezena || 'R$ 0,00'}</div>
            <div class="dashed"></div>
            ` : possiblePrize ? `
            <div class="bold">PRÊMIO MÁXIMO</div>
            <div class="bold big">${possiblePrize}</div>
            <div class="dashed"></div>
            ` : ''}
            
            ${data.secondChanceNumber ? `
            <div class="bold" style="background: black; color: white; padding: 5px; border-radius: 10px; margin: 10px 0;">
              <div style="font-size: 14px;">SEGUNDA CHANCE</div>
              <div style="font-size: 10px;">SORTEIO EXTRA - ${data.secondChanceDrawDate || 'SÁBADO'}</div>
            </div>
            <div class="bold big" style="font-size: 28px; letter-spacing: 8px;">
              ${data.secondChanceNumber.toString().split('').join(' ')}
            </div>
            <div style="background: black; color: white; padding: 4px; font-size: 9px; font-weight: bold; margin-top: 5px;">${data.mainMatchMessage || "ACERTANDO TODOS OS NÚMEROS NA ORDEM"}</div>
            <div class="dashed" style="margin-top: 2px;"></div>
            ` : ''}
            
            <div class="flex">
              <span class="bold">TOTAL A PAGAR</span>
              <span>${amountStr}</span>
            </div>
            
            <div class="dashed"></div>
            
            <div class="footer">
              <div>Série: ${series || '----'} | Bilhete: ${ticketNumber?.toString().padStart(4, '0') || '----'} | Terminal: ${terminalId || '----'}</div>
              <div>ID: ${ticketId}</div>
              ${secondChanceStatus === 'WON' ? '<div style="color: green; font-weight: bold; border: 1px solid green; padding: 2px; margin-top: 5px;">GANHADOR SEGUNDA CHANCE</div>' : ''}
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

    // BLE Printing Logic
    console.log(`[printTicket] 📝 Using TEXT-based BLE printing...`);

    if (template === 'alternative') {
      console.warn(`[printTicket] ⚠️ WARNING: Alternative template selected but TEXT printing doesn't support it!`);
      console.warn(`[printTicket] ⚠️ The printed ticket will use DEFAULT layout instead.`);
      console.warn(`[printTicket] ⚠️ This usually means image capture/printing failed.`);
    }

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

    const MAX_CHARS = 32;
    const padPair = (left: string, right: string) => {
      let space = MAX_CHARS - left.length - right.length;
      if (space < 1) space = 1;
      return left + " ".repeat(space) + right;
    };

    receipt += INITIALIZE;

    // --- LOGO PRINTING LOGIC ---
    if (data.companyLogoUrl) {
      try {
        console.log("Downloading Company Logo:", data.companyLogoUrl);
        const logoUri = await FileSystem.downloadAsync(
          data.companyLogoUrl,
          FileSystem.cacheDirectory + 'company_logo_print.jpg'
        );

        const base64Logo = await FileSystem.readAsStringAsync(logoUri.uri, { encoding: 'base64' });

        if (BLEPrinter.printImageBase64) {
          await BLEPrinter.printImageBase64(base64Logo, { imageWidth: 384, paddingX: 0 });
        }
      } catch (e) {
        console.warn("Failed to print company logo:", e);
      }
    }
    // ---------------------------

    // CANCELADO Watermark (Text style)
    if (status === 'CANCELLED') {
      receipt += CENTER + DOUBLE_WIDTH_HEIGHT + BOLD_ON + "\n*** BILHETE CANCELADO ***\n" + BOLD_OFF + NORMAL + "\n";
      receipt += CENTER + DOUBLE_WIDTH_HEIGHT + BOLD_ON + "--- SEM VALOR ---\n" + BOLD_OFF + NORMAL + "\n";
    }

    if (secondChanceStatus === 'WON') {
      receipt += CENTER + BOLD_ON + "GANHADOR SEGUNDA CHANCE\n" + BOLD_OFF + NORMAL;
    }

    receipt += CENTER;
    receipt += DOUBLE_WIDTH_HEIGHT + BOLD_ON + (data.companyName || "Sorte Premiada") + BOLD_OFF + NORMAL + "\n";
    receipt += CENTER + "COMPROVANTE DE APOSTA\n";
    receipt += "- - - - - - - - - - - - - - - -\n\n";

    receipt += DOUBLE_WIDTH_HEIGHT + BOLD_ON + gameName.toUpperCase() + BOLD_OFF + NORMAL + "\n";
    const areaStr = city || areaName ? ` - ${city ? `${city}/` : ''}${areaName || ''}` : '';
    const sorteioInfo = `EXTRAÇÃO: ${formatDrawDate(data.drawDate || dateStr)}${areaStr}`;
    receipt += sorteioInfo + "\n\n";

    const sortedNumbers = numbers.sort((a, b) => a - b);
    const formattedNumbers = sortedNumbers.map(n => n.toString().padStart(padLength, '0'));

    for (let i = 0; i < formattedNumbers.length; i += 2) {
      const left = formattedNumbers[i];
      const right = formattedNumbers[i + 1];
      let line = right ? `${left}      ${right}` : `${left}`;
      receipt += DOUBLE_HEIGHT + BOLD_ON + line + BOLD_OFF + NORMAL + "\n";
    }
    receipt += "\n";

    if (prizes) {
      receipt += "- - - - - - - - - - - - - - - -\n";
      receipt += BOLD_ON + "PREMIACAO" + BOLD_OFF + "\n";
      receipt += padPair("MILHAR:", prizes.milhar || "R$ 0,00") + "\n";
      receipt += padPair("CENTENA:", prizes.centena || "R$ 0,00") + "\n";
      receipt += padPair("DEZENA:", prizes.dezena || "R$ 0,00") + "\n";
    } else if (possiblePrize) {
      receipt += "- - - - - - - - - - - - - - - -\n";
      receipt += BOLD_ON + "PREMIO MAXIMO" + BOLD_OFF + "\n";
      receipt += DOUBLE_WIDTH_HEIGHT + BOLD_ON + possiblePrize + BOLD_OFF + NORMAL + "\n";
    }

    // Segunda Chance Section
    if (data.secondChanceNumber) {
      receipt += "- - - - - - - - - - - - - - - -\n";
      receipt += CENTER + BOLD_ON + "SEGUNDA CHANCE" + BOLD_OFF + "\n";
      receipt += "SORTEIO EXTRA - " + (data.secondChanceDrawDate || "SABADO") + "\n";
      receipt += DOUBLE_WIDTH_HEIGHT + BOLD_ON + data.secondChanceNumber.toString().split('').join(' ') + BOLD_OFF + NORMAL + "\n";
      receipt += (data.mainMatchMessage || "ACERTANDO TODOS OS NUMEROS NA ORDEM") + "\n";
      receipt += "- - - - - - - - - - - - - - - -\n";
    }

    receipt += "- - - - - - - - - - - - - - - -\n";
    receipt += LEFT + BOLD_ON + padPair("TOTAL A PAGAR", amountStr) + BOLD_OFF + "\n";

    receipt += CENTER + "\n";
    receipt += "|| ||| || |||| ||| || ||||| ||||\n";
    receipt += FONT_B + `SERIE: ${series || '----'} | BILHETE: ${ticketNumber?.toString().padStart(4, '0') || '----'} | TERM: ${terminalId || '----'}\n`;
    receipt += FONT_B + `ID: ${ticketId}\n`;
    receipt += "\nEste bilhete não possui valor fiscal.\nBoa Sorte!\n" + FONT_A + "\n";

    if (status === 'CANCELLED') {
      receipt += CENTER + DOUBLE_WIDTH_HEIGHT + BOLD_ON + "\n*** CANCELADO ***\n" + BOLD_OFF + NORMAL + "\n";
    }

    receipt += "\n\n\n";

    if (BLEPrinter.printBill) await BLEPrinter.printBill(receipt);
    else if (BLEPrinter.printText) await BLEPrinter.printText(receipt);
    else throw new Error("No text printing method found");

    console.log(`[printTicket] ✅ TEXT PRINT COMPLETE`);
    console.log(`[printTicket] ========== PRINTING SERVICE END ==========`);
    return true;
  } catch (error) {
    console.error("[printTicket] ❌ PRINT ERROR:", error);
    console.log(`[printTicket] ========== PRINTING SERVICE END (ERROR) ==========`);
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
    companyName?: string;
    companyLogoUrl?: string;
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
  receipt += DOUBLE_WIDTH_HEIGHT + BOLD_ON + (data.companyName?.toUpperCase() || "SORTE PREMIADA") + BOLD_OFF + NORMAL + "\n";
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
    companyName?: string;
    companyLogoUrl?: string;
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
            <h1>${data.companyName || 'SORTE PREMIADA'}</h1>
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
    // --- LOGO PRINTING LOGIC FOR BLE ---
    if (printerType === 'BLE' && data.companyLogoUrl) {
      try {
        console.log("Downloading Company Logo for Daily Report:", data.companyLogoUrl);
        const logoUri = await FileSystem.downloadAsync(
          data.companyLogoUrl,
          FileSystem.cacheDirectory + 'company_logo_report.jpg'
        );

        const base64Logo = await FileSystem.readAsStringAsync(logoUri.uri, { encoding: 'base64' });

        if (BLEPrinter.printImageBase64) {
          await BLEPrinter.printImageBase64(base64Logo, { imageWidth: 384, paddingX: 0 });
          await BLEPrinter.printText("\n");
        }
      } catch (e) {
        console.warn("Failed to print company logo on daily report:", e);
      }
    }
    // ---------------------------

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
    companyName?: string;
    companyLogoUrl?: string;
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

    // --- LOGO PRINTING LOGIC FOR BLE ---
    if (printerType === 'BLE' && data.companyLogoUrl) {
      try {
        console.log("Downloading Company Logo for Sangria:", data.companyLogoUrl);
        const logoUri = await FileSystem.downloadAsync(
          data.companyLogoUrl,
          FileSystem.cacheDirectory + 'company_logo_sangria.jpg'
        );

        const base64Logo = await FileSystem.readAsStringAsync(logoUri.uri, { encoding: 'base64' });

        if (BLEPrinter.printImageBase64) {
          await BLEPrinter.printImageBase64(base64Logo, { imageWidth: 384, paddingX: 0 });
          await BLEPrinter.printText("\n");
        }
      } catch (e) {
        console.warn("Failed to print company logo on sangria receipt:", e);
      }
    }
    // ---------------------------

    const buildReceipt = (copyName: string, signerLabel: string) => {
      let r = "";
      r += INITIALIZE;
      r += CENTER;
      r += DOUBLE_WIDTH_HEIGHT + BOLD_ON + (data.companyName?.toUpperCase() || "SORTE PREMIADA") + BOLD_OFF + NORMAL + "\n";
      r += "SANGRIA / RECOLHIMENTO\n";
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
              <h2>${data.companyName || 'SORTE PREMIADA'}</h2>
              <div>SANGRIA / RECOLHIMENTO</div>
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
