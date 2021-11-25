import { Router } from "express";
import { generateQuery, getDataSetsAsCsv } from "../controllers/Datasets";

// Datasets-route
const dataSetsRouter = Router();
dataSetsRouter.post("/", getDataSetsAsCsv);

dataSetsRouter.post("/query", generateQuery);

export default dataSetsRouter;
