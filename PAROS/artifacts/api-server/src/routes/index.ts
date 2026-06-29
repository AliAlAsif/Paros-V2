import { Router, type IRouter } from "express";
import healthRouter from "./health";
import foldersRouter from "./folders";
import subjectsRouter from "./subjects";
import studySessionsRouter from "./studySessions";
import researchTopicsRouter from "./researchTopics";
import projectsRouter from "./projects";
import examsRouter from "./exams";
import notesRouter from "./notes";
import prayerExerciseRouter from "./prayerExercise";
import dashboardRouter from "./dashboard";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(foldersRouter);
router.use(subjectsRouter);
router.use(studySessionsRouter);
router.use(researchTopicsRouter);
router.use(projectsRouter);
router.use(examsRouter);
router.use(notesRouter);
router.use(prayerExerciseRouter);
router.use(dashboardRouter);
router.use(analyticsRouter);

export default router;
