import { Router } from "express";
import { loggoutUser,loginUser,resigerUser,refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
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

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJwt ,loggoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;