const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

/**
 * Extract text content from PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Extracted text content
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Process PDF file: extract text only (no embedding)
 * @param {string} filePath - Path to the PDF file
 * @param {string} filename - Original filename
 * @returns {Promise<{content: string, title: string}>}
 */
async function processPDF(filePath, filename) {
  try {
    console.log(`Processing PDF: ${filename}`);
    
    // Extract text from PDF
    const content = await extractTextFromPDF(filePath);
    
    if (!content || content.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    // Generate title from filename
    const title = filename.replace('.pdf', '').replace(/[-_]/g, ' ');
    
    console.log(`Successfully processed PDF: ${filename}`);
    console.log(`Content length: ${content.length} characters`);
    
    return {
      content,
      title
    };
  } catch (error) {
    console.error(`Error processing PDF ${filename}:`, error);
    throw error;
  }
}

/**
 * Process all PDF files in a directory
 * @param {string} directoryPath - Path to directory containing PDFs
 * @returns {Promise<Array>} Array of processed PDF data
 */
async function processAllPDFs(directoryPath) {
  try {
    const files = fs.readdirSync(directoryPath);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('No PDF files found in directory');
      return [];
    }
    
    console.log(`Found ${pdfFiles.length} PDF files to process`);
    
    const results = [];
    
    for (const filename of pdfFiles) {
      const filePath = path.join(directoryPath, filename);
      try {
        const processedData = await processPDF(filePath, filename);
        results.push({
          filename,
          filePath,
          ...processedData
        });
      } catch (error) {
        console.error(`Skipping ${filename} due to error:`, error.message);
        // Continue processing other files
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error processing PDFs:', error);
    throw error;
  }
}

module.exports = {
  extractTextFromPDF,
  processPDF,
  processAllPDFs
};
