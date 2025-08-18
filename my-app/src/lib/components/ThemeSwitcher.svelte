<script lang="ts">
	import { colors, rainbowColors, natureColors, sunsetColors, oceanColors, purpleColors, darkColors } from '$lib/config/colors';
	
	let currentTheme = $state('default');
	let showSwitcher = $state(false);
	
	const themes = [
		{ name: 'Default (Blue/Purple)', value: 'default', colors: colors },
		{ name: '🌈 Rainbow (Pink/Indigo)', value: 'rainbow', colors: rainbowColors },
		{ name: '🍃 Nature (Green/Emerald)', value: 'nature', colors: natureColors },
		{ name: '🌅 Sunset (Orange/Red)', value: 'sunset', colors: sunsetColors },
		{ name: '🌊 Ocean (Cyan/Blue)', value: 'ocean', colors: oceanColors },
		{ name: '🎨 Purple (Purple/Violet)', value: 'purple', colors: purpleColors },
		{ name: '🖤 Dark (Gray/Black)', value: 'dark', colors: darkColors }
	];
	
	function switchTheme(themeName: string) {
		currentTheme = themeName;
		showSwitcher = false;
		
		// Store in localStorage for persistence
		localStorage.setItem('selectedTheme', themeName);
		
		// Reload page to apply theme
		window.location.reload();
	}
	
	function getGradientClasses(themeColors: any) {
		return `bg-gradient-to-br ${themeColors.primary.light} ${themeColors.secondary.light}`;
	}
</script>

<!-- Theme Switcher Button -->
<div class="fixed bottom-4 right-4 z-50">
	<button
		on:click={() => showSwitcher = !showSwitcher}
		class="bg-white shadow-lg rounded-full p-3 hover:shadow-xl transition-all duration-200 border border-gray-200"
		title="Change Theme"
	>
		🎨
	</button>
	
	{#if showSwitcher}
		<!-- Theme Options -->
		<div class="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64">
			<h3 class="text-sm font-semibold text-gray-900 mb-3">Choose Theme</h3>
			
			<div class="space-y-2">
				{#each themes as theme}
					<button
						on:click={() => switchTheme(theme.value)}
						class="w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md {currentTheme === theme.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}"
					>
						<div class="flex items-center space-x-3">
							<!-- Color Preview -->
							<div class="w-8 h-8 rounded-lg {getGradientClasses(theme.colors)} border border-gray-200"></div>
							
							<!-- Theme Info -->
							<div class="flex-1">
								<div class="text-sm font-medium text-gray-900">{theme.name}</div>
								<div class="text-xs text-gray-500">
									{currentTheme === theme.value ? 'Current Theme' : 'Click to apply'}
								</div>
							</div>
							
							<!-- Checkmark for current theme -->
							{#if currentTheme === theme.value}
								<div class="text-blue-500">✓</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
			
			<!-- Instructions -->
			<div class="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
				💡 Tip: Changes will reload the page to apply the new theme
			</div>
		</div>
	{/if}
</div>

<!-- Backdrop to close switcher -->
{#if showSwitcher}
	<div 
		class="fixed inset-0 z-40" 
		on:click={() => showSwitcher = false}
	></div>
{/if}
