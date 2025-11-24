#!/usr/bin/env node

/**
 * Verify Prisma Client matches database schema
 * Run this before starting the server to catch schema mismatches
 */

const { PrismaClient } = require('@prisma/client');

async function verifySchema() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verifying database schema...');
    
    // Check if category column exists in Prisma Client
    const prismaFields = Object.keys(prisma.connector.fields);
    if (!prismaFields.includes('category')) {
      console.error('❌ ERROR: Prisma Client does not include "category" field');
      console.error('   Run: npx prisma generate');
      process.exit(1);
    }
    
    // Try to query with category field
    await prisma.connector.findFirst({
      select: { id: true, category: true },
      take: 1,
    });
    
    console.log('✅ Schema verification passed!');
    console.log('   - Prisma Client includes "category" field');
    console.log('   - Database has "category" column');
    console.log('');
    console.log('🚀 Safe to start server!');
    
  } catch (error) {
    console.error('❌ Schema verification failed!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.message.includes('does not exist')) {
      console.error('🔧 Fix:');
      console.error('   1. Check DATABASE_URL in .env');
      console.error('   2. Run: npx prisma db push');
      console.error('   3. Run: npx prisma generate');
      console.error('   4. Run this script again');
    } else if (error.message.includes('category')) {
      console.error('🔧 Fix:');
      console.error('   1. Delete node_modules/.prisma');
      console.error('   2. Run: npx prisma generate');
      console.error('   3. Kill all node processes');
      console.error('   4. Run this script again');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();

