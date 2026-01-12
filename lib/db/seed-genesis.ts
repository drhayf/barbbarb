/**
 * Genesis Seed Script for "The Barbers Element"
 * Creates the Owner account, Super Admin account, and populates services
 *
 * Credentials:
 * - Owner: dev_owner@barbemnt.com / DevPass123!
 * - Super Admin: superadmin@barbemnt.com / SuperPass123!
 * - Team Name: The Barbers Element
 */

import { db } from './drizzle';
import { users, teams, teamMembers, services } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq, and } from 'drizzle-orm';

const OWNER_EMAIL = 'dev_owner@barbemnt.com';
const OWNER_PASSWORD = 'DevPass123!';
const TEAM_NAME = 'The Barbers Element';

// Super Admin Credentials
const SUPER_ADMIN_EMAIL = 'superadmin@barbemnt.com';
const SUPER_ADMIN_PASSWORD = 'SuperPass123!';

// Services Price List for The Barbers Element
const SERVICES = [
  { name: 'Mens Style Cut', price: 3000, durationMinutes: 30 },
  { name: 'Skin Fade', price: 3500, durationMinutes: 45 },
  { name: 'Crew Cut', price: 2000, durationMinutes: 20 },
  { name: 'Style Cut & Beard', price: 4500, durationMinutes: 45 },
  { name: 'Skin Fade & Beard', price: 5000, durationMinutes: 60 },
  { name: 'Student Cut', price: 2500, durationMinutes: 30 },
  { name: 'Student Skin Fade', price: 3000, durationMinutes: 45 },
  { name: 'Kids 12 & Under', price: 2000, durationMinutes: 20 },
  { name: 'Pensioners', price: 2000, durationMinutes: 20 },
  { name: 'Beard Trim & Line Up', price: 2000, durationMinutes: 15 },
  { name: 'Facial Waxing & Threading', price: 500, durationMinutes: 15 },
];

async function seedGenesis() {
  console.log('🔧 Starting Genesis Seed...');
  console.log(`   Email: ${OWNER_EMAIL}`);
  console.log(`   Team: ${TEAM_NAME}`);

  try {
    // 1. Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, OWNER_EMAIL))
      .limit(1);

    let userId: number;

    if (existingUser.length > 0) {
      console.log('   User already exists. Updating password...');
      userId = existingUser[0].id;
      
      const passwordHash = await hashPassword(OWNER_PASSWORD);
      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, userId));
    } else {
      console.log('   Creating new user...');
      const passwordHash = await hashPassword(OWNER_PASSWORD);
      
      const [newUser] = await db
        .insert(users)
        .values({
          email: OWNER_EMAIL,
          passwordHash,
          role: 'owner',
        })
        .returning();
      
      userId = newUser.id;
    }

    // 2. Check if team exists for this user
    const existingTeamMember = await db
      .select({
        team: teams,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId))
      .limit(1);

    let teamId: number;

    if (existingTeamMember.length > 0) {
      console.log('   Team already exists. Updating team name...');
      teamId = existingTeamMember[0].team.id;
      await db
        .update(teams)
        .set({ name: TEAM_NAME })
        .where(eq(teams.id, teamId));
    } else {
      console.log('   Creating new team...');
      const [newTeam] = await db
        .insert(teams)
        .values({ name: TEAM_NAME })
        .returning();

      teamId = newTeam.id;

      await db.insert(teamMembers).values({
        userId,
        teamId: newTeam.id,
        role: 'owner',
      });
    }

    // 3. Clear existing services for this team
    console.log('   Clearing existing services...');
    await db
      .delete(services)
      .where(eq(services.teamId, teamId));

    // 4. Insert services from price list
    console.log('   Inserting services from price list...');
    const serviceValues = SERVICES.map(service => ({
      teamId,
      name: service.name,
      price: service.price,
      durationMinutes: service.durationMinutes,
      description: `${service.name} - ${service.durationMinutes} minutes`,
      isActive: true,
    }));

    await db.insert(services).values(serviceValues);

    console.log(`   ✅ Inserted ${SERVICES.length} services`);

    // 5. Create Super Admin if not exists
    console.log('');
    console.log('🔧 Creating Super Admin...');
    console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);

    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, SUPER_ADMIN_EMAIL))
      .limit(1);

    if (existingSuperAdmin.length > 0) {
      console.log('   Super Admin already exists. Updating password...');
      const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD);
      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, existingSuperAdmin[0].id));
    } else {
      console.log('   Creating new Super Admin...');
      const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD);
      await db.insert(users).values({
        email: SUPER_ADMIN_EMAIL,
        passwordHash,
        role: 'super_admin',
      });
      console.log('   ✅ Super Admin created');
    }

    console.log('');
    console.log('✅ Seeding Complete.');
    console.log(`   Owner: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
    console.log(`   Super Admin: ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD}`);
    console.log(`   Team: ${TEAM_NAME}`);
    console.log(`   Services: ${SERVICES.length} items`);
    console.log('');
  } catch (error) {
    console.error('❌ Seed process failed:', error);
    throw error;
  }
}

seedGenesis()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Genesis seed process finished. Exiting...');
    process.exit(0);
  });
