import { Router } from "express";
import userRouter from "./users";
import dataRouter from "./datasets";
import preprocessRouter from "./preprocess";
import synonymsRouter from "./synonyms";

// Export the base-router
const baseRouter = Router();
// User-route
baseRouter.use("/users", userRouter);
// data-route
baseRouter.use("/data", dataRouter);
// preprocess-route >  data set pre processing
baseRouter.use("/dpp", preprocessRouter);
// synonyms-route
baseRouter.use("/synonyms", synonymsRouter);

export default baseRouter;
