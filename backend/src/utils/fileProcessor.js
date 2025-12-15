const parsePdfFiles = require("../utils/pdfParser");

async function processFiles(files = []) {
  const textFiles = [];
  const csvFiles = [];
  const pdfFiles = [];
  const imageFiles = [];

  for (const file of files) {
    if (file.mimetype === "text/plain") {
      textFiles.push(file);
    } else if (
      file.mimetype === "text/csv" ||
      file.originalname.endsWith(".csv")
    ) {
      csvFiles.push(file);
    } else if (file.mimetype === "application/pdf") {
      pdfFiles.push(file);
    } else if (file.mimetype.startsWith("image/")) {
      imageFiles.push(file);
    }
  }

  // TEXT EXTRACTION
  const textContentsWithSource = textFiles.map(f => ({
    text: f.buffer.toString("utf-8"),
    source: "text_file"
  }));

  const csvContentsWithSource = csvFiles.map(f => ({
    text: f.buffer.toString("utf-8"),
    source: "csv_file"
  }));

  const pdfContentsWithSource = await parsePdfFiles(pdfFiles);

  // COMBINE TEXT
  const combinedText = [
    ...textContentsWithSource,
    ...csvContentsWithSource,
    ...pdfContentsWithSource
  ]
    .map(item => `[SOURCE=${item.source}]\n${item.text}`)
    .join("\n\n");

  // IMAGE PREP
  const imagesForGemini = imageFiles.map(f => ({
    filename: f.originalname,
    mimeType: f.mimetype,
    base64: f.buffer.toString("base64")
  }));

  return {
    combinedText,
    imagesForGemini,
    stats: {
      text: textFiles.length,
      csv: csvFiles.length,
      pdf: pdfFiles.length,
      image: imageFiles.length
    }
  };
}

module.exports = processFiles;
