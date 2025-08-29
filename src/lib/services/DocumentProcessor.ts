import type { Document } from '$lib/db/schema';

export class DocumentProcessor {
	/**
	 * Extract text content from uploaded files
	 */
	async extractText(file: File, fileType: string): Promise<string> {
		try {
			switch (fileType) {
				case 'pdf':
					return await this.extractTextFromPDF(file);
				case 'docx':
					return await this.extractTextFromDOCX(file);
				case 'txt':
					return await this.extractTextFromTXT(file);
				default:
					throw new Error(`Unsupported file type: ${fileType}`);
			}
		} catch (error: any) {
			console.error('Text extraction error:', error);
			throw new Error(`Failed to extract text: ${error.message}`);
		}
	}

	/**
	 * Extract text from PDF files
	 */
	private async extractTextFromPDF(file: File): Promise<string> {
		try {
			// For server-side PDF processing, we'll use pdf-parse
			// This is a placeholder implementation - in a real app you'd use pdf-parse or similar
			const arrayBuffer = await file.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);

			// Mock PDF text extraction - replace with actual PDF parsing
			// In production, use: import pdf from 'pdf-parse';
			const mockText = `Extracted text from PDF: ${file.name}
This is a placeholder for actual PDF text extraction.
In a real implementation, you would use pdf-parse or similar library to extract text from PDF files.`;

			return mockText;
		} catch (error) {
			throw new Error(`PDF processing failed: ${error}`);
		}
	}

	/**
	 * Extract text from DOCX files
	 */
	private async extractTextFromDOCX(file: File): Promise<string> {
		try {
			// For server-side DOCX processing, we'd use mammoth or similar
			// This is a placeholder implementation
			const arrayBuffer = await file.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);

			// Mock DOCX text extraction - replace with actual DOCX parsing
			// In production, use: import mammoth from 'mammoth';
			const mockText = `Extracted text from DOCX: ${file.name}
This is a placeholder for actual DOCX text extraction.
In a real implementation, you would use mammoth or similar library to extract text from DOCX files.`;

			return mockText;
		} catch (error) {
			throw new Error(`DOCX processing failed: ${error}`);
		}
	}

	/**
	 * Extract text from TXT files
	 */
	private async extractTextFromTXT(file: File): Promise<string> {
		try {
			const text = await file.text();
			return text;
		} catch (error) {
			throw new Error(`TXT processing failed: ${error}`);
		}
	}

	/**
	 * Create overlapping chunks from text for RAG
	 */
	createChunks(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
		if (!text || text.length === 0) {
			return [];
		}

		const chunks: string[] = [];
		let start = 0;

		while (start < text.length) {
			let end = start + chunkSize;

			// If we're not at the end, try to find a good breaking point
			if (end < text.length) {
				// Look for sentence endings within the last 100 characters
				const lastPeriod = text.lastIndexOf('.', end);
				const lastNewline = text.lastIndexOf('\n', end);
				const lastSpace = text.lastIndexOf(' ', end);

				// Use the best breaking point found
				if (lastPeriod > end - 100) {
					end = lastPeriod + 1;
				} else if (lastNewline > end - 100) {
					end = lastNewline;
				} else if (lastSpace > end - 100) {
					end = lastSpace;
				}
			}

			const chunk = text.slice(start, end).trim();
			if (chunk.length > 0) {
				chunks.push(chunk);
			}

			// Move start position with overlap
			start = Math.max(start + 1, end - overlap);
		}

		return chunks;
	}

	/**
	 * Generate embeddings for text chunks using FastAPI service
	 */
	async generateEmbeddingsForChunks(chunks: string[]): Promise<number[][]> {
		try {
			const response = await fetch('http://localhost:8000/embed/batch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					texts: chunks,
					user_id: 'system'
				}),
			});

			if (!response.ok) {
				throw new Error(`Embeddings API error: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
			return result.embeddings;
		} catch (error: any) {
			console.error('Error generating embeddings for chunks:', error);
			// Fallback to mock embeddings
			console.warn('Falling back to mock embeddings for chunks');
			return this.generateMockEmbeddings(chunks);
		}
	}

	/**
	 * Fallback mock embeddings for chunks
	 */
	private generateMockEmbeddings(chunks: string[]): number[][] {
		return chunks.map(chunk => this.generateMockEmbedding(chunk));
	}

	/**
	 * Generate mock embedding for a single text (same as RAGService)
	 */
	private generateMockEmbedding(text: string): number[] {
		const words = text.toLowerCase().split(/\s+/);
		const embedding = new Array(1536).fill(0);

		// Create a simple hash-based embedding
		for (let i = 0; i < words.length; i++) {
			const word = words[i];
			let hash = 0;
			for (let j = 0; j < word.length; j++) {
				hash = ((hash << 5) - hash) + word.charCodeAt(j);
				hash = hash & hash; // Convert to 32-bit integer
			}

			// Distribute hash across embedding dimensions
			for (let dim = 0; dim < 10; dim++) {
				const index = Math.abs((hash + dim * 12345) % 1536);
				embedding[index] += (hash % 100) / 100 - 0.5; // Normalize to [-0.5, 0.5]
			}
		}

		// Normalize the embedding
		const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
		return embedding.map(val => val / magnitude);
	}

	/**
	 * Clean and normalize extracted text
	 */
	cleanText(text: string): string {
		return text
			// Remove excessive whitespace
			.replace(/\s+/g, ' ')
			// Remove control characters
			.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
			// Normalize line endings
			.replace(/\r\n/g, '\n')
			.replace(/\r/g, '\n')
			// Remove excessive newlines
			.replace(/\n{3,}/g, '\n\n')
			.trim();
	}

	/**
	 * Get document metadata
	 */
	getMetadata(text: string): Record<string, any> {
		const lines = text.split('\n').filter(line => line.trim());
		const wordCount = text.split(/\s+/).length;
		const charCount = text.length;

		return {
			lineCount: lines.length,
			wordCount,
			charCount,
			estimatedReadingTime: Math.ceil(wordCount / 200) // Assume 200 words per minute
		};
	}
}
