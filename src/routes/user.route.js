import express from"express";
import { editUserProfile, followOrUnfollow, getSuggestedUser, LoginController, logoutController, RegisterContoller } from "../controllers/User.Controller.js";
import { isAuthenticateUser } from "../Middleware/isAuthenticatedUser.js";
import upload from "../Middleware/multer.js";

const router = express.Router();

router.route("/register").post(RegisterContoller);
router.route("/login").post(LoginController);
router.route("/logout").get(logoutController);
router.route("/:id/profile").get(isAuthenticateUser);
router.route('/profile/edit').post(isAuthenticateUser, upload.single('profilPic'), editUserProfile);
router.route("/suggested").get(isAuthenticateUser,getSuggestedUser);
router.route("/followorunfollow/:id").post(isAuthenticateUser,followOrUnfollow);

export default router;

