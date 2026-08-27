import { db } from './index.ts';
import { users, projects, sclerometryTests, chartSettings } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';

// -------------------------------------------------------------
// USER HELPERS
// -------------------------------------------------------------
export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database user upsert failed:", error);
    throw new Error("Failed to synchronize user.", { cause: error });
  }
}

// -------------------------------------------------------------
// PROJECT HELPERS
// -------------------------------------------------------------
export async function getProjectsByUid(userUid: string) {
  try {
    return await db.select().from(projects).where(eq(projects.userUid, userUid)).orderBy(desc(projects.updatedAt));
  } catch (error) {
    console.error("Database getProjectsByUid failed:", error);
    throw new Error("Failed to fetch projects.", { cause: error });
  }
}

export async function upsertProject(projectData: typeof projects.$inferInsert) {
  try {
    const result = await db.insert(projects)
      .values(projectData)
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          code: projectData.code,
          name: projectData.name,
          client: projectData.client,
          location: projectData.location,
          municipality: projectData.municipality,
          department: projectData.department,
          contractor: projectData.contractor,
          supervision: projectData.supervision,
          engineerInCharge: projectData.engineerInCharge,
          licenseNumber: projectData.licenseNumber,
          defaultHammerModel: projectData.defaultHammerModel,
          defaultHammerSerial: projectData.defaultHammerSerial,
          defaultCurve: projectData.defaultCurve,
          notes: projectData.notes,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database upsertProject failed:", error);
    throw new Error("Failed to save project.", { cause: error });
  }
}

export async function deleteProject(projectId: string, userUid: string) {
  try {
    const result = await db.delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userUid, userUid)))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database deleteProject failed:", error);
    throw new Error("Failed to delete project.", { cause: error });
  }
}

// -------------------------------------------------------------
// SCLEROMETRY TEST HELPERS
// -------------------------------------------------------------
export async function getTestsByUid(userUid: string) {
  try {
    return await db.select().from(sclerometryTests).where(eq(sclerometryTests.userUid, userUid)).orderBy(desc(sclerometryTests.updatedAt));
  } catch (error) {
    console.error("Database getTestsByUid failed:", error);
    throw new Error("Failed to fetch tests.", { cause: error });
  }
}

export async function getTestsByProjectId(projectId: string, userUid: string) {
  try {
    return await db.select()
      .from(sclerometryTests)
      .where(and(eq(sclerometryTests.projectId, projectId), eq(sclerometryTests.userUid, userUid)))
      .orderBy(desc(sclerometryTests.createdAt));
  } catch (error) {
    console.error("Database getTestsByProjectId failed:", error);
    throw new Error("Failed to fetch project tests.", { cause: error });
  }
}

export async function upsertTest(testData: typeof sclerometryTests.$inferInsert) {
  try {
    const result = await db.insert(sclerometryTests)
      .values(testData)
      .onConflictDoUpdate({
        target: sclerometryTests.id,
        set: {
          projectId: testData.projectId,
          elementTag: testData.elementTag,
          elementType: testData.elementType,
          levelAxis: testData.levelAxis,
          fcDesignMpa: testData.fcDesignMpa,
          fcDesignPsi: testData.fcDesignPsi,
          concreteAgeDays: testData.concreteAgeDays,
          hammerModel: testData.hammerModel,
          hammerSerial: testData.hammerSerial,
          impactAngle: testData.impactAngle,
          surfaceCondition: testData.surfaceCondition,
          carbonationDepthMm: testData.carbonationDepthMm,
          curveModel: testData.curveModel,
          customCurveParams: testData.customCurveParams,
          readings: testData.readings,
          excludedIndices: testData.excludedIndices,
          meanRaw: testData.meanRaw,
          correctionAngle: testData.correctionAngle,
          meanCorrected: testData.meanCorrected,
          stdDev: testData.stdDev,
          cov: testData.cov,
          estimatedFcMpa: testData.estimatedFcMpa,
          estimatedFcKgcm2: testData.estimatedFcKgcm2,
          estimatedFcPsi: testData.estimatedFcPsi,
          complianceRatio: testData.complianceRatio,
          status: testData.status,
          statusNotes: testData.statusNotes,
          photos: testData.photos,
          notes: testData.notes,
          operatorName: testData.operatorName,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database upsertTest failed:", error);
    throw new Error("Failed to save sclerometry test.", { cause: error });
  }
}

export async function deleteTest(testId: string, userUid: string) {
  try {
    const result = await db.delete(sclerometryTests)
      .where(and(eq(sclerometryTests.id, testId), eq(sclerometryTests.userUid, userUid)))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database deleteTest failed:", error);
    throw new Error("Failed to delete test.", { cause: error });
  }
}

// -------------------------------------------------------------
// CHART SETTINGS HELPERS (State Persistence)
// -------------------------------------------------------------
export async function getChartSettingsByUid(userUid: string) {
  try {
    const result = await db.select().from(chartSettings).where(eq(chartSettings.userUid, userUid));
    return result[0]?.settings || null;
  } catch (error) {
    console.error("Database getChartSettingsByUid failed:", error);
    throw new Error("Failed to fetch chart settings.", { cause: error });
  }
}

export async function saveChartSettings(userUid: string, settings: any) {
  try {
    const result = await db.insert(chartSettings)
      .values({
        userUid,
        settings,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: chartSettings.userUid,
        set: {
          settings,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0]?.settings;
  } catch (error) {
    console.error("Database saveChartSettings failed:", error);
    throw new Error("Failed to persist chart settings.", { cause: error });
  }
}
