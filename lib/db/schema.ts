import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// USERS TABLE (Extended for Barbers Element)
// ============================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  phone: varchar('phone', { length: 20 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ============================================
// TEAMS TABLE (Shops)
// ============================================
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

// ============================================
// TEAM MEMBERS TABLE
// ============================================
export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

// ============================================
// BARBER PROFILES TABLE
// ============================================
export const barberProfiles = pgTable('barber_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  bio: text('bio'),
  specialties: jsonb('specialties'), // Array of strings: ["Fade", "Beard Trim"]
  availability: jsonb('availability'), // Structured weekly schedule
  instagramHandle: varchar('instagram_handle', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// SERVICES TABLE (Shop Menu)
// ============================================
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull(),
  price: integer('price').notNull(), // In cents for Stripe compatibility
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// PRODUCTS TABLE (Shop Inventory)
// ============================================
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(), // In cents
  stock: integer('stock').notNull().default(0),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// BOOKINGS TABLE (Appointments)
// ============================================
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  customerId: integer('customer_id')
    .notNull()
    .references(() => users.id),
  barberId: integer('barber_id')
    .notNull()
    .references(() => users.id),
  serviceId: integer('service_id')
    .notNull()
    .references(() => services.id),
  appointmentDate: timestamp('appointment_date').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'confirmed', 'cancelled', 'completed'
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// ACTIVITY LOGS TABLE
// ============================================
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

// ============================================
// INVITATIONS TABLE
// ============================================
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

// ============================================
// POSTS TABLE (Instagram-style News Feed)
// ============================================
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  barberId: integer('barber_id')
    .references(() => users.id), // Optional: links to a specific barber
  type: text('type', { enum: ['portfolio', 'announcement'] })
    .notNull()
    .default('portfolio'),
  title: text('title'), // Optional title for announcements
  imageUrl: text('image_url'), // Optional for announcements
  caption: text('caption'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

// Teams Relations
export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  services: many(services),
  products: many(products),
  bookings: many(bookings),
  posts: many(posts),
}));

// Users Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  barberProfile: one(barberProfiles, {
    fields: [users.id],
    references: [barberProfiles.userId],
  }),
  customerBookings: many(bookings, {
    relationName: 'customerBookings',
  }),
  barberBookings: many(bookings, {
    relationName: 'barberBookings',
  }),
  posts: many(posts),
}));

// Barber Profiles Relations
export const barberProfilesRelations = relations(barberProfiles, ({ one }) => ({
  user: one(users, {
    fields: [barberProfiles.userId],
    references: [users.id],
  }),
}));

// Services Relations
export const servicesRelations = relations(services, ({ one, many }) => ({
  team: one(teams, {
    fields: [services.teamId],
    references: [teams.id],
  }),
  bookings: many(bookings),
}));

// Products Relations
export const productsRelations = relations(products, ({ one }) => ({
  team: one(teams, {
    fields: [products.teamId],
    references: [teams.id],
  }),
}));

// Bookings Relations
export const bookingsRelations = relations(bookings, ({ one }) => ({
  team: one(teams, {
    fields: [bookings.teamId],
    references: [teams.id],
  }),
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
    relationName: 'customerBookings',
  }),
  barber: one(users, {
    fields: [bookings.barberId],
    references: [users.id],
    relationName: 'barberBookings',
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
}));

// Invitations Relations
export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

// Team Members Relations
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

// Activity Logs Relations
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Posts Relations
export const postsRelations = relations(posts, ({ one }) => ({
  team: one(teams, {
    fields: [posts.teamId],
    references: [teams.id],
  }),
  barber: one(users, {
    fields: [posts.barberId],
    references: [users.id],
  }),
}));

// ============================================
// TYPE INFERENCES
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type BarberProfile = typeof barberProfiles.$inferSelect;
export type NewBarberProfile = typeof barberProfiles.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

// ============================================
// COMPOSED TYPES
// ============================================
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export type BookingWithRelations = Booking & {
  customer: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
  barber: Pick<User, 'id' | 'name' | 'email'> & {
    barberProfile: Pick<BarberProfile, 'id' | 'specialties' | 'instagramHandle'> | null;
  };
  service: Service;
  team: Pick<Team, 'id' | 'name'>;
};

export type ServiceWithBookings = Service & {
  bookings: Booking[];
};

// ============================================
// ENUMS
// ============================================
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  OWNER = 'owner',
  BARBER = 'barber',
  USER = 'user',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
