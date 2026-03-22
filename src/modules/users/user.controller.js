import { Router} from "express";
import * as US from "./user.service.js"
import * as UV from "./user.validation.js"
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { rolesEnum } from "../../common/enum/user.enum.js";
import { validation } from "../../common/middleware/validation.js";
import multer from "multer";
import { multer_host, multer_local } from "../../common/middleware/multer.js";
import { multer_enum } from "../../common/enum/multer.enum.js";
const userRouter=Router()


userRouter.post(
  "/signup",
  multer_local({ custom_types: multer_enum.image }).single("attachment"),
  validation(UV.signUpSchema),
  US.signUp
);

userRouter.post("/signup/gmail",US.signUpwithGmail)
userRouter.post("/signin",validation(UV.signInSchema),US.signIn)
userRouter.patch("/enable-2fa", authentication, US.enable2FA)
userRouter.post("/confirm-login", US.confirmLogin)
userRouter.get("/refresh-token",US.refreshToken)
userRouter.get("/profile", authentication, US.getProfile);
userRouter.patch("/update-profile",validation(UV.updateProfileSchema) ,authentication, US.updateProfile);
userRouter.patch("/update-password",authentication,validation(UV.updatePasswordSchema) , US.updatePassword);
userRouter.get("/share-profile/:id",authentication,validation(UV.shareProfileSchema), US.shareProfile);
userRouter.post("/logout", authentication, US.logout);
userRouter.patch("/upload-profile-picture",authentication,multer_local({ custom_types: multer_enum.image }).single("image"),US.uploadProfilePicture);
userRouter.delete("/delete-profile-picture",authentication,US.deleteProfilePicture);
userRouter.patch("/upload-cover-picture",authentication,multer_local({ custom_types: multer_enum.image }).array("images",2),US.uploadCoverPicture);
export default userRouter