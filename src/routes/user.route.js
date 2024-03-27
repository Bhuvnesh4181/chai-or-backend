import { Router } from "express";
import { resigerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
const router=Router();
router.route("/resister").post(
    upload.fields([
        {
          name:"avatar",
          maxCount:1  
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    resigerUser
    );

export default router;