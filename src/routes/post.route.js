import express from "express";
import { isAuthenticateUser } from "../Middleware/isAuthenticatedUser.js";
import upload from "../Middleware/multer.js";
import { addComment, addNewPost, bookmarkPost, deletePost, dislikePost, getAllPost, getCommentsOfPost, getUserPost, likePost,} from "../controllers/post.controller.js";



const router = express.Router();


router.route("/addpost").post(isAuthenticateUser,upload.single('image'), addNewPost)
router.route("/all").get(isAuthenticateUser,getAllPost)
router.route("/userpost/all").get(isAuthenticateUser,getUserPost)
router.route("/:id/like").get(isAuthenticateUser,likePost)
router.route("/:id/dislike").get(isAuthenticateUser,dislikePost)
router.route("/:id/comment").post(isAuthenticateUser,addComment)
router.route("/:id/comment/all").post(isAuthenticateUser,getCommentsOfPost)
router.route("/delete/:id").delete(isAuthenticateUser,deletePost)
router.route("/:id/bookmark").get(isAuthenticateUser,bookmarkPost)

export default router;