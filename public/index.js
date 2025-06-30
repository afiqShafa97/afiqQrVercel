document.getElementById("kirimBtn").addEventListener("click", async () => {
  const tautan = document.getElementById("tautanQR").value.trim();
  const namaFile = document.getElementById("namaFileQR").value || "afiqQRCode";
  const deskripsi = document.getElementById("deskripsiQR").value;

  if (!tautan) {
    alert("Silakan isi kotak teks tautan sebelum mengirim.");
    return;
  }

  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tautan, deskripsi }),
    });

    const data = await response.json();
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${data.base64}`;
    link.download = namaFile + ".png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Error:", error);
  }
});
