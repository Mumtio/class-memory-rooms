#!/usr/bin/env node

/**
 * Configuration validation CLI utility
 * Run with: node scripts/validate-config.js
 */

import { validateAllConfiguration } from '../lib/config-validation.js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

async function main() {
  console.log('🔍 Validating Class Memory Rooms configuration...\n');

  try {
    const results = await validateAllConfiguration();

    // Environment validation
    console.log('📋 Environment Variables:');
    if (results.environment.isValid) {
      console.log('  ✅ All required environment variables are configured');
    } else {
      console.log('  ❌ Environment validation failed:');
      results.environment.errors.forEach(error => {
        console.log(`     • ${error}`);
      });
    }

    if (results.environment.warnings.length > 0) {
      console.log('  ⚠️  Warnings:');
      results.environment.warnings.forEach(warning => {
        console.log(`     • ${warning}`);
      });
    }

    console.log();

    // Foru.ms connectivity
    console.log('🌐 Foru.ms API Connectivity:');
    if (results.forummsConnectivity.isConnected) {
      console.log(`  ✅ Connected successfully (${results.forummsConnectivity.responseTime}ms)`);
    } else {
      console.log(`  ❌ Connection failed: ${results.forummsConnectivity.error}`);
    }

    console.log();

    // OpenAI connectivity
    console.log('🤖 OpenAI API Connectivity:');
    if (results.openaiConnectivity.isConnected) {
      console.log(`  ✅ Connected successfully (${results.openaiConnectivity.responseTime}ms)`);
    } else {
      console.log(`  ❌ Connection failed: ${results.openaiConnectivity.error}`);
    }

    console.log();

    // Overall status
    const allValid = results.environment.isValid && 
                    results.forummsConnectivity.isConnected && 
                    results.openaiConnectivity.isConnected;

    if (allValid) {
      console.log('🎉 Configuration is valid! You can start the application.');
      process.exit(0);
    } else {
      console.log('❌ Configuration issues found. Please fix the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Validation failed with error:', error.message);
    process.exit(1);
  }
}

main();