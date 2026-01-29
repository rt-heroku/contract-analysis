/**
 * Basic Usage Example
 * 
 * This example demonstrates the simplest way to use the Document Classifier.
 */

import { DocumentClassifier } from '../src';

async function basicExample() {
  console.log('=== Basic Document Classification Example ===\n');

  // Example 1: Classify a single PDF
  console.log('Example 1: Classify PDF');
  try {
    const result = await DocumentClassifier.analyze('./sample-invoice.pdf', {
      language: 'eng',
      useAI: true,
      includeMetadata: true
    });

    if (result.success) {
      console.log(`✓ Successfully analyzed ${result.totalPages} pages`);
      console.log(`  Average confidence: ${result.summary.averageConfidence}%`);
      console.log(`  Processing time: ${result.summary.totalProcessingTime}ms`);
      
      result.pages.forEach(page => {
        console.log(`\n  Page ${page.pageNumber}:`);
        console.log(`    Type: ${page.documentType}`);
        console.log(`    Confidence: ${page.confidence}%`);
        console.log(`    Text length: ${page.textLength} chars`);
        if (page.metadata?.reasoning) {
          console.log(`    Reasoning: ${page.metadata.reasoning}`);
        }
      });
    } else {
      console.error('✗ Classification failed:', result.error);
    }
  } catch (error) {
    console.error('✗ Error:', error instanceof Error ? error.message : error);
  }

  // Example 2: Classify an image
  console.log('\n\nExample 2: Classify Image');
  try {
    const result = await DocumentClassifier.analyze('./sample-receipt.jpg');

    if (result.success) {
      const page = result.pages[0];
      console.log(`✓ Document type: ${page.documentType}`);
      console.log(`  Confidence: ${page.confidence}%`);
      console.log(`  Extracted text preview: ${page.extractedText.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error('✗ Error:', error instanceof Error ? error.message : error);
  }

  // Example 3: Extract text only (no AI classification)
  console.log('\n\nExample 3: Extract Text Only');
  try {
    const result = await DocumentClassifier.extractText('./sample-document.jpg');

    console.log(`✓ Text extracted`);
    console.log(`  Confidence: ${result.confidence}%`);
    console.log(`  Language: ${result.language}`);
    console.log(`  Processing time: ${result.processingTime}ms`);
    console.log(`  Text preview: ${result.text.substring(0, 150)}...`);
  } catch (error) {
    console.error('✗ Error:', error instanceof Error ? error.message : error);
  }

  // Example 4: Classify text directly (no OCR)
  console.log('\n\nExample 4: Classify Text Directly');
  try {
    const sampleText = `
      INVOICE
      
      Invoice Number: INV-2025-001
      Date: January 15, 2025
      
      Bill To:
      Acme Corporation
      123 Business St
      
      Items:
      - Product A: $100.00
      - Product B: $200.00
      
      Total: $300.00
    `;

    const result = await DocumentClassifier.classify(sampleText, 1);

    console.log(`✓ Classification result:`);
    console.log(`  Document type: ${result.documentType}`);
    console.log(`  Confidence: ${result.confidence}%`);
    console.log(`  Reasoning: ${result.reasoning}`);
    if (result.suggestedFields) {
      console.log(`  Suggested fields: ${result.suggestedFields.join(', ')}`);
    }
  } catch (error) {
    console.error('✗ Error:', error instanceof Error ? error.message : error);
  }
}

// Run the example
basicExample().catch(console.error);


