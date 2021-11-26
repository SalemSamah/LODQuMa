import { Router } from "express";
import { generateSynonymsDictionary, generateQVCs } from "../controllers/Synonyms";

// Synonyms-route
const synonymsRouter = Router();

synonymsRouter.post("/dictionary", generateSynonymsDictionary);
synonymsRouter.post("/qvc", generateQVCs);


export default synonymsRouter;
