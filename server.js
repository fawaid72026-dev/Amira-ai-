const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "20mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/generate", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY belum dipasang di pengaturan server." });
    }

    const {
      productImages = [], characterImage, duration = "20",
      concept = "", location = "", voice = "", cta = "", characterNotes = ""
    } = req.body || {};

    const content = [{
      type: "input_text",
      text: `Bertindak sebagai creative director video fashion affiliate Indonesia. Analisis gambar produk dan karakter yang diberikan. Buat hasil dalam Bahasa Indonesia. Durasi total ${duration} detik, dibagi menjadi tepat dua prompt video berurutan: PART 1 dan PART 2, masing-masing maksimal 10 detik. Jaga konsistensi karakter, pakaian, warna, detail produk, lokasi, pencahayaan, dan gerakan. PART 2 harus melanjutkan aksi dari akhir PART 1. Sertakan analisis produk singkat, prompt siap salin, arahan kamera, aksi, dialog/voiceover natural, dan CTA. Konsep: ${concept}. Lokasi: ${location}. Gaya suara: ${voice}. CTA: ${cta}. Catatan karakter: ${characterNotes}. Jangan mengarang fitur produk yang tidak terlihat.`
    }];

    if (characterImage) content.push({ type: "input_image", image_url: characterImage });
    for (const image of productImages) content.push({ type: "input_image", image_url: image });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6-astra",
        input: [{ role: "user", content }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Gagal menghubungi AI." });
    }

    const output = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    res.json({ result: output || "AI tidak mengembalikan teks. Silakan coba lagi." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Terjadi kesalahan server." });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Amira AI berjalan pada port ${port}`);
});
