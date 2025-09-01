import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { documents } from '$lib/db/schema';
import { AuthError } from '$lib/errors';
import { eq, desc, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to view documents');
		}

		const status = url.searchParams.get('status');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// Build query conditions
		let whereConditions: any = eq(documents.userId, session.user.id);

		if (status) {
			whereConditions = and(whereConditions, eq(documents.status, status));
		}

		// Get documents with pagination
		const userDocuments = await db.query.documents.findMany({
			where: whereConditions,
			orderBy: [desc(documents.createdAt)],
			limit: Math.min(limit, 100), // Max 100 per request
			offset
		});

		// Get total count for pagination
		const countResult = await db
			.select({ count: documents.id })
			.from(documents)
			.where(whereConditions);

		const count = countResult.length > 0 ? countResult[0].count : 0;

		return json({
			success: true,
			documents: userDocuments.map((doc) => ({
				id: doc.id,
				fileName: doc.fileName,
				originalName: doc.originalName,
				fileSize: doc.fileSize,
				fileType: doc.fileType,
				status: doc.status,
				createdAt: doc.createdAt,
				updatedAt: doc.updatedAt,
				errorMessage: doc.errorMessage
			})),
			pagination: {
				total: Number(count),
				limit,
				offset,
				hasMore: offset + limit < Number(count)
			}
		});
	} catch (error: any) {
		console.error('Documents fetch error:', error);

		if (error instanceof AuthError) {
			return json({ success: false, error: error.message }, { status: 401 });
		}

		return json({ success: false, error: 'Failed to fetch documents' }, { status: 500 });
	}
};
