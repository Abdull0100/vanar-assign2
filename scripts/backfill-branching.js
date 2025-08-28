import { db } from '../src/lib/db/index.ts';
import { chatMessages } from '../src/lib/db/schema.ts';
import { eq, isNull, sql } from 'drizzle-orm';

async function backfillBranchingFields() {
  try {
    console.log('🔄 Starting backfill of branching fields...');
    
    // Update all messages where branch_id is NULL
    const result = await db
      .update(chatMessages)
      .set({
        branchId: sql`${chatMessages.id}`,
        versionNumber: 1,
        isForked: false
      })
      .where(isNull(chatMessages.branchId));
    
    console.log(`✅ Backfilled ${result.rowCount} messages with default branching values`);
    
    // Verify the backfill
    const nullBranchCount = await db
      .select({ count: sql`count(*)` })
      .from(chatMessages)
      .where(isNull(chatMessages.branchId));
    
    console.log(`📊 Messages with NULL branch_id after backfill: ${nullBranchCount[0]?.count || 0}`);
    
    console.log('✅ Backfill completed successfully!');
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  }
}

backfillBranchingFields();
