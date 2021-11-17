import { Router } from "express";
import userRouter from "./users";

// Export the base-router
const baseRouter = Router();
// User-route
baseRouter.use("/users", userRouter);
// Other-route
// baseRouter.use("/otherRoutes", OtherRoute);

export default baseRouter;
