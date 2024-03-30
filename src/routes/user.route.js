import { Router } from "express";
import { loggoutUser,loginUser,resigerUser,refreshAccessToken, 
changeCurrentPassword, 
getUserChannelProfile,
getCurrentUser,
updateAccountDetails,
updateUserAvatar,
updateUserCoverImage,
getWatchHistory} from "../controllers/user.controller.js";
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
router.route("/change-password").post(verifyJwt,changeCurrentPassword);
router.route("/current-user").get(verifyJwt,getCurrentUser);
router.route("/update-account").patch(verifyJwt,updateAccountDetails);

router.route("/avatar").patch(verifyJwt,upload.single("avatar"),updateUserAvatar);
router.route("/coverimage").patch(verifyJwt,upload.single("coverImage"),updateUserCoverImage);
router.route("/c/:username").get(verifyJwt,getUserChannelProfile);
router.route("/history").get(verifyJwt,getWatchHistory);
export default router;