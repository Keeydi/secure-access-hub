/**
 * Script to create an admin account
 * 
 * Usage:
 *   node scripts/create-admin.js
 * 
 * This will prompt you for:
 *   - Email (default: admin@secureauth.com)
 *   - Password (will be hashed with bcrypt)
 */

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
let supabaseUrl, supabaseKey;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join('=').trim();
    }
    return acc;
  }, {});
  
  supabaseUrl = envVars.VITE_SUPABASE_URL;
  supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
} else {
  console.error('❌ .env file not found!');
  console.error('Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file!');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdmin() {
  try {
    console.log('\n🔐 Create Admin Account\n');
    console.log('='.repeat(50));
    
    // Get email
    const email = await question('Enter admin email (default: admin@secureauth.com): ');
    const adminEmail = email.trim() || 'admin@secureauth.com';
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      console.error('❌ Invalid email format!');
      rl.close();
      process.exit(1);
    }
    
    // Get password
    const password = await question('Enter admin password (min 8 chars, 1 uppercase, 1 lowercase, 1 number): ');
    const adminPassword = password.trim();
    
    if (adminPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters!');
      rl.close();
      process.exit(1);
    }
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', adminEmail.toLowerCase())
      .maybeSingle();
    
    if (existingUser) {
      console.log(`\n⚠️  User with email ${adminEmail} already exists!`);
      const update = await question('Do you want to update this user to Admin role? (y/n): ');
      
      if (update.toLowerCase() !== 'y') {
        console.log('❌ Cancelled.');
        rl.close();
        process.exit(0);
      }
      
      // Hash password
      console.log('\n⏳ Hashing password...');
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      // Update user to admin
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          role: 'Admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);
      
      if (updateError) {
        console.error('❌ Error updating user:', updateError.message);
        rl.close();
        process.exit(1);
      }
      
      console.log('\n✅ Admin account updated successfully!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Role: Admin`);
      rl.close();
      return;
    }
    
    // Hash password
    console.log('\n⏳ Hashing password...');
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Create admin user
    console.log('⏳ Creating admin account...');
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: adminEmail.toLowerCase(),
        password_hash: passwordHash,
        role: 'Admin',
        mfa_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating admin account:', error.message);
      if (error.code === '42501') {
        console.error('\n⚠️  RLS Policy Error!');
        console.error('Please run the RLS fix SQL script: supabase/schema-rls-fix.sql');
      }
      rl.close();
      process.exit(1);
    }
    
    console.log('\n✅ Admin account created successfully!');
    console.log('='.repeat(50));
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Role: Admin`);
    console.log(`   User ID: ${newUser.id}`);
    console.log('='.repeat(50));
    console.log('\n📝 You can now log in with these credentials.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    rl.close();
  }
}

createAdmin();





