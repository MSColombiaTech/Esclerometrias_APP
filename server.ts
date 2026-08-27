import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, optionalAuth, AuthRequest } from "./src/middleware/auth.ts";
import { 
  getOrCreateUser, 
  getProjectsByUid, 
  upsertProject, 
  deleteProject, 
  getTestsByUid, 
  upsertTest, 
  deleteTest,
  getChartSettingsByUid,
  saveChartSettings
} from "./src/db/repository.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON payload parser with capacity for photos / base64
  app.use(express.json({ limit: "30mb" }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", engine: "PostgreSQL Cloud SQL + Express" });
  });

  // -------------------------------------------------------------
  // AUTH & USER SYNC
  // -------------------------------------------------------------
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || `${uid}@anonymous.local`;
      if (!uid) return res.status(401).json({ error: "Missing UID" });

      const user = await getOrCreateUser(uid, email);
      res.json({ user });
    } catch (error: any) {
      console.error("Auth sync error:", error);
      res.status(500).json({ error: error.message || "Failed to sync user profile" });
    }
  });

  // -------------------------------------------------------------
  // PROJECTS API
  // -------------------------------------------------------------
  app.get("/api/projects", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: "Unauthorized" });

      const projects = await getProjectsByUid(uid);
      res.json({ projects });
    } catch (error: any) {
      console.error("Fetch projects error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: "Unauthorized" });

      const projectData = req.body;
      if (!projectData.id || !projectData.name) {
        return res.status(400).json({ error: "Project ID and Name are required" });
      }

      // Sync user to get relational surrogate id if available
      const dbUser = await getOrCreateUser(uid, req.user?.email || `${uid}@local.com`);

      const saved = await upsertProject({
        id: projectData.id,
        userId: dbUser?.id,
        userUid: uid,
        code: projectData.code || '',
        name: projectData.name,
        client: projectData.client || '',
        location: projectData.location || '',
        municipality: projectData.municipality || 'Bogotá D.C.',
        department: projectData.department || 'Cundinamarca',
        contractor: projectData.contractor || '',
        supervision: projectData.supervision || '',
        engineerInCharge: projectData.engineerInCharge || '',
        licenseNumber: projectData.licenseNumber || '',
        defaultHammerModel: projectData.defaultHammerModel || 'Schmidt Tipo N',
        defaultHammerSerial: projectData.defaultHammerSerial || '',
        defaultCurve: projectData.defaultCurve || 'PROCEQ_N_STANDARD',
        notes: projectData.notes || '',
      });

      res.json({ project: saved });
    } catch (error: any) {
      console.error("Save project error:", error);
      res.status(500).json({ error: error.message || "Failed to save project" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const projectId = req.params.id;
      if (!uid) return res.status(401).json({ error: "Unauthorized" });

      const deleted = await deleteProject(projectId, uid);
      res.json({ success: true, deleted });
    } catch (error: any) {
      console.error("Delete project error:", error);
      res.status(500).json({ error: error.message || "Failed to delete project" });
    }
  });

  // -------------------------------------------------------------
  // SCLEROMETRY TESTS API
  // -------------------------------------------------------------
  app.get("/api/tests", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: "Unauthorized" });

      const tests = await getTestsByUid(uid);
      res.json({ tests });
    } catch (error: any) {
      console.error("Fetch tests error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch tests" });
    }
  });

  app.post("/api/tests", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: "Unauthorized" });

      const t = req.body;
      if (!t.id || !t.projectId || !t.elementTag) {
        return res.status(400).json({ error: "Test ID, Project ID and Element Tag are required" });
      }

      const saved = await upsertTest({
        id: t.id,
        projectId: t.projectId,
        userUid: uid,
        elementTag: t.elementTag,
        elementType: t.elementType || 'Otro',
        levelAxis: t.levelAxis || '',
        fcDesignMpa: t.fcDesignMpa ?? 21,
        fcDesignPsi: t.fcDesignPsi ?? 3000,
        concreteAgeDays: t.concreteAgeDays ?? 28,
        hammerModel: t.hammerModel || 'Schmidt Tipo N',
        hammerSerial: t.hammerSerial || '',
        impactAngle: t.impactAngle ?? 0,
        surfaceCondition: t.surfaceCondition || 'Pulido con piedra Carborundum',
        carbonationDepthMm: t.carbonationDepthMm ?? 0,
        curveModel: t.curveModel || 'PROCEQ_N_STANDARD',
        customCurveParams: t.customCurveParams || null,
        readings: t.readings || [],
        excludedIndices: t.excludedIndices || [],
        meanRaw: t.meanRaw ?? 0,
        correctionAngle: t.correctionAngle ?? 0,
        meanCorrected: t.meanCorrected ?? 0,
        stdDev: t.stdDev ?? 0,
        cov: t.cov ?? 0,
        estimatedFcMpa: t.estimatedFcMpa ?? 0,
        estimatedFcKgcm2: t.estimatedFcKgcm2 ?? 0,
        estimatedFcPsi: t.estimatedFcPsi ?? 0,
        complianceRatio: t.complianceRatio ?? 0,
        status: t.status || 'DIAGNOSTICO',
        statusNotes: t.statusNotes || '',
        photos: t.photos || [],
        notes: t.notes || '',
        operatorName: t.operatorName || '',
      });

      res.json({ test: saved });
    } catch (error: any) {
      console.error("Save test error:", error);
      res.status(500).json({ error: error.message || "Failed to save test" });
    }
  });

  app.delete("/api/tests/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const testId = req.params.id;
      if (!uid) return res.status(401).json({ error: "Unauthorized" });

      const deleted = await deleteTest(testId, uid);
      res.json({ success: true, deleted });
    } catch (error: any) {
      console.error("Delete test error:", error);
      res.status(500).json({ error: error.message || "Failed to delete test" });
    }
  });

  // -------------------------------------------------------------
  // CHART SETTINGS & PERSISTENCE API
  // -------------------------------------------------------------
  app.get("/api/chart-settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: "Unauthorized" });

      const settings = await getChartSettingsByUid(uid);
      res.json({ settings: settings || null });
    } catch (error: any) {
      console.error("Get chart settings error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch chart settings" });
    }
  });

  app.post("/api/chart-settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: "Unauthorized" });

      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ error: "Settings payload is required" });
      }

      const saved = await saveChartSettings(uid, settings);
      res.json({ success: true, settings: saved });
    } catch (error: any) {
      console.error("Save chart settings error:", error);
      res.status(500).json({ error: error.message || "Failed to save chart settings" });
    }
  });

  // -------------------------------------------------------------
  // VITE DEV MIDDLEWARE / STATIC PRODUCTION SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Esclerometría Pro Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
