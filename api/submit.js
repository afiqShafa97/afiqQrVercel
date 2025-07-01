import { imageSync } from "qr-image";
import sharp from "sharp";
import path from "path";
import pureimage from "pureimage";
import stream from "stream";

async function generateQR(tautan) {
  const qr_png = imageSync(tautan, { type: "png" });
  return qr_png;
}

async function createTextImage(textContent, width) {
  const limitedText = textContent.slice(0, 30);
  const height = 40;
  const img = pureimage.make(width, height);
  const ctx = img.getContext("2d");

  // Set background to white
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  // Load font
  const fontPath = path.resolve("./fonts/OpenSans-Regular.ttf");
  const font = pureimage.registerFont(fontPath, "OpenSans");
  await font.load();

  // Draw text
  ctx.fillStyle = "black";
  ctx.font = "32pt OpenSans";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(limitedText, width / 2, height / 2);

  const output = new stream.PassThrough();
  await pureimage.encodePNGToStream(img, output);

  const chunks = [];
  for await (const chunk of output) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function combineImages(qrBuffer, textBuffer) {
  const qrImage = sharp(qrBuffer);
  const qrMeta = await qrImage.metadata();

  const textImage = sharp(textBuffer).resize(qrMeta.width, 40).png();
  const combined = await sharp({
    create: {
      width: qrMeta.width,
      height: qrMeta.height + 40,
      channels: 3,
      background: "white"
    }
  })
    .composite([
      { input: await qrImage.toBuffer(), top: 0, left: 0 },
      { input: await textImage.toBuffer(), top: qrMeta.height, left: 0 }
    ])
    .png()
    .toBuffer();

  return combined;
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { tautan, deskripsi } = req.body;

    const qrBuffer = await generateQR(tautan);
    let finalImage;

    if (deskripsi) {
      const qrMeta = await sharp(qrBuffer).metadata();
      const textBuffer = await createTextImage(deskripsi, qrMeta.width);
      finalImage = await combineImages(qrBuffer, textBuffer);
    }

    const base64 = Buffer.from(finalImage || qrBuffer).toString("base64");
    res.status(200).json({ base64 });
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
