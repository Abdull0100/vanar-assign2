import { writable, get } from 'svelte/store';
import {
	fetchUsers,
	fetchUsersStats,
	fetchAdminActions,
	fetchUserActivities as apiFetchUserActivities,
	fetchUserDetails as apiFetchUserDetails,
	fetchUserStats as apiFetchUserStats,
	updateUserRole as apiUpdateUserRole,
	toggleUserStatus as apiToggleUserStatus,
	deleteUser as apiDeleteUser
} from './admin';

// Types
export interface AdminUser {
	id: string;
	name: string;
	email: string;
	role: string;
	createdAt: string;
	emailVerified: string | null;
	stats: any;
}

export interface AnalyticsData {
	todayConversations: number;
	todayLogins: number;
	totalUsers: number;
	totalActivities: number;
	conversationsTrend: any[];
	activityBreakdown: any[];
}

export interface AdminState {
	users: AdminUser[];
	loading: boolean;
	error: string;
	success: string;
	activeTab: 'overview' | 'users' | 'activities';
	userStats: any;
	recentActivity: any[];
	mostActiveUsers: any[];
	selectedUser: any;
	userActivities: any[];
	userSessions: any[];
	adminActions: any[];
	allRecentActivities: any[];
	modalActiveTab: 'sessions' | 'activities' | 'stats';
	activitiesPage: number;
	activitiesPerPage: number;
	searchQuery: string;
	selectedActivityType: string;
	selectedDateRange: string;
	selectedUserRole: string;
	selectedSpecificActivity: string;
	analyticsData: AnalyticsData;
	autoRefresh: boolean;
  sseConnected?: boolean;
}

// Initial state
const initialState: AdminState = {
	users: [],
	loading: true,
	error: '',
	success: '',
	activeTab: 'overview',
	userStats: null,
	recentActivity: [],
	mostActiveUsers: [],
	selectedUser: null,
	userActivities: [],
	userSessions: [],
	adminActions: [],
	allRecentActivities: [],
	modalActiveTab: 'sessions',
	activitiesPage: 1,
	activitiesPerPage: 10,
	searchQuery: '',
	selectedActivityType: '',
	selectedDateRange: 'all',
	selectedUserRole: '',
	selectedSpecificActivity: '',
	analyticsData: {
		todayConversations: 0,
		todayLogins: 0,
		totalUsers: 0,
		totalActivities: 0,
		conversationsTrend: [],
		activityBreakdown: []
	},
	autoRefresh: false
};

// Create the store
export const adminStore = writable<AdminState>(initialState);

// Modal stores
export const showDeleteModal = writable(false);
export const deleteTarget = writable<{ id: string; name: string } | null>(null);

// State management functions
export function setLoading(loading: boolean) {
	adminStore.update(state => ({ ...state, loading }));
}

export function setError(error: string) {
	adminStore.update(state => ({ ...state, error }));
}

export function setSuccess(success: string) {
	adminStore.update(state => ({ ...state, success }));
}

export function clearMessages() {
	adminStore.update(state => ({ ...state, error: '', success: '' }));
}

export function setActiveTab(tab: 'overview' | 'users' | 'activities') {
	adminStore.update(state => ({ ...state, activeTab: tab }));
}

export function setModalActiveTab(tab: 'sessions' | 'activities' | 'stats') {
	adminStore.update(state => ({ ...state, modalActiveTab: tab }));
}

export function setActivitiesPage(page: number) {
	adminStore.update(state => ({ ...state, activitiesPage: page }));
}

export function setSearchQuery(query: string) {
	adminStore.update(state => ({ ...state, searchQuery: query }));
}

export function setSelectedActivityType(type: string) {
	adminStore.update(state => ({ ...state, selectedActivityType: type }));
}

export function setSelectedDateRange(range: string) {
	adminStore.update(state => ({ ...state, selectedDateRange: range }));
}

export function setSelectedUserRole(role: string) {
	adminStore.update(state => ({ ...state, selectedUserRole: role }));
}

export function setSelectedSpecificActivity(activity: string) {
	adminStore.update(state => ({ ...state, selectedSpecificActivity: activity }));
}

export function setAutoRefresh(enabled: boolean) {
	adminStore.update(state => ({ ...state, autoRefresh: enabled }));
}

// Data loading functions
export async function loadData() {
	try {
		setLoading(true);
		await Promise.all([
			loadUsers(),
			loadUserStats(),
			loadRecentActivity(),
			loadAllRecentActivities()
		]);
	} catch (err) {
		setError('Failed to load data');
	} finally {
		setLoading(false);
	}
}

export async function loadUsers() {
	try {
		const data = await fetchUsers();
		adminStore.update(state => ({ ...state, users: data.users }));
	} catch (err) {
		setError('An error occurred while loading users');
	}
}

export async function loadUserStats() {
	try {
		const data = await fetchUsersStats();
		adminStore.update(state => ({
			...state,
			userStats: data.overview,
			mostActiveUsers: data.mostActiveUsers
		}));
	} catch (err) {
		console.error('Failed to load user stats:', err);
	}
}

export async function loadRecentActivity() {
	try {
		const data = await fetchAdminActions(20);
		adminStore.update(state => ({ ...state, adminActions: data.actions }));
	} catch (err) {
		console.error('Failed to load recent activity:', err);
	}
}

export async function loadAllRecentActivities() {
	try {
		const activitiesData = await apiFetchUserActivities();
		const userActivities = activitiesData.activities || [];

		const actionsData = await fetchAdminActions(50);
		const adminActions = actionsData.actions || [];

		const allRecentActivities = [
			...userActivities.map((activity: any) => ({
				...activity,
				type: 'user_activity',
				user: activity.user || { id: activity.userId, name: 'Unknown User' }
			})),
			...adminActions.map((action: any) => ({
				...action,
				type: 'admin_action'
			}))
		].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		adminStore.update(state => ({
			...state,
			userActivities,
			adminActions,
			allRecentActivities
		}));
	} catch (err) {
		console.error('Failed to load all recent activities:', err);
	}
}

// --- SSE subscription ---
let eventSource: EventSource | null = null;

export function connectAdminEvents() {
  if (eventSource) return;
  try {
    eventSource = new EventSource('/api/admin/events');
    adminStore.update((s) => ({ ...s, sseConnected: true }));

    eventSource.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data || '{}');
        const type = data.type as string;

        if (type === 'heartbeat' || type === 'connected') return;

        // Selective refresh for better performance and correctness
        switch (type) {
          case 'users_changed':
            // user list changed; also impacts overview stats
            Promise.allSettled([
              loadUsers(),
              loadUserStats()
            ]);
            break;
          case 'stats_updated':
            loadUserStats();
            break;
          case 'admin_action':
          case 'user_activity':
          case 'user_login':
          case 'user_logout':
            // activity feeds and possibly stats
            Promise.allSettled([
              loadAllRecentActivities(),
              loadUserStats()
            ]);
            break;
          default:
            // Fallback: conservative refresh
            Promise.allSettled([
              loadUsers(),
              loadUserStats(),
              loadAllRecentActivities()
            ]);
        }
      } catch {}
    };

    eventSource.onerror = () => {
      disconnectAdminEvents();
      // Backoff reconnect
      setTimeout(() => connectAdminEvents(), 3000);
    };
  } catch {
    // ignore
  }
}

export function disconnectAdminEvents() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    adminStore.update((s) => ({ ...s, sseConnected: false }));
  }
}

export async function loadUserDetails(userId: string) {
	try {
		adminStore.update(state => ({ ...state, userStats: null }));
		
		const data = await apiFetchUserDetails(userId);
		const stats = await apiFetchUserStats(userId);
		
		adminStore.update(state => ({
			...state,
			selectedUser: data.user,
			userActivities: data.activities,
			userSessions: data.sessions,
			userStats: stats.stats
		}));
	} catch (err) {
		console.error('Failed to load user details:', err);
	}
}

// User management functions
export async function updateUserRole(userId: string, newRole: string) {
	try {
		clearMessages();
		await apiUpdateUserRole(userId, newRole);
		
		adminStore.update(state => ({
			...state,
			users: state.users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
		}));
		
		setSuccess('User role updated successfully!');
		clearSuccessMessage();
		await Promise.allSettled([
			loadRecentActivity(),
			loadUserStats()
		]);
	} catch (err) {
		setError('An error occurred while updating user role');
	}
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
	try {
		clearMessages();
		await apiToggleUserStatus(userId, !currentStatus);
		await Promise.allSettled([
			loadUsers(),
			loadUserStats()
		]);
		setSuccess('User status updated successfully!');
		clearSuccessMessage();
		await loadRecentActivity();
	} catch (err) {
		setError('An error occurred while updating user status');
	}
}

export async function deleteUserAction(userId: string) {
	try {
		clearMessages();
		await apiDeleteUser(userId);
		
		adminStore.update(state => ({
			...state,
			users: state.users.filter(u => u.id !== userId)
		}));
		
		setSuccess('User deleted successfully!');
		clearSuccessMessage();
		await Promise.allSettled([
			loadRecentActivity(),
			loadUserStats()
		]);
	} catch (err) {
		console.error('Delete user error:', err);
		setError('An error occurred while deleting user. Please check your connection and try again.');
	}
}

// Modal management functions
export function openDeleteModal(userId: string, userName: string) {
	deleteTarget.set({ id: userId, name: userName });
	showDeleteModal.set(true);
}

export function closeDeleteModal() {
	showDeleteModal.set(false);
	deleteTarget.set(null);
}

export async function confirmDeleteUser() {
	const selected = get(deleteTarget);
	if (!selected) return;
	const { id: userId } = selected;
	closeDeleteModal();
	await deleteUserAction(userId);
}

export function closeUserModal() {
	adminStore.update(state => ({
		...state,
		selectedUser: null,
		userStats: null,
		modalActiveTab: 'sessions',
		activitiesPage: 1
	}));
}

// Utility functions
export function clearSuccessMessage() {
	setTimeout(() => {
		adminStore.update(state => ({ ...state, success: '' }));
	}, 3000);
}

export function formatDate(dateString: string) {
	return new Date(dateString).toLocaleString();
}

export function formatDateOnly(date: Date | string) {
	return new Date(date).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});
}

export function formatDuration(startTime: string, endTime?: string) {
	const start = new Date(startTime);
	const end = endTime ? new Date(endTime) : new Date();
	const diff = end.getTime() - start.getTime();
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	return `${hours}h ${minutes}m`;
}

export function formatSessionToken(token: string) {
	if (!token) return 'N/A';
	return token.length > 20 ? `${token.substring(0, 20)}...` : token;
}

export function formatMetadata(metadata: any) {
	if (!metadata) return 'No metadata';
	
	try {
		if (typeof metadata === 'string') {
			const parsed = JSON.parse(metadata);
			return Object.entries(parsed).map(([key, value]) => 
				`<strong>${key}:</strong> ${JSON.stringify(value)}`
			).join('<br>');
		} else if (typeof metadata === 'object') {
			return Object.entries(metadata).map(([key, value]) => 
				`<strong>${key}:</strong> ${JSON.stringify(value)}`
			).join('<br>');
		}
		return JSON.stringify(metadata, null, 2);
	} catch {
		return JSON.stringify(metadata);
	}
}

// Pagination functions
export function getPaginatedActivities() {
	let state: AdminState = initialState;
	adminStore.subscribe(s => state = s)();
	
	const start = (state.activitiesPage - 1) * state.activitiesPerPage;
	const end = start + state.activitiesPerPage;
	return state.userActivities.slice(start, end);
}

export function getTotalPages() {
	let state: AdminState = initialState;
	adminStore.subscribe(s => state = s)();
	return Math.ceil(state.userActivities.length / state.activitiesPerPage);
}

export function nextActivitiesPage() {
	let state: AdminState = initialState;
	adminStore.subscribe(s => state = s)();
	
	if (state.activitiesPage < getTotalPages()) {
		setActivitiesPage(state.activitiesPage + 1);
	}
}

export function prevActivitiesPage() {
	let state: AdminState = initialState;
	adminStore.subscribe(s => state = s)();
	
	if (state.activitiesPage > 1) {
		setActivitiesPage(state.activitiesPage - 1);
	}
}

// Keyboard event handler
export function setupKeyboardHandlers() {
	const handleKeydown = (event: KeyboardEvent) => {
		let state: AdminState = initialState;
		adminStore.subscribe(s => state = s)();
		
		if (event.key === 'Escape' && state.selectedUser) {
			closeUserModal();
		}
	};

	document.addEventListener('keydown', handleKeydown);
	
	return () => {
		document.removeEventListener('keydown', handleKeydown);
	};
}
