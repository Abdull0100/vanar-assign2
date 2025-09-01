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
		pdf: ['application/pdf'],
		docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
		txt: ['text/plain', 'text/markdown']
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
			return {
				valid: false,
				error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
			};
		}

		const fileType = getFileType(file.type);
		if (!fileType) {
			return {
				valid: false,
				error: `Unsupported file type. Allowed types: ${Object.keys(ALLOWED_TYPES).join(', ')}`
			};
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
	{#if selectedFile && uploadStatus !== 'success'}
		<div class="border-border bg-muted flex items-center justify-between rounded-lg border p-3">
			<div class="min-w-0 flex-1">
				<p class="truncate font-medium text-foreground">{selectedFile.name}</p>
				<p class="text-sm">{formatFileSize(selectedFile.size)}</p>
			</div>
			{#if uploadStatus === 'idle'}
				<button class="remove-btn" onclick={removeFile} {disabled}>
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
			<p class="mt-2 text-sm text-destructive">{errorMessage}</p>
		{/if}

		{#if uploadStatus === 'idle'}
			<button
				onclick={uploadFile}
				{disabled}
				class="mt-4 inline-flex w-full items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.02] hover:border-secondary hover:bg-secondary hover:text-secondary-foreground active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
			>
				<Upload size={16} class="mr-2" />
				Upload Document
			</button>
		{/if}
	{:else if uploadStatus === 'success'}
		<div class="rounded-lg bg-green-500/10 p-4 text-center text-green-500">
			<p class="font-semibold">Document uploaded successfully!</p>
		</div>
	{:else}
		<div 
			class="border-border group rounded-lg border-2 border-dashed p-6 text-center transition-colors duration-200 hover:border-primary hover:bg-primary/5"
			class:dragging={isDragging}
			class:disabled
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
			aria-label="Upload area for documents"
		>
			<svg class="mx-auto h-12 w-12 text-muted-foreground transition-colors duration-200 group-hover:text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
				<path d="M12 12v9" />
				<path d="m16 16-4-4-4 4" />
			</svg>
			<p class="mt-4">Drop your document here or click to browse</p>
			<input
				type="file"
				accept=".pdf,.docx,.txt,.md"
				onchange={handleFileInput}
				{disabled}
				style="display: none"
				bind:this={fileInput}
			/>
			<button
				onclick={() => fileInput?.click()}
				{disabled}
				class="mt-4 inline-flex items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.02] hover:border-secondary hover:bg-secondary hover:text-secondary-foreground active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Browse Files
			</button>
		</div>
	{/if}

	<p class="mt-2 text-center text-xs">
		Supported formats: PDF, DOCX, TXT, MD (max 10MB)
	</p>
</div>

<style>
	.document-upload {
		width: 100%;
		max-width: 400px;
	}

	.remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 2rem;
		width: 2rem;
		background: none;
		border: 1px solid hsl(var(--border));
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		border-radius: 50%;
		transition: all 0.2s ease-in-out;
		flex-shrink: 0;
	}

	.remove-btn:hover:not(:disabled) {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
		transform: scale(1.1);
	}

	.remove-btn:active:not(:disabled) {
		transform: scale(0.95);
	}

	.remove-btn:focus {
		outline: none;
		box-shadow: 0 0 0 2px hsl(var(--ring));
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
		background: hsl(var(--muted));
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: hsl(var(--primary));
		transition: width 0.2s ease;
	}

	.progress-text {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		font-weight: 500;
	}

	.error-indicator {
		flex-shrink: 0;
	}

	.error-icon {
		color: hsl(var(--destructive));
	}

	.dragging {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.05);
		transform: scale(1.02);
	}

	.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
