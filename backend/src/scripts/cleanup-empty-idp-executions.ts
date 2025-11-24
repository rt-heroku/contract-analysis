import prisma from '../config/database';

/**
 * Find and optionally delete IDP executions with empty encrypted data
 * 
 * Usage:
 *   npm run encryption:cleanup       - Dry run (just list)
 *   npm run encryption:cleanup delete - Actually delete corrupted entries
 */

async function cleanupEmptyIdpExecutions() {
  const shouldDelete = process.argv[2] === 'delete';
  
  const executions = await prisma.idpExecution.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      authClientId: true,
      userId: true,
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  console.log(`\n🔍 Checking ${executions.length} IDP executions for empty data...\n`);

  const corruptedEntries: number[] = [];

  for (const exec of executions) {
    try {
      const buffer = Buffer.from(exec.authClientId, 'base64');
      const encryptedDataLength = buffer.length - 96; // Subtract salt, IV, tag
      
      if (encryptedDataLength === 0) {
        console.log(`❌ ID: ${exec.id} | Name: ${exec.name}`);
        console.log(`   User: ${exec.user.email} (${exec.user.firstName} ${exec.user.lastName})`);
        console.log(`   Status: EMPTY - No encrypted data`);
        console.log('');
        corruptedEntries.push(exec.id);
      } else {
        console.log(`✅ ID: ${exec.id} | Name: ${exec.name} - OK (${encryptedDataLength} bytes)`);
      }
    } catch (error: any) {
      console.log(`❌ ID: ${exec.id} | Name: ${exec.name}`);
      console.log(`   Status: INVALID - ${error.message}`);
      console.log('');
      corruptedEntries.push(exec.id);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total entries: ${executions.length}`);
  console.log(`   Corrupted: ${corruptedEntries.length}`);
  console.log(`   Valid: ${executions.length - corruptedEntries.length}`);

  if (corruptedEntries.length > 0) {
    console.log(`\n⚠️  Found ${corruptedEntries.length} corrupted entries`);
    
    if (shouldDelete) {
      console.log('\n🗑️  Deleting corrupted entries...\n');
      
      for (const id of corruptedEntries) {
        const exec = executions.find(e => e.id === id);
        await prisma.idpExecution.update({
          where: { id },
          data: { isActive: false },
        });
        console.log(`   Deleted: ID ${id} - ${exec?.name}`);
      }
      
      console.log('\n✅ Cleanup complete!');
      console.log('   Users will need to re-create their IDP executions with correct credentials.');
    } else {
      console.log('\n💡 To delete these entries, run:');
      console.log('   npm run encryption:cleanup delete');
      console.log('\n   Note: Users will need to re-create their IDP executions after deletion.');
    }
  } else {
    console.log('\n✅ All entries are valid!');
  }

  await prisma.$disconnect();
}

cleanupEmptyIdpExecutions();

