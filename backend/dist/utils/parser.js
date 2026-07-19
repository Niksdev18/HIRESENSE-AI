"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResume = void 0;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const canvas_1 = require("@napi-rs/canvas");
let pdfjsLib = null;
try {
    // Try loading legacy Node-compatible build of pdfjs-dist
    pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
}
catch (e) {
    try {
        pdfjsLib = require('pdfjs-dist');
    }
    catch (e2) {
        console.error('Failed to load pdfjs-dist:', e2);
    }
}
const parseResume = async (buffer, mimeType) => {
    if (mimeType === 'application/pdf') {
        // 1. Try digital text extraction first
        const data = await pdf_parse_1.default(buffer);
        let text = data.text ? data.text.trim() : '';
        // Clean double whitespaces
        text = text.replace(/\s+/g, ' ');
        // 2. OCR Fallback if text is empty or too short (scanned PDF)
        if (text.length < 50) {
            console.log('🔄 Scanned PDF detected (extracted text length < 50). Running Tesseract OCR fallback...');
            if (!pdfjsLib) {
                throw new Error('OCR fallback failed: pdfjs-dist is not loaded. Please upload a text-based PDF.');
            }
            try {
                const loadingTask = pdfjsLib.getDocument({
                    data: new Uint8Array(buffer),
                    verbosity: 0,
                });
                const pdfDocument = await loadingTask.promise;
                console.log(`📄 Loaded PDF document. Total pages: ${pdfDocument.numPages}`);
                let ocrText = '';
                const worker = await tesseract_js_1.default.createWorker('eng');
                for (let i = 1; i <= pdfDocument.numPages; i++) {
                    console.log(`📸 Rendering page ${i}/${pdfDocument.numPages} to canvas...`);
                    const page = await pdfDocument.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvas = (0, canvas_1.createCanvas)(viewport.width, viewport.height);
                    const context = canvas.getContext('2d');
                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                    }).promise;
                    console.log(`🔍 Running Tesseract OCR on page ${i}...`);
                    const imageBuffer = canvas.toBuffer('image/png');
                    const { data: { text: pageText } } = await worker.recognize(imageBuffer);
                    ocrText += pageText + '\n';
                }
                await worker.terminate();
                text = ocrText.trim().replace(/\s+/g, ' ');
                console.log('✅ OCR processing completed successfully.');
            }
            catch (ocrError) {
                console.error('❌ OCR fallback failed:', ocrError);
                throw new Error(`Failed to perform OCR on scanned PDF: ${ocrError.message || String(ocrError)}`);
            }
        }
        return text;
    }
    else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword') {
        const data = await mammoth_1.default.extractRawText({ buffer });
        return data.value ? data.value.trim().replace(/\s+/g, ' ') : '';
    }
    else {
        throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
    }
};
exports.parseResume = parseResume;
