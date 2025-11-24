import prisma from '../config/database';

/**
 * Inspect encrypted data format to see if it's valid
 */
async function inspectEncryptedData() {
  const executions = await prisma.idpExecution.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      authClientId: true,
      authClientSecret: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log(`\n🔍 Inspecting ${executions.length} IDP executions\n`);

  for (const exec of executions) {
    console.log(`ID: ${exec.id} | Name: ${exec.name}`);
    console.log(`  Created: ${exec.createdAt.toISOString()}`);
    console.log(`  Updated: ${exec.updatedAt.toISOString()}`);
    
    try {
      // Try to decode as base64
      const buffer = Buffer.from(exec.authClientId, 'base64');
      const expectedMinLength = 64 + 16 + 16; // salt + iv + tag (no data)
      
      console.log(`  Base64 valid: ✅`);
      console.log(`  Buffer length: ${buffer.length} bytes`);
      console.log(`  Expected format: ${buffer.length >= expectedMinLength ? '✅ Proper encryption format' : '❌ Too short'}`);
      
      if (buffer.length >= expectedMinLength) {
        console.log(`  Structure:`);
        console.log(`    - Salt: ${buffer.length >= 64 ? '✅ 64 bytes' : '❌'}`);
        console.log(`    - IV: ${buffer.length >= 80 ? '✅ 16 bytes' : '❌'}`);
        console.log(`    - Tag: ${buffer.length >= 96 ? '✅ 16 bytes' : '❌'}`);
        console.log(`    - Encrypted data: ${buffer.length - 96} bytes`);
        
        // Show first few bytes of salt (can help identify if same key was used)
        console.log(`    - Salt preview: ${buffer.subarray(0, 8).toString('hex')}...`);
      } else {
        console.log(`  ⚠️  Data too short - not proper encryption format!`);
        console.log(`  Raw value preview: ${exec.authClientId.substring(0, 50)}...`);
      }
      
      // Check if it looks like it was recently created/modified
      const daysSinceCreated = (Date.now() - exec.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceUpdate = (Date.now() - exec.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      console.log(`  Days since created: ${daysSinceCreated.toFixed(1)}`);
      console.log(`  Days since update: ${daysSinceUpdate.toFixed(1)}`);
      
      if (daysSinceUpdate < 1) {
        console.log(`  ⚠️  Recently modified (within last 24 hours)`);
      }
      
      if (exec.createdAt.getTime() !== exec.updatedAt.getTime()) {
        console.log(`  ⚠️  Created and Updated times differ - data was modified after creation`);
      }
      
    } catch (error: any) {
      console.log(`  ❌ Not valid base64: ${error.message}`);
      console.log(`  Raw value preview: ${exec.authClientId.substring(0, 50)}...`);
    }
    console.log('');
  }
  
  // Check if all entries have the same salt pattern (might indicate they were all encrypted at once)
  if (executions.length > 1) {
    console.log('\n📊 Comparing entries...\n');
    
    const salts: string[] = [];
    for (const exec of executions) {
      try {
        const buffer = Buffer.from(exec.authClientId, 'base64');
        if (buffer.length >= 64) {
          salts.push(buffer.subarray(0, 8).toString('hex'));
        }
      } catch {
        salts.push('invalid');
      }
    }
    
    const uniqueSalts = new Set(salts);
    console.log(`Unique salt patterns: ${uniqueSalts.size} out of ${executions.length} entries`);
    
    if (uniqueSalts.size === 1 && uniqueSalts.values().next().value !== 'invalid') {
      console.log('⚠️  All entries have the same salt - highly unusual!');
      console.log('   This might indicate data corruption or bulk re-encryption.');
    } else if (uniqueSalts.size === executions.length) {
      console.log('✅ All entries have different salts - expected behavior');
    }
  }

  await prisma.$disconnect();
}

inspectEncryptedData();

