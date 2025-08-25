export async function fetchUsers() {
	const response = await fetch('/api/admin/users');
	if (!response.ok) throw new Error('Failed to load users');
	return response.json();
}

export async function fetchUsersStats() {
	const response = await fetch('/api/admin/users/stats');
	if (!response.ok) throw new Error('Failed to load user stats');
	return response.json();
}

export async function fetchAdminActions(limit = 20) {
	const response = await fetch(`/api/admin/actions?limit=${limit}`);
	if (!response.ok) throw new Error('Failed to load admin actions');
	return response.json();
}

export async function fetchUserActivities() {
	const response = await fetch('/api/admin/users/activities');
	if (!response.ok) throw new Error('Failed to load user activities');
	return response.json();
}

export async function fetchUserDetails(userId: string) {
	const response = await fetch(`/api/admin/users/${userId}/activities`);
	if (!response.ok) throw new Error('Failed to load user details');
	return response.json();
}

export async function fetchUserStats(userId: string) {
	const response = await fetch(`/api/admin/users/${userId}/stats`);
	if (!response.ok) throw new Error('Failed to load selected user stats');
	return response.json();
}

export async function updateUserRole(userId: string, newRole: string) {
	const response = await fetch(`/api/admin/users/${userId}/role`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ role: newRole })
	});
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Failed to update user role');
	}
	return response.json().catch(() => ({}));
}

export async function toggleUserStatus(userId: string, active: boolean) {
	const response = await fetch(`/api/admin/users/${userId}/status`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ active })
	});
	if (!response.ok) throw new Error('Failed to update user status');
	return response.json().catch(() => ({}));
}

export async function deleteUser(userId: string) {
	const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const message = errorData.error || 'Failed to delete user';
		throw new Error(message);
	}
	return response.json().catch(() => ({}));
}


