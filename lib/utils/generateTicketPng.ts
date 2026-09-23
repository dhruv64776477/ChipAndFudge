import QRCode from 'qrcode';

export interface TicketPngItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface TicketPngData {
  ticketId: string;
  name: string;
  mobNo: string;
  status: string;
  createdAt?: string | Date;
  orderItems: TicketPngItem[];
  grandTotal: number;
}

/**
 * Load an image safely in browser environment.
 * If standard URL load fails or CORS interferes, fetch blob and convert to data URL.
 */
async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = (e) => reject(e);
          fallbackImg.src = reader.result as string;
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        reject(err);
      }
    };
    img.src = src;
  });
}

/**
 * Generate a clean, high-resolution ticket PNG image and trigger browser download.
 */
export async function downloadTicketPng(
  ticket: TicketPngData,
  customerUrl: string,
  qrDataUrlOverride?: string
): Promise<void> {
  // 1. Resolve QR code data URL (prefer generating from customerUrl for high contrast)
  let qrUrl = qrDataUrlOverride;
  if (!qrUrl) {
    qrUrl = await QRCode.toDataURL(customerUrl, {
      width: 400,
      margin: 1,
      color: { dark: '#1c0e07', light: '#ffffff' },
    });
  }

  // 2. Resolve logo URL (/logo.png)
  const logoUrl = new URL('/logo.png', window.location.origin).href;

  // 3. Load both images concurrently and wait
  const [logoImg, qrImg] = await Promise.all([
    loadImg(logoUrl).catch((err) => {
      console.warn('Failed to load logo.png, rendering fallback logo text', err);
      return null;
    }),
    loadImg(qrUrl),
  ]);

  // 4. Create offscreen canvas
  const scale = 2; // 2x high resolution for sharp text and printing
  const width = 560; // base width in px
  
  // Calculate dynamic canvas height based on item count
  const itemsCount = ticket.orderItems?.length || 0;
  const itemsHeight = Math.max(itemsCount * 36, 40);
  const baseHeight = 440 + itemsHeight + 240;
  
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = baseHeight * scale;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas 2d context');
  }

  ctx.scale(scale, scale);

  // Background - Clean off-white receipt style background (#fffdf9)
  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, width, baseHeight);

  // Outer border / frame
  ctx.strokeStyle = '#e5d5c5';
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, width - 24, baseHeight - 24);

  // Top header banner - Rich warm brown (#1e1008)
  ctx.fillStyle = '#1e1008';
  ctx.fillRect(12, 12, width - 24, 110);

  // Draw Logo in Header with preserved aspect ratio
  let logoBottomY = 70;
  if (logoImg) {
    const naturalW = logoImg.naturalWidth || logoImg.width;
    const naturalH = logoImg.naturalHeight || logoImg.height;
    const aspect = naturalW / naturalH;

    let drawW = 140;
    let drawH = drawW / aspect;
    if (drawH > 65) {
      drawH = 65;
      drawW = drawH * aspect;
    }

    const logoX = (width - drawW) / 2;
    const logoY = 22;
    ctx.drawImage(logoImg, logoX, logoY, drawW, drawH);
    logoBottomY = logoY + drawH + 12;
  } else {
    // Fallback brand text if logo image is unavailable
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE CHIP & FUDGE', width / 2, 55);
    logoBottomY = 65;
  }

  // Tagline under logo
  ctx.fillStyle = '#d97706';
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ARTISAN SNACKS & DESSERTS', width / 2, Math.max(98, logoBottomY));

  // Gold accent strip under header banner
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(12, 122, width - 24, 4);

  let curY = 152;

  // Ticket ID
  ctx.fillStyle = '#1e1008';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Ticket #${ticket.ticketId}`, width / 2, curY);

  curY += 28;

  // Status Badge
  const statusText = `STATUS: ${ticket.status.toUpperCase()}`;
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  const badgeWidth = ctx.measureText(statusText).width + 24;
  const badgeX = (width - badgeWidth) / 2;
  
  ctx.fillStyle = ticket.status === 'OPEN' ? '#ecfdf5' : '#f3f4f6';
  ctx.strokeStyle = ticket.status === 'OPEN' ? '#10b981' : '#9ca3af';
  ctx.lineWidth = 1.5;
  
  ctx.beginPath();
  ctx.roundRect(badgeX, curY - 14, badgeWidth, 22, 11);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = ticket.status === 'OPEN' ? '#047857' : '#4b5563';
  ctx.textAlign = 'center';
  ctx.fillText(statusText, width / 2, curY);

  curY += 32;

  // Customer Info Box
  const infoBoxX = 32;
  const infoBoxW = width - 64;
  ctx.fillStyle = '#f8f1ea';
  ctx.strokeStyle = '#e2d4c7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(infoBoxX, curY, infoBoxW, 70, 12);
  ctx.fill();
  ctx.stroke();

  // Customer Name & Phone
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('CUSTOMER NAME:', infoBoxX + 16, curY + 26);
  ctx.fillText('MOBILE NUMBER:', infoBoxX + 16, curY + 52);

  ctx.fillStyle = '#1c0e07';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.name, infoBoxX + 135, curY + 26);
  ctx.font = '14px monospace';
  ctx.fillText(ticket.mobNo, infoBoxX + 135, curY + 52);

  curY += 92;

  // Table Header
  const colX = {
    name: 36,
    qty: 280,
    price: 380,
    total: 510,
  };

  ctx.fillStyle = '#3b2114';
  ctx.fillRect(32, curY, width - 64, 30);

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ITEM DESCRIPTION', colX.name, curY + 19);
  ctx.textAlign = 'center';
  ctx.fillText('QTY', colX.qty, curY + 19);
  ctx.textAlign = 'right';
  ctx.fillText('UNIT PRICE', colX.price, curY + 19);
  ctx.fillText('TOTAL', colX.total, curY + 19);

  curY += 30;

  // Order Items Rows
  if (ticket.orderItems && ticket.orderItems.length > 0) {
    ticket.orderItems.forEach((item, index) => {
      const rowY = curY + (index * 34);
      
      if (index % 2 === 1) {
        ctx.fillStyle = '#fdf8f3';
        ctx.fillRect(32, rowY, width - 64, 34);
      }

      ctx.strokeStyle = '#eedfd0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, rowY + 34);
      ctx.lineTo(width - 32, rowY + 34);
      ctx.stroke();

      ctx.fillStyle = '#1c0e07';
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      
      let itemName = item.name;
      if (ctx.measureText(itemName).width > 220) {
        while (itemName.length > 3 && ctx.measureText(itemName + '...').width > 220) {
          itemName = itemName.slice(0, -1);
        }
        itemName += '...';
      }
      ctx.fillText(itemName, colX.name, rowY + 22);

      ctx.textAlign = 'center';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(String(item.quantity), colX.qty, rowY + 22);

      ctx.textAlign = 'right';
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.fillText(`₹${item.unitPrice}`, colX.price, rowY + 22);
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(`₹${item.total}`, colX.total, rowY + 22);
    });

    curY += ticket.orderItems.length * 34 + 10;
  }

  // Grand Total Box
  ctx.fillStyle = '#1e1008';
  ctx.beginPath();
  ctx.roundRect(32, curY, width - 64, 44, 8);
  ctx.fill();

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('GRAND TOTAL', 48, curY + 27);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`₹${ticket.grandTotal}`, width - 48, curY + 28);

  curY += 64;

  // QR Code Box & Details
  if (qrImg) {
    const qrSize = 160;
    const qrBoxW = qrSize + 24;
    const qrBoxH = qrSize + 24;
    const qrBoxX = (width - qrBoxW) / 2;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d5c3b2';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(qrBoxX, curY, qrBoxW, qrBoxH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.drawImage(qrImg, qrBoxX + 12, curY + 12, qrSize, qrSize);

    curY += qrBoxH + 16;

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan QR code to view ticket status', width / 2, curY);

    curY += 18;

    ctx.fillStyle = '#92400e';
    ctx.font = '10px monospace';
    ctx.fillText(customerUrl, width / 2, curY);
  }

  curY += 26;

  // Footer Tagline
  ctx.fillStyle = '#a16207';
  ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Thank you for visiting The Chip & Fudge!', width / 2, curY);

  // Convert to PNG Data URL and trigger file download
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.download = `ticket-${ticket.ticketId}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
