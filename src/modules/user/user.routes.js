import { Router } from "express";
import UserController from "./user.controller.js";
import authenticationMiddlewares from "../../middlewares/auth.middleware.js";



const router = Router();

const auth = authenticationMiddlewares.authentication;


router.post("/", UserController.getUserByEmail);

router.get("/status", auth, UserController.getIssuesCountStatus);
router.get("/profile", auth, UserController.getCurrentUser);
router.put("/profile", auth, UserController.updateProfile);



export default router;