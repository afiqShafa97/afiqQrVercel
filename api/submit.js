import { imageSync } from "qr-image";
import sharp from "sharp";

function escapeXML(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function generateQR(tautan) {
  const qr_png = imageSync(tautan, { type: "png" });
  return qr_png;
}

async function createTextImage(textContent, width) {
  const limitedText = textContent.slice(0, 30);
  const safeText = escapeXML(limitedText);
  const svg = `<svg width="${width}" height="30" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      <text x="50%" y="0" font-size="16" fill="black" text-anchor="middle" dominant-baseline="hanging" font-family="Arial">${safeText}</text>
    </svg>`;
  return Buffer.from(svg);
}

async function combineImages(qrBuffer, textBuffer) {
  const qrImage = sharp(qrBuffer);
  const qrMeta = await qrImage.metadata();

  const textImage = sharp(textBuffer).resize(qrMeta.width, 30).png();
  const combined = await sharp({
    create: {
      width: qrMeta.width,
      height: qrMeta.height + 30,
      channels: 3,
      background: "white",
    },
  })
    .composite([
      { input: await qrImage.toBuffer(), top: 0, left: 0 },
      { input: await textImage.toBuffer(), top: qrMeta.height, left: 0 },
    ])
    .png()
    .toBuffer();

  return combined;
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { tautan, deskripsi } = req.body;
    //console.log(deskripsi);
    const qrBuffer = await generateQR(tautan);
    let finalImage;
    if (deskripsi) {
      const qrMeta = await sharp(qrBuffer).metadata();
      const textBuffer = await createTextImage(deskripsi, qrMeta.width);
      finalImage = await combineImages(qrBuffer, textBuffer);
    } else {
        finalImage = qrBuffer;
    }

    const base64 = Buffer.from(finalImage).toString("base64");
    res.status(200).json({ base64 });
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
