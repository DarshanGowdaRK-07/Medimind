import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import Tesseract from 'tesseract.js';
const fail=m=>Object.assign(new Error(m),{status:422});
const normalize=v=>String(v||'').replace(/\u0000/g,'').replace(/\r/g,'\n').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
export async function extractText(file){
 const ext=path.extname(file.originalname).toLowerCase();
 if(ext==='.txt')return normalize(fs.readFileSync(file.path,'utf8'));
 if(ext==='.pdf'){const result=await pdf(fs.readFileSync(file.path));const text=normalize(result.text);if(text.length<40)throw fail('This PDF appears scanned or image-only. Upload a text-based PDF, or save its page as a clear JPG/PNG image for OCR.');return text;}
 if(ext==='.docx'){const result=await mammoth.extractRawText({path:file.path});const text=normalize(result.value);if(text.length<40)throw fail('Very little text could be extracted from this DOCX. Check that it contains selectable text.');return text;}
 if(['.png','.jpg','.jpeg','.webp'].includes(ext)){const result=await Tesseract.recognize(file.path,'eng');const text=normalize(result.data.text);if(text.length<20)throw fail('OCR could not read enough text. Upload a sharper, well-lit image showing the complete report.');return text;}
 throw fail('Unsupported file type. Upload PDF, DOCX, TXT, PNG, JPG or WEBP.');
}
