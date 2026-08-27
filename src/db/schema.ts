import { pgTable, serial, text, integer, doublePrecision, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (identifying Firebase users)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: text('id').primaryKey(), // Custom ID e.g. prj_123 or UUID
  userId: integer('user_id').references(() => users.id),
  userUid: text('user_uid').notNull(), // Direct Firebase UID for fast lookups
  code: text('code'),
  name: text('name').notNull(),
  client: text('client'),
  location: text('location'),
  municipality: text('municipality').notNull(),
  department: text('department').notNull(),
  contractor: text('contractor'),
  supervision: text('supervision'),
  engineerInCharge: text('engineer_in_charge'),
  licenseNumber: text('license_number'),
  defaultHammerModel: text('default_hammer_model'),
  defaultHammerSerial: text('default_hammer_serial'),
  defaultCurve: text('default_curve'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Sclerometry tests table
export const sclerometryTests = pgTable('sclerometry_tests', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  elementTag: text('element_tag').notNull(),
  elementType: text('element_type').notNull(),
  levelAxis: text('level_axis'),
  fcDesignMpa: doublePrecision('fc_design_mpa').default(21),
  fcDesignPsi: doublePrecision('fc_design_psi').default(3000),
  concreteAgeDays: integer('concrete_age_days').default(28),
  hammerModel: text('hammer_model'),
  hammerSerial: text('hammer_serial'),
  impactAngle: integer('impact_angle').default(0),
  surfaceCondition: text('surface_condition'),
  carbonationDepthMm: doublePrecision('carbonation_depth_mm').default(0),
  curveModel: text('curve_model').default('PROCEQ_N_STANDARD'),
  customCurveParams: jsonb('custom_curve_params'),
  readings: jsonb('readings').notNull(), // array of numbers
  excludedIndices: jsonb('excluded_indices'),
  meanRaw: doublePrecision('mean_raw'),
  correctionAngle: doublePrecision('correction_angle'),
  meanCorrected: doublePrecision('mean_corrected'),
  stdDev: doublePrecision('std_dev'),
  cov: doublePrecision('cov'),
  estimatedFcMpa: doublePrecision('estimated_fc_mpa'),
  estimatedFcKgcm2: doublePrecision('estimated_fc_kgcm2'),
  estimatedFcPsi: doublePrecision('estimated_fc_psi'),
  complianceRatio: doublePrecision('compliance_ratio'),
  status: text('status'),
  statusNotes: text('status_notes'),
  photos: jsonb('photos'),
  notes: text('notes'),
  operatorName: text('operator_name'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Chart settings and preferences table (saves interactive curves, toggles, custom points)
export const chartSettings = pgTable('chart_settings', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull().unique(),
  settings: jsonb('settings').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  author: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  tests: many(sclerometryTests),
}));

export const sclerometryTestsRelations = relations(sclerometryTests, ({ one }) => ({
  project: one(projects, {
    fields: [sclerometryTests.projectId],
    references: [projects.id],
  }),
}));
