/**
 * Migration Script: SQLite to PostgreSQL
 * 
 * This script helps migrate data from the old SQLite database to the new PostgreSQL database.
 * Use this script after setting up your PostgreSQL instance on Railway.
 */

const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
require('dotenv').config();

// SQLite database connection (old database)
const sqliteDb = new sqlite3.Database('./backend/database/clients.db');

// PostgreSQL connection (new database)
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/ascending_fitness',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrateUsers() {
  return new Promise((resolve, reject) => {
    console.log('Starting users migration...');
    
    // Fetch all users from SQLite
    sqliteDb.all('SELECT * FROM users', [], async (err, rows) => {
      if (err) {
        console.error('Error fetching users from SQLite:', err);
        reject(err);
        return;
      }

      console.log(`Found ${rows.length} users to migrate...`);

      try {
        for (const user of rows) {
          // Insert user into PostgreSQL
          await pgPool.query(
            `INSERT INTO users (
              id, name, email, password, role, phone, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            ON CONFLICT (email) DO NOTHING`,
            [
              user.id,
              user.name,
              user.email,
              user.password,
              user.role,
              user.phone,
              user.created_at || new Date().toISOString(),
              user.updated_at || new Date().toISOString()
            ]
          );
        }
        
        console.log('Users migration completed successfully!');
        resolve();
      } catch (error) {
        console.error('Error inserting users into PostgreSQL:', error);
        reject(error);
      }
    });
  });
}

async function migrateProfiles() {
  return new Promise((resolve, reject) => {
    console.log('Starting profiles migration...');
    
    // Fetch all profiles from SQLite
    sqliteDb.all('SELECT * FROM profiles', [], async (err, rows) => {
      if (err) {
        console.error('Error fetching profiles from SQLite:', err);
        reject(err);
        return;
      }

      console.log(`Found ${rows.length} profiles to migrate...`);

      try {
        for (const profile of rows) {
          // Insert profile into PostgreSQL
          await pgPool.query(
            `INSERT INTO profiles (
              user_id, age, height, weight, gender, emergencyName, emergencyPhone, 
              emergencyRelationship, medicalConditions, medications, injuriesSurgeries, 
              allergies, fitnessLevel, workedOutBefore, exerciseTypes, equipmentAccess, 
              primaryGoal, secondaryGoals, targetTimeline, sessionsPerWeek, 
              favoriteExercises, exercisesToAvoid, preferredSchedule, dietaryRestrictions, 
              activityLevel, sleepAverage, daysPerWeek, sessionsPerMonth
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                      $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28) 
            ON CONFLICT (user_id) DO UPDATE SET
              age = EXCLUDED.age,
              height = EXCLUDED.height,
              weight = EXCLUDED.weight,
              gender = EXCLUDED.gender,
              emergencyName = EXCLUDED.emergencyName,
              emergencyPhone = EXCLUDED.emergencyPhone,
              emergencyRelationship = EXCLUDED.emergencyRelationship,
              medicalConditions = EXCLUDED.medicalConditions,
              medications = EXCLUDED.medications,
              injuriesSurgeries = EXCLUDED.injuriesSurgeries,
              allergies = EXCLUDED.allergies,
              fitnessLevel = EXCLUDED.fitnessLevel,
              workedOutBefore = EXCLUDED.workedOutBefore,
              exerciseTypes = EXCLUDED.exerciseTypes,
              equipmentAccess = EXCLUDED.equipmentAccess,
              primaryGoal = EXCLUDED.primaryGoal,
              secondaryGoals = EXCLUDED.secondaryGoals,
              targetTimeline = EXCLUDED.targetTimeline,
              sessionsPerWeek = EXCLUDED.sessionsPerWeek,
              favoriteExercises = EXCLUDED.favoriteExercises,
              exercisesToAvoid = EXCLUDED.exercisesToAvoid,
              preferredSchedule = EXCLUDED.preferredSchedule,
              dietaryRestrictions = EXCLUDED.dietaryRestrictions,
              activityLevel = EXCLUDED.activityLevel,
              sleepAverage = EXCLUDED.sleepAverage,
              daysPerWeek = EXCLUDED.daysPerWeek,
              sessionsPerMonth = EXCLUDED.sessionsPerMonth`,
            [
              profile.user_id,
              profile.age,
              profile.height,
              profile.weight,
              profile.gender,
              profile.emergencyName,
              profile.emergencyPhone,
              profile.emergencyRelationship,
              profile.medicalConditions,
              profile.medications,
              profile.injuriesSurgeries,
              profile.allergies,
              profile.fitnessLevel,
              profile.workedOutBefore,
              profile.exerciseTypes,
              profile.equipmentAccess,
              profile.primaryGoal,
              profile.secondaryGoals,
              profile.targetTimeline,
              profile.sessionsPerWeek,
              profile.favoriteExercises,
              profile.exercisesToAvoid,
              profile.preferredSchedule,
              profile.dietaryRestrictions,
              profile.activityLevel,
              profile.sleepAverage,
              profile.daysPerWeek,
              profile.sessionsPerMonth
            ]
          );
        }
        
        console.log('Profiles migration completed successfully!');
        resolve();
      } catch (error) {
        console.error('Error inserting profiles into PostgreSQL:', error);
        reject(error);
      }
    });
  });
}

async function runMigration() {
  console.log('Starting SQLite to PostgreSQL migration...');

  try {
    // Ensure tables exist in PostgreSQL
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'client',
        phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        age VARCHAR(10),
        height VARCHAR(20),
        weight VARCHAR(20),
        gender VARCHAR(50),
        emergencyName VARCHAR(255),
        emergencyPhone VARCHAR(20),
        emergencyRelationship VARCHAR(100),
        medicalConditions TEXT,
        medications TEXT,
        injuriesSurgeries TEXT,
        allergies TEXT,
        fitnessLevel VARCHAR(100),
        workedOutBefore TEXT,
        exerciseTypes TEXT,
        equipmentAccess TEXT,
        primaryGoal TEXT,
        secondaryGoals TEXT,
        targetTimeline VARCHAR(100),
        sessionsPerWeek VARCHAR(50),
        favoriteExercises TEXT,
        exercisesToAvoid TEXT,
        preferredSchedule TEXT,
        dietaryRestrictions TEXT,
        activityLevel VARCHAR(100),
        sleepAverage VARCHAR(20),
        daysPerWeek VARCHAR(50),
        sessionsPerMonth VARCHAR(50)
      )
    `);

    // Run migrations
    await migrateUsers();
    await migrateProfiles();

    console.log('Migration completed successfully!');
    
    // Close connections
    sqliteDb.close();
    await pgPool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Close connections
    sqliteDb.close();
    await pgPool.end();
    
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, migrateUsers, migrateProfiles };