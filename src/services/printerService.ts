import { PrinterDevice } from '../types';

// ✅ Declare the Android JS Bridge interface
declare global {
  interface Window {
    AndroidPrinter?: {
      print: (data: string) => void;
      openCashDrawer: () => void;
    };
  }
}

// Mock simulation of Web Bluetooth / Network Printer discovery
export const searchForPrinters = async (): Promise<PrinterDevice[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 'p1', name: 'Star Micronics TSP100', type: 'bluetooth', status: 'disconnected' },
        { id: 'p2', name: 'Sunmi Internal Printer', type: 'network', status: 'disconnected', ipAddress: '127.0.0.1', port: '9100' },
        { id: 'p3', name: 'Generic POS Printer', type: 'bluetooth', status: 'disconnected' },
      ]);
    }, 1500);
  });
};

export const connectToPrinter = async (printerId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Connected to printer ${printerId}`);
      resolve(true);
    }, 500);
  });
};

export const connectToNetworkPrinter = async (ip: string, port: string): Promise<PrinterDevice> => {
  if (ip === '127.0.0.1' || ip === 'localhost') {
    return {
        id: `net_${ip}_${port}`,
        name: window.AndroidPrinter ? 'Sunmi Native Printer' : 'Sunmi / Local Printer',
        type: 'network',
        status: 'connected',
        ipAddress: ip,
        port: port
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    await fetch(`http://${ip}:${port}/`, { 
        method: 'GET',
        signal: controller.signal,
        mode: 'no-cors' 
    });
    
    clearTimeout(timeoutId);
    
    return {
        id: `net_${ip}_${port}`,
        name: `Network Printer (${ip})`,
        type: 'network',
        status: 'connected',
        ipAddress: ip,
        port: port
    };
  } catch (e) {
    console.error("Printer connection check failed:", e);
    return {
        id: `net_${ip}_${port}`,
        name: `Network Printer (${ip})`,
        type: 'network',
        status: 'connected',
        ipAddress: ip,
        port: port
    };
  }
};

export const openCashDrawer = async (printer: PrinterDevice) => {
  // ✅ 2. CHECK FOR SUNMI WEBVIEW BRIDGE (Instant Kick)
  if (window.AndroidPrinter && window.AndroidPrinter.openCashDrawer) {
      console.log("⚡ Instant Drawer Kick via Sunmi SDK");
      window.AndroidPrinter.openCashDrawer();
      return true; // <-- IMPORTANT: STOPS FALLBACK
  }

  // 3. FALLBACK (Standard Browser / RawBT)
  const ESC_KICK = '\x1B\x70\x00\x19\xFA'; // ESC p 0 25 250
  
  if (printer.type === 'network' && printer.ipAddress) {
    return printReceiptData(printer, ESC_KICK);
  } else {
    console.log(`🖨️ SENDING BLUETOOTH COMMAND TO ${printer.name}: ESC p 0 50 250`);
  }
  return true;
};

// Helper to send data via RawBT Android Intent
const sendRawbtIntent = (data: string) => {
    try {
        let processedData = data.replace(/£/g, '\x9c');
        if (!processedData.includes('\x1d\x56')) {
            processedData += '\n\n\n\n\x1d\x56\x42\x00';
        }

        const binaryString = Array.from(processedData, (char) => 
            char.charCodeAt(0) > 255 ? '?' : char
        ).join('');

        // Do not URL encode the base64 string, as RawBT expects valid base64 characters (+, /, =)
        const base64 = btoa(binaryString);
        const intentUrl = `intent:base64,${base64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.jobName=HungrySharkReceipt;end;`;
        
        // Use an anchor tag click which is more reliably intercepted by WebViews like Fully Kiosk
        const link = document.createElement('a');
        link.href = intentUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 500);
        
        return true;
    } catch (err) {
        console.error("RawBT Intent failed", err);
        return false;
    }
};

// Send directly to RAWBT local API
const sendToRawbtLocal = async (data: string) => {
  try {
    let processedData = data.replace(/£/g, '\x9c');
    if (!processedData.includes('\x1d\x56')) {
      processedData += '\n\n\n\n\x1d\x56\x42\x00';
    }

    const binaryData = new Uint8Array(processedData.length);
    for (let i = 0; i < processedData.length; i++) {
        binaryData[i] = processedData.charCodeAt(i) & 0xFF;
    }

    // Try 127.0.0.1 first
    try {
      const fetchPromise1 = fetch('http://127.0.0.1:40213/print', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: binaryData
      });
      const timeoutPromise1 = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000));
      await Promise.race([fetchPromise1, timeoutPromise1]);
      return true;
    } catch (e) {
      console.log('127.0.0.1 failed, trying localhost...');
      // Fallback to localhost if 127.0.0.1 is blocked by WebView
      const fetchPromise2 = fetch('http://localhost:40213/print', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: binaryData
      });
      const timeoutPromise2 = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000));
      await Promise.race([fetchPromise2, timeoutPromise2]);
      return true;
    }
  } catch (err) {
    console.error('RAWBT Local API failed entirely', err);
    return sendRawbtIntent(data);
  }
};

export const printReceiptData = async (printer: PrinterDevice, data: string) => {
  console.log(`🖨️ PRINTING TO ${printer.name}...`);
  
  // Format Data (Fix £ signs and ensure it cuts)
  let processedData = data.replace(/£/g, '\x9c');
  if (!processedData.includes('\x1d\x56')) {
      processedData += '\n\n\n\n\x1d\x56\x42\x00'; // Partial cut
  }

  // ✅ 4. CHECK FOR SUNMI WEBVIEW BRIDGE (Instant Print)
  if (window.AndroidPrinter && window.AndroidPrinter.print) {
      console.log("⚡ Instant Print via Sunmi SDK");
      window.AndroidPrinter.print(processedData);
      
      // 👇 THIS IS CRITICAL. It stops the code here so RawBT NEVER triggers.
      return true; 
  }

  // 5. FALLBACK FOR STANDARD BROWSERS (RawBT / Network)
  if (printer.type === 'network' && printer.ipAddress) {
     const isLocalhost = printer.ipAddress === '127.0.0.1' || printer.ipAddress === 'localhost';

     if (isLocalhost) {
         return sendToRawbtLocal(processedData);
     }

     const binaryData = new Uint8Array(processedData.length);
     for (let i = 0; i < processedData.length; i++) {
         binaryData[i] = processedData.charCodeAt(i) & 0xFF;
     }

     try {
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 2000);

         await fetch(`http://${printer.ipAddress}:${printer.port}/`, {
             method: 'POST',
             body: binaryData,
             mode: 'no-cors',
             signal: controller.signal
         });
         
         clearTimeout(timeoutId);
         return true;
     } catch (e) {
         console.warn("Direct print failed", e);
         return false;
     }
  }
  
  return true;
};