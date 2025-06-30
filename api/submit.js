import { imageSync } from "qr-image";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { tautan } = req.body;
    console.log("Received tautan:", tautan);

    const qr_png = imageSync(tautan, { type: "png" });
    const base64 = Buffer.from(qr_png).toString("base64");

    res.status(200).json({ base64 });
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
