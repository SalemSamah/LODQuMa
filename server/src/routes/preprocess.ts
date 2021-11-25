import { Router } from "express";
import {
  generateDiffStats,
  generateSynonymSets,
} from "../controllers/Preprocess";

// Preprocess-route
const preprocessRouter = Router();

preprocessRouter.post("/stats", generateDiffStats);

preprocessRouter.post("/distinct", generateSynonymSets);

export default preprocessRouter;
