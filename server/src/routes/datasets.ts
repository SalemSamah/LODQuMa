import { Router } from "express";
import { getDataSetsAsCsv } from "../controllers/DataSets";

// DataSets-route
const dataSetsRouter = Router();
dataSetsRouter.get("/", getDataSetsAsCsv);

export default dataSetsRouter;
