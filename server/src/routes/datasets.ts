import { Router } from "express";
import { generateQuery, getDataSetsAsCsv } from "../controllers/DataSets";

// Datasets-route
const dataSetsRouter = Router();
dataSetsRouter.post("/", getDataSetsAsCsv);

dataSetsRouter.post("/query", generateQuery);

export default dataSetsRouter;
