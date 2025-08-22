<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { writable, derived } from 'svelte/store';
	import { marked } from 'marked';
	import Prism from 'prismjs';

	// Types
	type ChatMessage = {
		id: string;
		content: string;
		sender: 'user' | 'ai';
		aiResponse: string | null;
		createdAt: string;
		isStreaming?: boolean;
	};

	type Conversation = {
		id: string;
		roomName: string;
		createdAt: string;
		updatedAt: string;
		messageCount?: number;
		messages: ChatMessage[];
	};

	// Stores for reactive state management
	const messages = writable<ChatMessage[]>([]);
	const conversations = writable<Conversation[]>([]);
	const currentConversationId = writable<string | null>(null);
	const loading = writable(false);
	const error = writable('');

	// Modal state
	const showDeleteModal = writable(false);
	const deleteTarget = writable<{ id: string; title: string } | null>(null);
	const showDeleteAllModal = writable(false);
	const deleteAllTarget = writable<{ title: string } | null>(null);
	
	// Toast notification state
	const showToast = writable(false);
	const toastMessage = writable('');
	const toastType = writable<'success' | 'error' | 'info'>('success');

	// Local variable for input binding
	let messageText = '';

	// Derived store for current conversation - this ensures reactivity
	const currentConversation = derived(
		[conversations, currentConversationId],
		([$conversations, $currentConversationId]) => 
			$conversations.find(c => c.id === $currentConversationId) || null
	);

	$: user = $page.data.session?.user;

	// Error handling state
	let retryCountdown = 0;
	let retryTimer: NodeJS.Timeout | null = null;
	let errorRetryCount = 0;
	let messagesContainer: HTMLElement;
	let aiResponseContainer: HTMLElement;

	const storageKey = () => `vanar_conversations_${user?.id || 'anon'}`;
	const generateId = () => crypto.randomUUID();

	onMount(() => {
		if ($page.data.session === null) {
			goto('/auth/signin');
			return;
		}
		loadConversationsFromStorage();
		loadChatHistory();
		
		// Add scroll event listener for better scroll tracking
		if (messagesContainer) {
			messagesContainer.addEventListener('scroll', () => {
				// Trigger reactivity to update scroll indicators
				messagesContainer = messagesContainer;
			});
		}
	});

	onDestroy(() => {
		// Clean up timeouts to prevent memory leaks
		clearTimeout(syncTimeout);
		clearTimeout(saveTimeout);
		
		// Clean up retry timer
		if (retryTimer) {
			clearInterval(retryTimer);
			retryTimer = null;
		}
	});

	function saveConversationsToStorage() {
		try {
			// Only save current conversation ID to storage
			// Conversations are loaded from database to ensure they have messages
			const currentData = {
				currentConversationId: $currentConversationId
			};
			localStorage.setItem(storageKey(), JSON.stringify(currentData));
		} catch (e) {
			console.warn('Failed to save conversation ID to storage:', e);
		}
	}

	function loadConversationsFromStorage() {
		try {
			const raw = localStorage.getItem(storageKey());
			if (raw) {
				const parsed = JSON.parse(raw);
				// Only load current conversation ID from storage, not conversations
				// Conversations will be loaded from database to ensure they have messages
				currentConversationId.set(parsed.currentConversationId || null);
				
				// Don't load messages from local storage - they'll be loaded from database when needed
				messages.set([]);
			}
		} catch (e) {
			console.warn('Failed to load conversations from storage:', e);
		}
	}

	function newConversation() {
		// Generate a temporary ID for the new conversation
		const tempId = `temp-${generateId()}`;
		
		// Create a new conversation immediately in the UI
		const newConv: Conversation = {
			id: tempId,
			roomName: 'New Chat',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			messageCount: 0,
			messages: []
		};
		
		// Add the new conversation to the list
		conversations.update(convs => [newConv, ...convs]);
		
		// Set it as the current conversation
		currentConversationId.set(tempId);
		messages.set([]);
		
		// Debounced save to avoid excessive localStorage writes
		debouncedSaveToStorage();
	}

	async function selectConversation(id: string) {
		currentConversationId.set(id);
		
		// First check if we have messages in the conversations store
		const existingConv = $conversations.find(conv => conv.id === id);
		if (existingConv && existingConv.messages && existingConv.messages.length > 0) {
			messages.set(existingConv.messages);
			debouncedSaveToStorage();
			return;
		}
		
		// For temporary conversations, load messages from the conversations store
		if (id.startsWith('temp-')) {
			const tempConv = $conversations.find(conv => conv.id === id);
			if (tempConv) {
				messages.set(tempConv.messages || []);
			} else {
				messages.set([]);
			}
			debouncedSaveToStorage();
			return;
		}
		
		// Load messages for this conversation from the database
		try {
			const response = await fetch(`/api/chat?conversationId=${id}`);
			if (response.ok) {
				const data = await response.json();
				if (data.messages && Array.isArray(data.messages)) {
					messages.set(data.messages);
					// Update the conversations store with the loaded messages
					conversations.update(convs => 
						convs.map(conv => 
							conv.id === id 
								? { ...conv, messages: data.messages }
								: conv
						)
					);
				} else {
					messages.set([]);
				}
			} else {
				messages.set([]);
			}
		} catch (err) {
			console.error('Error loading conversation messages:', err);
			messages.set([]);
		}
		
		// Debounced save to avoid excessive localStorage writes
		debouncedSaveToStorage();
	}

	function updateConversationRoomName(roomName: string) {
		if (!$currentConversationId) return;
		
		conversations.update(convs => 
			convs.map(conv => 
				conv.id === $currentConversationId 
					? { ...conv, roomName, updatedAt: new Date().toISOString() }
					: conv
			)
		);
		
		// Debounced save to avoid excessive localStorage writes
		debouncedSaveToStorage();
	}

	// Debounced function to sync messages with conversations
	let syncTimeout: NodeJS.Timeout;
	function debouncedSyncMessages() {
		clearTimeout(syncTimeout);
		syncTimeout = setTimeout(() => {
			if (!$currentConversationId || !$messages) return;
			
			conversations.update(convs => 
				convs.map(conv => 
					conv.id === $currentConversationId 
						? { 
							...conv, 
							messages: [...$messages], 
							updatedAt: new Date().toISOString(),
							messageCount: $messages.length
						}
						: conv
				)
			);
		}, 300); // Debounce to 300ms
	}

	// Debounced function to save to localStorage
	let saveTimeout: NodeJS.Timeout;
	function debouncedSaveToStorage() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			saveConversationsToStorage();
		}, 500); // Debounce to 500ms
	}

	// Memoized conversations for better performance
	$: memoizedConversations = $conversations.map(conv => ({
		...conv,
		// Pre-compute formatted date to avoid recalculation on every render
		formattedDate: new Date(conv.updatedAt || conv.createdAt).toLocaleDateString(),
		// Pre-compute message count display
		messageCountDisplay: conv.messages.length === 1 ? '1 message' : `${conv.messages.length} messages`
	}));

	// Watch for message changes and sync to conversation (debounced)
	$: if ($currentConversationId && $messages) {
		debouncedSyncMessages();
	}

	async function sendMessage() {
		const messageContent = messageText.trim();
		if (!messageContent || $loading) return;

		// Clear input immediately
		messageText = '';
		loading.set(true);
		error.set('');

		// Create new conversation immediately if needed (non-blocking)
		if (!$currentConversationId) {
			newConversation();
			// Wait a tick for the new conversation to be set
			await new Promise(resolve => setTimeout(resolve, 0));
		}

		// Create user message
		const userMessage: ChatMessage = {
			id: generateId(),
			content: messageContent,
			sender: 'user',
			aiResponse: '',
			createdAt: new Date().toISOString()
		};

		// Create AI message placeholder
		const aiMessage: ChatMessage = {
			id: generateId(),
			content: '',
			sender: 'ai',
			aiResponse: '',
			createdAt: new Date().toISOString(),
			isStreaming: true
		};

		// Optimistic update - add both messages immediately
		messages.update(msgs => [...msgs, userMessage, aiMessage]);

		// Auto-scroll immediately after adding messages
		setTimeout(scrollToBottom, 50);

		// Update conversation room name if it's the first message
		if ($messages.length === 2) { // Just added user + AI messages
			updateConversationRoomName(messageContent.length > 40 ? messageContent.slice(0, 40) + '…' : messageContent);
		}

		try {
			const history = $messages
				.filter(m => m.sender === 'user' && m.aiResponse) // Only completed message pairs
				.slice(0, -2) // Exclude the current pair we just added
				.map(m => ({ message: m.content, response: m.aiResponse }));

			// Don't send temporary conversation IDs to the API
			// Let the API create a new conversation if needed
			const apiConversationId = $currentConversationId && $currentConversationId.startsWith('temp-') ? undefined : $currentConversationId;

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: messageContent,
					history,
					conversationId: apiConversationId
				})
			});

			if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
				// Handle streaming response
				const reader = response.body?.getReader();
				const decoder = new TextDecoder();
				let streamedResponse = '';

				if (reader) {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						const chunk = decoder.decode(value);
						const lines = chunk.split('\n');

						for (const line of lines) {
							if (line.startsWith('data: ')) {
								try {
									const data = JSON.parse(line.slice(6));
									
									if (data.error) {
										error.set(data.error);
										if (data.error.includes('rate limit') || data.error.includes('quota') || data.error.includes('high demand')) {
											startRetryCountdown(60);
										}
										// Remove the AI message on error
										messages.update(msgs => msgs.filter(m => m.id !== aiMessage.id));
										break;
									}
									
									if (data.chunk) {
										streamedResponse += data.chunk;
										// Update AI message with streaming response
										messages.update(msgs => 
											msgs.map(msg => 
												msg.id === aiMessage.id 
													? { ...msg, aiResponse: streamedResponse }
													: msg
											)
										);
										
										// Auto-scroll during streaming
										setTimeout(smartScrollToBottom, 50);
									}
									
									if (data.done) {
										// Finalize AI message
										messages.update(msgs => 
											msgs.map(msg => 
												msg.id === aiMessage.id 
													? { ...msg, isStreaming: false }
													: msg
											)
										);

										// Update conversation ID if it's new
										if (data.conversationId && $currentConversationId !== data.conversationId) {
											if ($currentConversationId) {
												// Update existing conversation in the list, preserving messages
												conversations.update(convs => 
													convs.map(conv => 
														conv.id === $currentConversationId 
															? { ...conv, id: data.conversationId, messages: $messages }
															: conv
													)
												);
											}
											
											currentConversationId.set(data.conversationId);
											
											// Refresh conversations list to show the new conversation
											setTimeout(() => loadChatHistory(), 100);
										}
									}
								} catch (parseError) {
									console.error('Error parsing streaming data:', parseError);
								}
							}
						}
					}
				}
			} else {
				// Handle JSON response
				const data = await response.json();
				if (response.ok) {
					// Update AI message with response
					messages.update(msgs => 
						msgs.map(msg => 
							msg.id === aiMessage.id 
								? { ...msg, aiResponse: data.response, isStreaming: false }
								: msg
						)
					);

					// Update conversation ID if it's new
					if (data.conversationId && $currentConversationId !== data.conversationId) {
						if ($currentConversationId) {
							// Update existing conversation in the list, preserving messages
							conversations.update(conversations => 
								conversations.map(conv => 
									conv.id === $currentConversationId 
										? { ...conv, id: data.conversationId, messages: $messages }
										: conv
								)
							);
						}
		
						currentConversationId.set(data.conversationId);
						
						// Refresh conversations list to show the new conversation
						setTimeout(() => loadChatHistory(), 100);
					}
				} else {
					error.set(data.error || 'Failed to get response from AI');
					// Remove AI message on error
					messages.update(msgs => msgs.filter(m => m.id !== aiMessage.id));
				}
			}
		} catch (err) {
			console.error('Chat error:', err);
			error.set('An error occurred while sending message. Please try again.');
			// Remove AI message on error
			messages.update(msgs => msgs.filter(m => m.id !== aiMessage.id));
		} finally {
			loading.set(false);
		}
	}

	function startRetryCountdown(seconds: number) {
		retryCountdown = seconds;
		errorRetryCount++;
		if (retryTimer) clearInterval(retryTimer);
		retryTimer = setInterval(() => {
			retryCountdown--;
			if (retryCountdown <= 0) {
				if (retryTimer) clearInterval(retryTimer);
				retryTimer = null;
			}
		}, 1000);
	}

	function clearErrorState() {
		error.set('');
		retryCountdown = 0;
		errorRetryCount = 0;
		if (retryTimer) clearInterval(retryTimer);
		retryTimer = null;
	}

	function canRetryNow(): boolean {
		return retryCountdown <= 0;
	}

	function getTimeUntilRetry(): string {
		if (retryCountdown <= 0) return 'Ready to retry';
		const minutes = Math.floor(retryCountdown / 60);
		const seconds = retryCountdown % 60;
		if (minutes > 0) {
			return `${minutes}m ${seconds}s`;
		}
		return `${seconds}s`;
	}

	async function deleteMessage(messageIndex: number) {
		const messageToDelete = $messages[messageIndex];
		if (!messageToDelete) return;
		
		const messageText = messageToDelete.content.length > 30 ? messageToDelete.content.slice(0, 30) + '…' : messageToDelete.content;
		
		if (!confirm(`Are you sure you want to delete this message?\n\n"${messageText}"\n\n⚠️  PERMANENT DELETION: This message will be permanently erased from:\n• Your local chat history\n• The database\n• All backup systems\n\nThis action cannot be undone and provides guaranteed permanent erasure from all systems.`)) {
			return;
		}

		// Remove the message - this will trigger reactive updates
		messages.update(msgs => msgs.filter((_, index) => index !== messageIndex));
		
		// Update conversation room name if needed
		if (messageIndex === 0 && $messages.length > 0) {
			const firstUserMessage = $messages.find(m => m.sender === 'user');
			if (firstUserMessage) {
				updateConversationRoomName(firstUserMessage.content.length > 40 ? firstUserMessage.content.slice(0, 40) + '…' : firstUserMessage.content);
			}
		}
		
		// If no messages left, reset room name
		if ($messages.length === 0) {
			updateConversationRoomName('New Chat');
		}
	}

	// Modal functions
	function openDeleteModal(id: string, title: string) {
		deleteTarget.set({ id, title });
		showDeleteModal.set(true);
	}

	function closeDeleteModal() {
		showDeleteModal.set(false);
		deleteTarget.set(null);
	}

	async function confirmDeleteConversation() {
		if (!$deleteTarget) return;
		
		const { id, title } = $deleteTarget;
		closeDeleteModal();
		
		// Only delete from database if this is a real conversation (not a temporary one)
		// Temporary conversations have IDs that start with "temp-" and don't exist in the database yet
		const conv = $conversations.find(c => c.id === id);
		if (!conv) return;
		
		if (!id.startsWith('temp-') && (conv.messageCount || 0) > 0) {
			try {
				await fetch('/api/chat', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ conversationIds: [id] })
				});
			} catch (error) {
				console.error('Failed to delete conversation from database:', error);
			}
		}
		
		// Remove from conversations first
		conversations.update(convs => convs.filter(c => c.id !== id));
		
		// Update current conversation if needed - use the updated conversations list
		if ($currentConversationId === id) {
			const remainingConversations = $conversations;
			if (remainingConversations.length > 0) {
				const nextConv = remainingConversations[0];
				currentConversationId.set(nextConv.id);
				messages.set([...nextConv.messages]);
			} else {
				currentConversationId.set(null);
				messages.set([]);
			}
		}
		
		// Debounced save to avoid excessive localStorage writes
		debouncedSaveToStorage();
	}

	async function deleteConversation(id: string) {
		const conv = $conversations.find(c => c.id === id);
		if (!conv) return;
		
		const convTitle = conv.roomName || 'this conversation';
		openDeleteModal(id, convTitle);
	}

	function openDeleteAllModal() {
		deleteAllTarget.set({ title: 'ALL chat history' });
		showDeleteAllModal.set(true);
	}

	function closeDeleteAllModal() {
		showDeleteAllModal.set(false);
		deleteAllTarget.set(null);
	}

	async function confirmDeleteAllConversations() {
		if (!$deleteAllTarget) return;

		closeDeleteAllModal();

		try {
			// Clear all conversations from database for the current user
			await fetch('/api/chat', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({}) // Empty body means clear all for current user
			});
		} catch (error) {
			console.error('Failed to clear chat history from database:', error);
		}

		// Clear all state
		conversations.set([]);
		messages.set([]);
		currentConversationId.set(null);
		
		// Clear local storage
		debouncedSaveToStorage();
	}

	async function clearAllChatHistory() {
		openDeleteAllModal();
	}

	async function handleSignOut() {
		try {
			await fetch('/api/auth/signout', { method: 'POST' });
			window.location.href = '/';
		} catch (error) {
			console.error('Sign out error:', error);
			window.location.href = '/';
		}
	}

	async function loadChatHistory() {
		try {
			const response = await fetch('/api/chat');
			if (response.ok) {
				const data = await response.json();
				if (data.conversations && Array.isArray(data.conversations)) {
					const dbConversations = data.conversations.map((conv: { id: string; roomName?: string; title?: string; createdAt: string; updatedAt: string; messageCount?: number }) => ({
						id: conv.id,
						roomName: conv.roomName || conv.title || 'Untitled Room',
						createdAt: conv.createdAt,
						updatedAt: conv.updatedAt,
						messageCount: conv.messageCount || 0,
						messages: [] // Don't load messages here - just room info
					}));
					
					// Filter out empty conversations from database
					const nonEmptyDbConversations = dbConversations.filter((conv: { messageCount: number }) => conv.messageCount > 0);
					
					// Preserve temporary conversations and merge with database conversations
					const tempConversations = $conversations.filter(conv => conv.id.startsWith('temp-'));
					const mergedConversations = [...tempConversations, ...nonEmptyDbConversations];
					
					// Ensure temporary conversations keep their messages
					const preservedTempConversations = tempConversations.map(tempConv => ({
						...tempConv,
						messages: tempConv.messages || []
					}));
					
					const finalMergedConversations = [...preservedTempConversations, ...nonEmptyDbConversations];
					conversations.set(finalMergedConversations);
					
					// Set current conversation if none is selected
					if (!$currentConversationId && mergedConversations.length > 0) {
						const firstConv = mergedConversations[0];
						currentConversationId.set(firstConv.id);
						// Don't set messages here - they'll be loaded separately when needed
						messages.set([]);
					} else if ($currentConversationId) {
						// Check if current conversation still exists and has messages
						// For temporary conversations, always keep them
						if ($currentConversationId.startsWith('temp-')) {
							// Temporary conversation exists, keep it
						} else {
							const currentConv = mergedConversations.find((c: { id: string; messageCount: number }) => c.id === $currentConversationId);
							if (!currentConv || currentConv.messageCount === 0) {
								// Current conversation is empty or doesn't exist, clear it
								currentConversationId.set(null);
								messages.set([]);
							}
						}
					}
					
					// Debounced save to avoid excessive localStorage writes
					debouncedSaveToStorage();
				}
			}
		} catch (err) {
			console.error('Error loading chat history:', err);
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	// Improved auto-scroll function
	function scrollToBottom() {
		if (messagesContainer) {
			// Use requestAnimationFrame for better timing
			requestAnimationFrame(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			});
		}
	}

	// Check if user is at bottom of messages
	function isAtBottom() {
		if (!messagesContainer) return true;
		const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
		return scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
	}

	// Auto-scroll only if user is already at bottom
	function smartScrollToBottom() {
		if (isAtBottom()) {
			scrollToBottom();
		}
	}

	// Auto-scroll when messages change
	$: if ($messages && messagesContainer) {
		// Delay scroll to ensure DOM is updated
		setTimeout(smartScrollToBottom, 100);
	}
	
	// Process code blocks when AI response changes
	$: if ($messages && aiResponseContainer) {
		// Process code blocks after DOM update
		setTimeout(() => {
			if (aiResponseContainer) {
				processCodeBlocks(aiResponseContainer);
			}
		}, 100);
	}

	// Function to safely render markdown
	function renderMarkdown(text: string): string {
		try {
			// Configure marked options for security and proper rendering
			marked.setOptions({
				breaks: true, // Convert line breaks to <br>
				gfm: true // GitHub Flavored Markdown
			});
			
			// Basic HTML sanitization for security
			const sanitized = text
				.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
				.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
				.replace(/javascript:/gi, '') // Remove javascript: protocol
				.replace(/on\w+\s*=/gi, ''); // Remove event handlers
			
			const result = marked(sanitized);
			// Handle both string and Promise return types
			if (typeof result === 'string') {
				// Apply syntax highlighting to code blocks after markdown parsing
				const highlightedResult = result.replace(
					/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
					(match, lang, code) => {
						if (lang && Prism.languages[lang]) {
							try {
								const highlighted = Prism.highlight(code, Prism.languages[lang], lang);
								return `<pre><code class="language-${lang}">${highlighted}</code></pre>`;
							} catch (err) {
								console.warn('Prism highlighting failed for language:', lang, err);
							}
						}
						return match;
					}
				);
				return highlightedResult;
			} else {
				// If it's a Promise, return the original text for now
				// In a real app, you might want to handle this asynchronously
				return sanitized.replace(/\n/g, '<br>');
			}
		} catch (error) {
			console.error('Markdown rendering error:', error);
			// Fallback to plain text with basic formatting
			return text
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
				.replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
				.replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
				.replace(/\n/g, '<br>'); // Line breaks
		}
	}

	// Function to show toast notifications
	function showToastNotification(message: string, type: 'success' | 'error' | 'info' = 'success') {
		toastMessage.set(message);
		toastType.set(type);
		showToast.set(true);
		
		// Auto-hide after 3 seconds
		setTimeout(() => {
			showToast.set(false);
		}, 3000);
	}

	// Function to copy code to clipboard
	async function copyCodeToClipboard(codeText: string) {
		try {
			await navigator.clipboard.writeText(codeText);
			showToastNotification('Code copied to clipboard!', 'success');
		} catch (err) {
			console.error('Failed to copy code:', err);
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = codeText;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			showToastNotification('Code copied to clipboard!', 'success');
		}
	}

	// Function to process rendered HTML and add copy buttons to code blocks
	function processCodeBlocks(container: HTMLElement) {
		const codeBlocks = container.querySelectorAll('pre code');
		codeBlocks.forEach((codeBlock) => {
			const pre = codeBlock.parentElement;
			if (!pre || pre.querySelector('.copy-button')) return; // Already processed
			
			// Get the language from the class
			const languageClass = Array.from(codeBlock.classList).find(cls => cls.startsWith('language-'));
			const language = languageClass ? languageClass.replace('language-', '') : '';
			
			// Set data attribute for CSS pseudo-element
			pre.setAttribute('data-language', language || 'text');
			
			// Create copy button
			const copyButton = document.createElement('button');
			copyButton.className = 'copy-button';
			copyButton.innerHTML = '📋';
			copyButton.title = 'Copy code';
			
			// Add click handler
			copyButton.addEventListener('click', async () => {
				const codeText = codeBlock.textContent || '';
				await copyCodeToClipboard(codeText);
				
				// Visual feedback
				copyButton.innerHTML = '✅';
				copyButton.classList.add('copied');
				copyButton.title = 'Copied!';
				
				// Reset after 2 seconds
				setTimeout(() => {
					copyButton.innerHTML = '📋';
					copyButton.classList.remove('copied');
					copyButton.title = 'Copy code';
				}, 2000);
			});
			
			pre.appendChild(copyButton);
		});
	}
</script>

<svelte:head>
	<title>Vanar AI Assistant - The Chain That Thinks</title>
	<style>
		/* Markdown content styling */
		.prose {
			line-height: 1.6;
		}
		
		.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
			margin-top: 1.5em;
			margin-bottom: 0.5em;
			font-weight: 600;
			color: #1f2937;
		}
		
		.prose h1 { font-size: 1.5em; }
		.prose h2 { font-size: 1.25em; }
		.prose h3 { font-size: 1.125em; }
		
		.prose p {
			margin-bottom: 1em;
		}
		
		.prose ul, .prose ol {
			margin-bottom: 1em;
			padding-left: 1.5em;
		}
		
		.prose li {
			margin-bottom: 0.25em;
		}
		
		.prose strong {
			font-weight: 600;
			color: #1f2937;
		}
		
		.prose em {
			font-style: italic;
		}
		
		.prose code {
			background-color: #f3f4f6;
			padding: 0.125rem 0.25rem;
			border-radius: 0.25rem;
			font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
			font-size: 0.875em;
		}
		
		.prose pre {
			background-color: #1f2937;
			color: #f9fafb;
			padding: 1rem;
			border-radius: 0.5rem;
			overflow-x: auto;
			margin: 1em 0;
		}
		
		.prose pre code {
			background-color: transparent;
			padding: 0;
			color: inherit;
		}
		
		/* Enhanced code block styling with copy button */
		.prose pre {
			position: relative;
			background-color: #1f2937;
			color: #f9fafb;
			padding: 1rem;
			border-radius: 0.5rem;
			overflow-x: auto;
			margin: 1em 0;
			border: 1px solid #374151;
		}
		
		.prose pre::before {
			content: attr(data-language);
			position: absolute;
			top: 0.5rem;
			right: 3rem;
			font-size: 0.75rem;
			color: #9ca3af;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			background-color: #374151;
			padding: 0.25rem 0.5rem;
			border-radius: 0.25rem;
			z-index: 10;
			pointer-events: none;
		}
		
		.prose pre .copy-button {
			position: absolute;
			top: 0.5rem;
			right: 0.5rem;
			background-color: #374151;
			color: #9ca3af;
			border: none;
			padding: 0.25rem 0.5rem;
			border-radius: 0.25rem;
			font-size: 0.75rem;
			cursor: pointer;
			transition: all 0.2s ease;
			z-index: 10;
			min-width: 2rem;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		
		.prose pre .copy-button:hover {
			background-color: #4b5563;
			color: #f9fafb;
		}
		
		.prose pre .copy-button:active {
			transform: scale(0.95);
		}
		
		.prose pre .copy-button.copied {
			background-color: #059669;
			color: #f9fafb;
		}
		
		/* Inline code styling */
		.prose code:not(pre code) {
			background-color: #f3f4f6;
			padding: 0.125rem 0.25rem;
			border-radius: 0.25rem;
			font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
			font-size: 0.875em;
			color: #1f2937;
			border: 1px solid #e5e7eb;
		}
		
		/* Prism.js syntax highlighting overrides */
		.prose pre .token.comment,
		.prose pre .token.prolog,
		.prose pre .token.doctype,
		.prose pre .token.cdata {
			color: #6b7280;
		}
		
		.prose pre .token.punctuation {
			color: #e5e7eb;
		}
		
		.prose pre .token.property,
		.prose pre .token.tag,
		.prose pre .token.boolean,
		.prose pre .token.number,
		.prose pre .token.constant,
		.prose pre .token.symbol {
			color: #93c5fd;
		}
		
		.prose pre .token.selector,
		.prose pre .token.attr-name,
		.prose pre .token.string,
		.prose pre .token.char,
		.prose pre .token.builtin {
			color: #86efac;
		}
		
		.prose pre .token.operator,
		.prose pre .token.entity,
		.prose pre .token.url,
		.prose pre .language-css .token.string,
		.prose pre .style .token.string {
			color: #fbbf24;
		}
		
		.prose pre .token.atrule,
		.prose pre .token.attr-value,
		.prose pre .token.keyword {
			color: #c084fc;
		}
		
		.prose pre .token.function,
		.prose pre .token.class-name {
			color: #fca5a5;
		}
		
		.prose pre .token.regex,
		.prose pre .token.important,
		.prose pre .token.variable {
			color: #f9a8d4;
		}
		
		.prose blockquote {
			border-left: 4px solid #e5e7eb;
			padding-left: 1rem;
			margin: 1em 0;
			color: #6b7280;
			font-style: italic;
		}
		
		.prose table {
			width: 100%;
			border-collapse: collapse;
			margin: 1em 0;
			font-size: 0.875em;
			overflow-x: auto;
			display: block;
		}
		
		.prose th, .prose td {
			border: 1px solid #e5e7eb;
			padding: 0.5rem 0.75rem;
			text-align: left;
			min-width: 100px;
		}
		
		.prose th {
			background-color: #f9fafb;
			font-weight: 600;
			color: #374151;
			white-space: nowrap;
		}
		
		.prose tr:nth-child(even) {
			background-color: #f9fafb;
		}
		
		.prose tr:hover {
			background-color: #f3f4f6;
		}
		
		/* Mobile table responsiveness */
		@media (max-width: 640px) {
			.prose table {
				font-size: 0.75em;
			}
			
			.prose th, .prose td {
				padding: 0.25rem 0.5rem;
				min-width: 80px;
			}
		}
		
		/* Mobile code block responsiveness */
		@media (max-width: 640px) {
			.prose pre {
				padding: 0.75rem;
				font-size: 0.75em;
			}
			
			.prose pre::before {
				font-size: 0.625rem;
				padding: 0.125rem 0.375rem;
				top: 0.375rem;
				right: 2.5rem;
			}
			
			.prose pre .copy-button {
				padding: 0.125rem 0.375rem;
				font-size: 0.625rem;
				top: 0.375rem;
				right: 0.375rem;
			}
		}
		
		.prose a {
			color: #3b82f6;
			text-decoration: underline;
		}
		
		.prose a:hover {
			color: #2563eb;
		}
		
		.prose hr {
			border: none;
			border-top: 1px solid #e5e7eb;
			margin: 2em 0;
		}
	</style>
</svelte:head>

<div class="min-h-screen bg-animated">
	<!-- Navigation -->
	<nav class="chatbot-nav">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<h1 class="text-xl font-bold text-white flex items-center gap-2">
							<span class="text-2xl animate-bot-glow">🤖</span>
							Auth App
						</h1>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<button
							on:click={() => goto('/dashboard')}
							class="nav-link"
						>
							<span class="nav-icon">📊</span>
							Dashboard
						</button>
						<button
							on:click={() => goto('/chat')}
							class="nav-link active"
						>
							<span class="nav-icon">💬</span>
							AI Chat
						</button>
						<button
							on:click={() => goto('/profile')}
							class="nav-link"
						>
							<span class="nav-icon">👤</span>
							Profile
						</button>
						{#if user?.role === 'admin'}
							<button
								on:click={() => goto('/admin')}
								class="nav-link"
							>
								<span class="nav-icon">⚙️</span>
								Admin Panel
							</button>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-4">
					<span class="text-sm text-gray-300">
						Welcome, {user.name || user.email}
					</span>
					<button
						on:click={handleSignOut}
						class="dark-button-secondary"
					>
						🚪 Sign Out
					</button>
				</div>
			</div>
		</div>
	</nav>

	<!-- Chat Interface -->
	<div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<!-- Chat History Sidebar -->
			<div class="lg:col-span-1">
				<div class="rounded-2xl bg-gradient-to-br from-white via-gray-50 to-white shadow-2xl border border-gray-100 h-full backdrop-blur-sm">
					<div class="p-6 border-b border-gray-200/60 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white/50 rounded-t-2xl">
						<div class="flex items-center space-x-3">
							<div class="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
								</svg>
							</div>
							<div>
								<h3 class="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Chat Rooms</h3>
								<p class="text-xs text-gray-500 font-medium">Your conversations</p>
							</div>
						</div>
						<div class="flex space-x-2">
							<button 
								on:click={newConversation} 
								class="group relative inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-105 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white transform hover:-translate-y-0.5" 
								aria-label="Start a new conversation room"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
								New Room
								<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							</button>
						</div>
					</div>
					<div class="p-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style="contain: layout style paint;">
						{#if $error && ($error.includes('rate limit') || $error.includes('quota') || $error.includes('high demand'))}
							<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div class="flex items-start text-yellow-800">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 mt-0.5 flex-shrink-0">
										<circle cx="12" cy="12" r="10"/>
										<path d="M12 6v6l4 2"/>
									</svg>
									<div class="text-xs">
										<strong>Service Notice:</strong> AI service is currently experiencing high demand.
										{#if retryCountdown > 0}
											<br><span class="text-yellow-700">Retry available in: {getTimeUntilRetry()}</span>
										{:else}
											<br>This usually resolves within a few minutes.
										{/if}
									</div>
								</div>
							</div>
						{/if}
						
						{#if memoizedConversations.length === 0}
							<div class="text-center py-12">
								<div class="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-200 flex items-center justify-center mx-auto mb-6 shadow-lg border border-indigo-200/50">
									<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
								</div>
								<h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">No chat rooms yet</h3>
								<p class="text-sm text-gray-600 mb-6 leading-relaxed">Create your first room to start chatting with Vanar AI</p>
								<button on:click={newConversation} class="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" aria-label="Create your first chat room">
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 transition-transform duration-300 group-hover:rotate-90" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
									Create Room
								</button>
							</div>
						{:else}
							{#each memoizedConversations as conv (conv.id)}
								{#key conv.id}
								<div 
									class="group w-full mb-4 p-4 rounded-xl transition-all duration-300 cursor-pointer border-2 {$currentConversationId === conv.id ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 shadow-lg shadow-indigo-100/50' : 'bg-white/80 border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:border-gray-300 hover:shadow-md hover:shadow-gray-200/50'}" 
									on:click={() => selectConversation(conv.id)}
									on:keydown={(e) => e.key === 'Enter' && selectConversation(conv.id)}
									role="button"
									tabindex="0"
									aria-label="Select conversation: {conv.roomName}"
									aria-pressed={$currentConversationId === conv.id}
								>
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-3 flex-1 min-w-0">
											<div class="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 {$currentConversationId === conv.id ? 'shadow-md' : 'shadow-sm'}">
												<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600">
													<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
												</svg>
											</div>
											<div class="min-w-0 flex-1">
												<p class="text-sm font-semibold text-gray-800 truncate leading-tight">{$currentConversationId === conv.id ? conv.roomName : conv.roomName}</p>
												<p class="text-xs text-gray-500 mt-0.5">{$currentConversationId === conv.id ? 'Active' : conv.messageCountDisplay}</p>
											</div>
										</div>
										<button 
											on:click={(e) => { e.stopPropagation(); deleteConversation(conv.id).catch(console.error); }} 
											class="group/delete relative text-gray-400 hover:text-red-500 text-xs p-2 rounded-lg hover:bg-red-50 transition-all duration-300 flex-shrink-0 border border-transparent hover:border-red-200 hover:shadow-md hover:scale-110 opacity-0 group-hover:opacity-100"
											title="Delete conversation"
											aria-label="Delete conversation: {conv.roomName}"
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover/delete:rotate-12" aria-hidden="true">
												<path d="M3 6h18"/>
												<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
												<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
											</svg>
											<div class="absolute inset-0 rounded-lg bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover/delete:opacity-100 transition-opacity duration-300"></div>
										</button>
									</div>
								</div>
								{/key}
							{/each}
						{/if}
					</div>
					
					<!-- Clear All History Button -->
					{#if memoizedConversations.length > 0}
						<div class="p-6 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/30 to-white/30 rounded-b-2xl">
							<button
								on:click={clearAllChatHistory}
								class="w-full group relative inline-flex items-center justify-center px-4 py-3 text-sm font-semibold text-red-600 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl hover:from-red-100 hover:to-red-200 hover:border-red-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
								aria-label="Clear all chat history"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 transition-transform duration-300 group-hover:rotate-12">
									<path d="M3 6h18"/>
									<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
									<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
								</svg>
								Clear All History
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Main Chat Interface -->
			<div class="lg:col-span-3">
				<div class="rounded-xl bg-white shadow-lg overflow-hidden">
					<!-- Chat Header -->
					<div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<div class="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
									<img src="/src/lib/assets/images-removebg-preview.png" alt="Vanar Chain" class="w-8 h-8" />
								</div>
								<div>
									<h2 class="text-lg font-semibold text-white">Vanar AI Assistant</h2>
									<p class="text-sm text-indigo-200">The Chain That Thinks • Powered by Vanar</p>
								</div>
							</div>
							<div class="flex items-center space-x-2">
								{#if $error && ($error.includes('rate limit') || $error.includes('quota') || $error.includes('high demand'))}
									<div class="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
									<span class="text-sm text-yellow-200">
										{retryCountdown > 0 ? `Busy (${getTimeUntilRetry()})` : 'Service Busy'}
									</span>
								{:else if $error}
									<div class="h-2 w-2 rounded-full bg-red-400 animate-pulse"></div>
									<span class="text-sm text-red-200">Service Error</span>
								{:else}
									<div class="h-2 w-2 rounded-full bg-green-400"></div>
									<span class="text-sm text-white">Online</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- Messages Container -->
					<div class="relative">
						<div bind:this={messagesContainer} class="min-h-[400px] max-h-[70vh] overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white scroll-smooth">
						{#if $messages.length === 0}
							<div class="flex flex-col items-center justify-center h-full text-center">
								<div class="h-32 w-32 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
									<img src="/4bcb1fb72d1d08efa44efa5ceb712ec7.gif" alt="Vanar AI" class="w-24 h-24 rounded-lg" />
								</div>
								<br>
								<h3 class="text-xl font-semibold text-gray-900 mb-2">Welcome to Vanar AI Assistant</h3>
								<p class="text-gray-500 max-w-md">
									Hi! I'm Vanar, your AI assistant from Vanar Chain. Ask me about anything!
								</p>
								{#if $error && ($error.includes('rate limit') || $error.includes('quota') || $error.includes('high demand'))}
									<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
										<div class="flex items-center text-yellow-800">
											<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
												<circle cx="12" cy="12" r="10"/>
												<path d="M12 6v6l4 2"/>
											</svg>
											<div class="text-sm">
												AI service is currently busy. You can still ask questions, but responses may be delayed.
												{#if retryCountdown > 0}
													<br><span class="text-yellow-700 text-xs">Retry available in: {getTimeUntilRetry()}</span>
												{/if}
											</div>
										</div>
									</div>
								{/if}
								<div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
									<button 
										on:click={() => { messageText = "What is Vanar Chain?"; sendMessage(); }}
										class="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 text-sm font-medium border border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow-md"
										aria-label="Ask about Vanar Chain"
									>
										🔗 About Vanar Chain
									</button>
									<button 
										on:click={() => { messageText = "Explain Neutron and Kayon technology"; sendMessage(); }}
										class="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 text-sm font-medium border border-purple-200 hover:border-purple-300 shadow-sm hover:shadow-md"
										aria-label="Ask about AI technology"
									>
										🧠 AI Technology
									</button>
									<button 
										on:click={() => { messageText = "How does PayFi work on Vanar?"; sendMessage(); }}
										class="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-sm font-medium border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md"
										aria-label="Ask about PayFi solutions"
									>
										💰 PayFi Solutions
									</button>
									<button 
										on:click={() => { messageText = "Tell me about $VANRY token"; sendMessage(); }}
										class="p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 text-green-700 hover:from-green-100 hover:to-green-200 transition-all duration-200 text-sm font-medium border border-green-200 hover:border-green-300 shadow-sm hover:shadow-md"
										aria-label="Ask about VANRY token"
									>
										🪙 $VANRY Token
									</button>
								</div>
								
								<!-- Data Privacy & Deletion Policy -->
								<div class="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
									<div class="text-center">
										<div class="flex items-center justify-center mb-2">
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 mr-2">
												<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
											</svg>
											<h4 class="text-sm font-semibold text-blue-800">Data Privacy & Deletion Policy</h4>
										</div>
										<div class="text-xs text-blue-700 space-y-1">
											<p><strong>Guaranteed Permanent Erasure:</strong> When you delete chats or messages, they are permanently erased from all systems including local storage, database, and backup systems. This provides guaranteed permanent erasure with no data retention.</p>
											
										</div>
									</div>
								</div>
							</div>
						{:else}
							<!-- Messages hint -->
							<div class="mb-4 text-center">
								<p class="text-xs text-gray-400 italic">💡 Hover over messages to delete individual ones • All deletions provide guaranteed permanent erasure from all systems</p>
							</div>
							{#each $messages as messageItem, idx (messageItem.id)}
								<!-- User Message -->
								{#if messageItem.sender === 'user'}
									<div class="flex justify-end mb-2 group hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors duration-200">
										<div class="flex items-end space-x-2 max-w-xl relative">
											<div class="rounded-2xl rounded-br-sm bg-gradient-to-r from-slate-800 to-gray-900 px-4 py-3 text-white shadow-lg border border-slate-700">
												<p class="text-sm leading-relaxed">{messageItem.content}</p>
											</div>
											<div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
												<span class="text-sm">👤</span>
											</div>
											<!-- Delete button for user message -->
											<button
												on:click={() => deleteMessage(idx)}
												class="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg hover:shadow-xl hover:scale-125 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
												aria-label="Delete message"
												title="Delete message"
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover:rotate-90">
													<path d="M18 6L6 18M6 6l12 12"/>
												</svg>
											</button>
										</div>
									</div>
								{:else}
									<!-- AI Response -->
									<div class="flex justify-start mb-6 group hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors duration-200">
										<div class="flex items-end space-x-2 max-w-xl relative">
											<div class="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
												<img src="/src/lib/assets/images-removebg-preview.png" alt="Vanar Chain" class="w-5 h-5" />
											</div>
											<div class="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 shadow-lg border border-slate-200">
												{#if messageItem.sender === 'ai'}
													{#if messageItem.isStreaming}
														<!-- Streaming AI Response -->
														<div class="text-sm leading-relaxed text-slate-800 prose prose-sm max-w-none" bind:this={aiResponseContainer}>
															{#if messageItem.aiResponse && messageItem.aiResponse.length > 0}
																<!-- Show partial response with cursor -->
																<span>{@html renderMarkdown(messageItem.aiResponse)}</span>
																<span class="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-1"></span>
															{:else}
																<!-- Show placeholder while waiting for first chunk -->
																
																<span class="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-1"></span>
															{/if}
														</div>
														
														<!-- Streaming status indicator -->
														<div class="flex items-center mt-2 space-x-2">
															<div class="flex items-center space-x-1">
																<div class="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></div>
																<div class="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" style="animation-delay: 0.2s"></div>
																<div class="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" style="animation-delay: 0.4s"></div>
															</div>
															<span class="text-xs text-indigo-600 font-medium">Vanar AI is typing...</span>
														</div>
													{:else if messageItem.aiResponse && messageItem.aiResponse.length > 0}
														<!-- Final AI Response -->
														<div class="text-sm leading-relaxed text-slate-800 prose prose-sm max-w-none" bind:this={aiResponseContainer}>
															{@html renderMarkdown(messageItem.aiResponse)}
														</div>
														
														<!-- Timestamp -->
														<p class="mt-2 text-xs text-gray-400">
															{new Date(messageItem.createdAt).toLocaleTimeString()}
														</p>
													{:else}
														<!-- No response yet -->
														<div class="text-sm text-gray-400 italic">
															No response received
														</div>
													{/if}
												{:else}
													<!-- User message content is handled elsewhere -->
												{/if}
											</div>
											<!-- Delete button for AI response -->
											<button
												on:click={() => deleteMessage(idx)}
												class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg hover:shadow-xl hover:scale-125 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
												aria-label="Delete message"
												title="Delete message"
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover:rotate-90">
													<path d="M18 6L6 18M6 6l12 12"/>
												</svg>
											</button>
										</div>
									</div>
								{/if}
							{/each}
						{/if}
					</div>
					
					<!-- Scroll to Bottom Button -->
					{#if $messages.length > 2 && !isAtBottom()}
						<button
							on:click={scrollToBottom}
							class="absolute bottom-4 right-4 p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg border border-indigo-400 hover:border-indigo-500 transition-all duration-200 animate-bounce"
							aria-label="Scroll to bottom"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M7 13l5 5 5-5"/>
								<path d="M7 6l5 5 5-5"/>
							</svg>
						</button>
					{/if}
				</div>

				<!-- Error Display -->
					{#if $error}
						<div class="px-6 pb-4">
							<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
								<div class="flex items-start justify-between">
									<div class="flex items-start">
										<span class="text-red-600 mr-2 mt-0.5">⚠️</span>
										<div class="flex-1">
											<span class="text-red-700 text-sm font-medium">{$error}</span>
											{#if $error.includes('rate limit') || $error.includes('quota') || $error.includes('high demand')}
												<div class="mt-2 space-y-2">
													<p class="text-red-600 text-xs">
														This usually resolves within a few minutes. You can try again or wait a bit.
													</p>
													{#if retryCountdown > 0}
														<div class="flex items-center space-x-2">
															<div class="flex items-center space-x-1">
																<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
																	<circle cx="12" cy="12" r="10"/>
																	<path d="M12 6v6l4 2"/>
																</svg>
																<span class="text-xs text-red-600 font-medium">
																	Retry available in: {getTimeUntilRetry()}
																</span>
															</div>
															<!-- Progress bar for retry countdown -->
															<div class="w-16 h-1.5 bg-red-200 rounded-full overflow-hidden">
																<div 
																	class="h-full bg-red-500 transition-all duration-1000 ease-linear"
																	style="width: {((60 - retryCountdown) / 60) * 100}%"
																></div>
															</div>
														</div>
													{/if}
													{#if errorRetryCount > 1}
														<p class="text-xs text-red-500">
															Attempt {errorRetryCount}: Multiple retries may indicate ongoing service issues
														</p>
													{/if}
												</div>
											{/if}
										</div>
									</div>
									<button 
										on:click={clearErrorState}
										class="text-red-400 hover:text-red-600 transition-colors ml-2"
										aria-label="Dismiss error message"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M18 6L6 18M6 6l12 12"/>
										</svg>
									</button>
								</div>
								{#if $error.includes('rate limit') || $error.includes('quota') || $error.includes('high demand')}
									<div class="mt-3 pt-3 border-t border-red-200">
										<div class="flex items-center justify-between">
											<button 
												on:click={() => { clearErrorState(); sendMessage(); }}
												disabled={!canRetryNow()}
												class="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												aria-label="Retry sending message"
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
													<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 12"/>
													<path d="M21 3v9h-9"/>
												</svg>
												{canRetryNow() ? 'Retry Now' : `Wait ${getTimeUntilRetry()}`}
											</button>
											{#if retryCountdown > 0}
												<div class="text-xs text-red-500">
													Next retry: {getTimeUntilRetry()}
												</div>
											{/if}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Message Input -->
					<div class="border-t border-gray-200 bg-white p-6">
						{#if $error && ($error.includes('rate limit') || $error.includes('quota') || $error.includes('high demand'))}
							<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div class="flex items-center text-yellow-800">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
										<circle cx="12" cy="12" r="10"/>
										<path d="M12 6v6l4 2"/>
									</svg>
									<span class="text-sm">
										<strong>Service Status:</strong> AI service is currently busy
										{#if retryCountdown > 0}
											• Retry available in: {getTimeUntilRetry()}
										{/if}
									</span>
								</div>
							</div>
						{/if}
						<div class="flex space-x-4">
							<div class="flex-1">
								<div class="relative">
									<textarea
										bind:value={messageText}
										on:keydown={handleKeyPress}
										placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
										rows="2"
										maxlength="2000"
										class="
											block w-full resize-none rounded-xl border-gray-300 shadow-sm
											focus:border-indigo-500 focus:ring-indigo-500 pr-12 bg-gray-50
											focus:bg-white transition-all duration-200 ease-in-out
											disabled:opacity-75 disabled:cursor-not-allowed
											px-4 py-3
											leading-normal
											text-gray-800
											placeholder-gray-400
											scroll-pb-3 scroll-pt-3
											whitespace-pre-wrap
										"
										aria-label="Type your message to Vanar AI"
										aria-disabled={$loading}
										disabled={$loading}
									></textarea>
									<div class="absolute right-3 bottom-3 text-xs text-gray-400">
										{messageText.length}/2000
									</div>
								</div>
							</div>
							<div class="flex flex-col space-y-2">
								<button
									on:click={sendMessage}
									disabled={$loading || !messageText.trim() || messageText.length > 2000}
									class="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-3 text-white font-medium hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl shadow-lg"
									aria-label="Send message to Vanar AI"
								>
									<span class="flex items-center">
										{#if $loading}
											<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Processing...
										{:else}
											✨ Send
										{/if}
									</span>
									<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								</button>
								{#if messageText.trim()}
									<button
										on:click={() => { messageText = ''; }}
										class="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 px-6 py-2 text-gray-600 hover:from-gray-200 hover:via-gray-300 hover:to-gray-400 transition-all duration-300 ease-out hover:scale-105 hover:shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
										aria-label="Clear message input"
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
										<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									</button>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Delete Confirmation Modal -->
	{#if $showDeleteModal && $deleteTarget}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
			<!-- Background overlay -->
<div
class="fixed inset-0 bg-opacity-10 transition-opacity duration-300"
aria-hidden="true"
on:click={closeDeleteModal}>
</div>


			<!-- Modal panel -->
			<div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden transform transition-all">
				<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
					<div class="sm:flex sm:items-start">
						<div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
							<svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
						</div>
						<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
							<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
								Delete Conversation
							</h3>
							<div class="mt-2">
								<p class="text-sm text-gray-500">
									Are you sure you want to delete <strong>"{$deleteTarget.title}"</strong>?
								</p>
								<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
									<div class="flex items-start">
										<svg class="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
											<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
										</svg>
										<div class="text-sm text-red-700">
											<strong>PERMANENT DELETION:</strong> This entire conversation will be permanently erased from:
											<ul class="mt-1 ml-4 list-disc">
												<li>Your local chat history</li>
												<li>The database</li>
												<li>All backup systems</li>
											</ul>
											<p class="mt-2 font-medium">This action cannot be undone and provides guaranteed permanent erasure from all systems.</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
					<button
						type="button"
						class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
						on:click={confirmDeleteConversation}
					>
						Delete Conversation
					</button>
					<button
						type="button"
						class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
						on:click={closeDeleteModal}
					>
						Cancel
					</button>
					</div>
			</div>
		</div>
	{/if}

	<!-- Delete All Confirmation Modal -->
	{#if $showDeleteAllModal && $deleteAllTarget}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby="modal-title-all" role="dialog" aria-modal="true">
			<!-- Background overlay -->
			<div
				class="fixed inset-0 bg-opacity-50 transition-opacity duration-300"
				aria-hidden="true"
				on:click={closeDeleteAllModal}>
			</div>

			<!-- Modal panel -->
			<div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden transform transition-all">
				<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
					<div class="sm:flex sm:items-start">
						<div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
							<svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
						</div>
						<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
							<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title-all">
								Clear All Chat History
							</h3>
							<div class="mt-2">
								<p class="text-sm text-gray-500">
									Are you sure you want to clear <strong>{$deleteAllTarget.title}</strong>?
								</p>
								<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
									<div class="flex items-start">
										<svg class="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
											<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
										</svg>
										<div class="text-sm text-red-700">
											<strong>PERMANENT DELETION:</strong> ALL conversations and messages will be permanently erased from:
											<ul class="mt-1 ml-4 list-disc">
												<li>Your local chat history</li>
												<li>The database</li>
												<li>All backup systems</li>
											</ul>
											<p class="mt-2 font-medium">This action cannot be undone and provides guaranteed permanent erasure from all systems.</p>
											<p class="mt-1 font-medium text-red-800">This will remove ALL your chat data permanently.</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
					<button
						type="button"
						class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
						on:click={confirmDeleteAllConversations}
					>
						Clear All History
					</button>
					<button
						type="button"
						class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
						on:click={closeDeleteAllModal}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Toast Notification -->
	{#if $showToast}
		<div class="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-out">
			<div class="rounded-lg shadow-lg border px-4 py-3 max-w-sm {$toastType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : $toastType === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}">
				<div class="flex items-center space-x-2">
					{#if $toastType === 'success'}
						<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
					{:else if $toastType === 'error'}
						<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
					{:else}
						<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
						</svg>
					{/if}
					<span class="text-sm font-medium">{$toastMessage}</span>
				</div>
			</div>
		</div>
	{/if}
</div>