const { PDFParse } = require("pdf-parse");

async function parsePdfFiles(pdfFiles = []) {
  const pdfContentsWithSource = [];

  for (const pdf of pdfFiles) {
    try {
      const parser = new PDFParse({ data: pdf.buffer });

      const result = await parser.getText();

      if (result?.text && result.text.trim().length > 0) {
        pdfContentsWithSource.push({
          text: result.text,
          source: "pdf_file"
        });
      } else {
        pdfContentsWithSource.push({
          text: "[PDF contains no extractable text]",
          source: "pdf_file"
        });
      }

      await parser.destroy();
    } catch (err) {
      console.error("PDF parse error:", err);

      pdfContentsWithSource.push({
        text: "[Failed to extract text from PDF]",
        source: "pdf_file"
      });
    }
  }

  return pdfContentsWithSource;
}

module.exports = parsePdfFiles;
