import { Router } from "express";
import {
  generateSynonymsDictionary,
  generateQVCs,
  saveDistinctPredicates,
  cleanDictionary,
} from "../controllers/Synonyms";

// Synonyms-route
const synonymsRouter = Router();

synonymsRouter.post("/dictionary", generateSynonymsDictionary);
synonymsRouter.post("/saveDistinct", saveDistinctPredicates);
synonymsRouter.post("/clean", cleanDictionary);
synonymsRouter.post("/qvc", generateQVCs);

export default synonymsRouter;
