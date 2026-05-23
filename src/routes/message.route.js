import express from "express";
import { isAuthenticateUser } from "../Middleware/isAuthenticatedUser.js";
import { getMessage, sendMessage } from "../controllers/message.controller.js";


const router = express.Router();

router.route("/send/:id").post(isAuthenticateUser,sendMessage)
router.route("/all/:id").get(isAuthenticateUser,getMessage)



export default router;
