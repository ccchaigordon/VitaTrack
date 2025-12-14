const { PDFParse } = require('pdf-parse');
const { readFile } = require('fs/promises');

async function run() {
	const buffer = await readFile('Receipt.pdf');
    console.log(buffer);
    const parser = new PDFParse({ data: buffer });

	const result = await parser.getText();
	console.log(result.text);
}

run();