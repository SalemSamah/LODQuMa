import { Router } from "express";
import {
  getAllUsers,
  addOneUser,
  updateOneUser,
  deleteOneUser,
} from "../controllers/Users";

// User-route
const userRouter = Router();
userRouter.get("/", getAllUsers);
userRouter.post("/", addOneUser);
userRouter.put("/", updateOneUser);
userRouter.delete("/:id", deleteOneUser);

export default userRouter;
