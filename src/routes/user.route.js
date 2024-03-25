import { Router } from "express";
import { resigerUser } from "../controllers/user.controller.js";
const router=Router();
router.route("/resister").post(resigerUser);

export default router;