import { Router } from "express";
import userRouter from "./users";
import dataRouter from "./datasets";
import preprocessRouter from "./preprocess";

// Export the base-router
const baseRouter = Router();
// User-route
baseRouter.use("/users", userRouter);
// data-route
baseRouter.use("/data", dataRouter);
// preprocess-route
// Data set pre processing
baseRouter.use("/dpp", preprocessRouter);

export default baseRouter;
