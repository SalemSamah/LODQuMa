import { Router } from "express";
import userRouter from "./users";
import dataRouter from "./datasets";

// Export the base-router
const baseRouter = Router();
// User-route
baseRouter.use("/users", userRouter);
// Other-route
baseRouter.use("/data", dataRouter);

export default baseRouter;
