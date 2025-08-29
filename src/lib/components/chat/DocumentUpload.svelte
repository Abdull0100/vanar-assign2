<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Upload, FileText, X, Check, AlertCircle } from '@lucide/svelte';

	export let disabled = false;
	export let conversationId: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	let isDragging = false;
	let selectedFile: File | null = null;
	let uploadStatus: 'idle' | 'uploading' | 'success' | 'error' = 'idle';
	let errorMessage = '';
	let uploadProgress = 0;
	let fileInput: HTMLInputElement | null = null;

	// File validation
	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
	const ALLOWED_TYPES = {
		'pdf': ['application/pdf'],
		'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
		'txt': ['text/plain', 'text/markdown']
	};

	function getFileType(mimeType: string): string | null {
		for (const [type, mimeTypes] of Object.entries(ALLOWED_TYPES)) {
			if (mimeTypes.includes(mimeType)) {
				return type;
			}
		}
		return null;
	}

	function validateFile(file: File): { valid: boolean; error?: string } {
		if (file.size > MAX_FILE_SIZE) {
			return { valid: false, error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
		}

		const fileType = getFileType(file.type);
		if (!fileType) {
			return { valid: false, error: `Unsupported file type. Allowed types: ${Object.keys(ALLOWED_TYPES).join(', ')}` };
		}

		return { valid: true };
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!disabled) {
			isDragging = true;
		}
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		if (disabled) return;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFileSelection(files[0]);
		}
	}

	function handleFileInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (files && files.length > 0) {
			handleFileSelection(files[0]);
		}
	}

	function handleFileSelection(file: File) {
		const validation = validateFile(file);
		if (!validation.valid) {
			errorMessage = validation.error || 'Invalid file';
			uploadStatus = 'error';
			return;
		}

		selectedFile = file;
		errorMessage = '';
		uploadStatus = 'idle';
	}

	async function uploadFile() {
		if (!selectedFile || disabled) return;

		uploadStatus = 'uploading';
		uploadProgress = 0;
		errorMessage = '';

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);
			if (conversationId) {
				formData.append('conversationId', conversationId);
			}

			// Simulate progress updates
			const progressInterval = setInterval(() => {
				uploadProgress = Math.min(uploadProgress + 10, 90);
			}, 200);

			const response = await fetch('/api/documents/upload', {
				method: 'POST',
				body: formData
			});

			clearInterval(progressInterval);
			uploadProgress = 100;

			const result = await response.json();

			if (result.success) {
				uploadStatus = 'success';
				dispatch('uploadSuccess', {
					document: result.document,
					file: selectedFile
				});
				// Reset after success
				setTimeout(() => {
					selectedFile = null;
					uploadStatus = 'idle';
					uploadProgress = 0;
				}, 2000);
			} else {
				throw new Error(result.error || 'Upload failed');
			}

		} catch (error: any) {
			console.error('Upload error:', error);
			uploadStatus = 'error';
			errorMessage = error.message || 'Upload failed';
			uploadProgress = 0;
		}
	}

	function removeFile() {
		selectedFile = null;
		uploadStatus = 'idle';
		errorMessage = '';
		uploadProgress = 0;
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
</script>

<div class="document-upload">
	<div
		class="upload-area"
		class:dragging={isDragging}
		class:disabled
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		role="button"
		tabindex="0"
		aria-label="Upload area for documents"
	>
		{#if selectedFile && uploadStatus !== 'success'}
			<!-- File selected state -->
			<div class="file-info">
				<FileText class="file-icon" size={24} />
				<div class="file-details">
					<div class="file-name">{selectedFile.name}</div>
					<div class="file-size">{formatFileSize(selectedFile.size)}</div>
				</div>
				{#if uploadStatus === 'idle'}
					<button class="remove-btn" onclick={removeFile} disabled={disabled}>
						<X size={16} />
					</button>
				{:else if uploadStatus === 'uploading'}
					<div class="upload-progress">
						<div class="progress-bar">
							<div class="progress-fill" style="width: {uploadProgress}%"></div>
						</div>
						<span class="progress-text">{uploadProgress}%</span>
					</div>
				{:else if uploadStatus === 'error'}
					<div class="error-indicator">
						<AlertCircle size={16} class="error-icon" />
					</div>
				{/if}
			</div>

			{#if uploadStatus === 'error' && errorMessage}
				<div class="error-message">{errorMessage}</div>
			{/if}

			{#if uploadStatus === 'idle'}
				<button class="upload-btn" onclick={uploadFile} disabled={disabled}>
					<Upload size={16} />
					Upload Document
				</button>
			{/if}
		{:else if uploadStatus === 'success'}
			<!-- Success state -->
			<div class="success-state">
				<Check class="success-icon" size={24} />
				<div class="success-text">Document uploaded successfully!</div>
			</div>
		{:else}
			<!-- Default upload state -->
			<div class="upload-prompt">
				<Upload class="upload-icon" size={32} />
				<div class="upload-text">
					<div class="primary-text">Drop your document here</div>
					<div class="secondary-text">or click to browse</div>
				</div>
				<input
					type="file"
					accept=".pdf,.docx,.txt,.md"
					onchange={handleFileInput}
					disabled={disabled}
					style="display: none"
					bind:this={fileInput}
				/>
				<button
					class="browse-btn"
					onclick={() => fileInput?.click()}
					disabled={disabled}
				>
					Browse Files
				</button>
			</div>
		{/if}
	</div>

	<div class="upload-info">
		<p>Supported formats: PDF, DOCX, TXT, MD (max 10MB)</p>
	</div>
</div>

<style>
	.document-upload {
		width: 100%;
		max-width: 400px;
	}

	.upload-area {
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		transition: all 0.2s ease;
		cursor: pointer;
		background: #fafafa;
		position: relative;
	}

	.upload-area:hover:not(.disabled) {
		border-color: #3b82f6;
		background: #f0f9ff;
	}

	.upload-area.dragging {
		border-color: #3b82f6;
		background: #eff6ff;
		transform: scale(1.02);
	}

	.upload-area.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.upload-prompt {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}



	.upload-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.primary-text {
		font-weight: 500;
		color: #374151;
	}

	.secondary-text {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.browse-btn {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.browse-btn:hover:not(:disabled) {
		background: #2563eb;
	}

	.browse-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
	}



	.file-details {
		flex: 1;
		text-align: left;
	}

	.file-name {
		font-weight: 500;
		color: #374151;
		font-size: 0.875rem;
		word-break: break-all;
	}

	.file-size {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.remove-btn {
		padding: 0.25rem;
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.remove-btn:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.upload-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s ease;
		margin-top: 1rem;
	}

	.upload-btn:hover:not(:disabled) {
		background: #059669;
	}

	.upload-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.upload-progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.progress-bar {
		width: 60px;
		height: 6px;
		background: #e5e7eb;
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #3b82f6;
		transition: width 0.2s ease;
	}

	.progress-text {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
	}

	.error-indicator {
		flex-shrink: 0;
	}



	.error-message {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 4px;
		font-size: 0.75rem;
		color: #dc2626;
		text-align: left;
	}

	.success-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
	}



	.success-text {
		font-weight: 500;
		color: #374151;
		font-size: 0.875rem;
	}

	.upload-info {
		margin-top: 1rem;
		text-align: center;
	}

	.upload-info p {
		font-size: 0.75rem;
		color: #6b7280;
		margin: 0;
	}
</style>
