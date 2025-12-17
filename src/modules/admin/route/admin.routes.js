import { Router } from "express";
import authenticationMiddlewares from "../../../middlewares/auth.middleware.js";
import AdminController from "../controller/admin.controller.js";
import UserController from "../../user/user.controller.js";


const router = Router();

const auth = authenticationMiddlewares.authentication;
const isAdmin = authenticationMiddlewares.authorization("admin");


router.get("/staffs", auth, isAdmin, UserController.getStaffUsers);

router.get("/users", auth, isAdmin, UserController.getUsers); 
router.put("/users", auth, isAdmin, UserController.updateUserByAdmin);

// Add new staff
router.post("/staff", auth, isAdmin, UserController.addStaff);
router.delete("/staff/:userId", auth, isAdmin, UserController.deleteUser);

// Assign new staff onto issue
router.put("/assign", auth, isAdmin, AdminController.assignStaff);
router.put("/reject/:issueId", auth, isAdmin, AdminController.rejectIssue);

export default router;