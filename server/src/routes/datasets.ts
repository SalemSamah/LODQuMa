import { Router } from "express";
import { generateQuery, getDataSetsAsCsv } from "../controllers/DataSets";

// DataSets-route
const dataSetsRouter = Router();
dataSetsRouter.get("/", getDataSetsAsCsv);

dataSetsRouter.get("/query", generateQuery);

export default dataSetsRouter;
