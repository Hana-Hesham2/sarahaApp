import { providerEnum, rolesEnum } from "../../common/enum/user.enum.js"
import { successResponse } from "../../common/utils/response.success.js"
import { decrypt, encrypt } from "../../common/utils/security/encrypt.security.js"
import { Compare, Hash } from "../../common/utils/security/hash.security.js"
import { GenerateToken, VerifyToken } from "../../common/utils/token.service.js"
import * as db_service from "../../DB/db.service.js"
import userModel from "../../DB/models/user.model.js"
import jwt from "jsonwebtoken";
import {OAuth2Client} from 'google-auth-library';
import { ACCESS_SECRET_KEY, SALT_ROUNDS, REFRESH_SECRET_KEY,PREFIX } from "../../../config/config.service.js"
import cloudinary from "../../common/utils/cloudinary.js"
import {randomUUID} from "crypto"
import revokeTokenModel from "../../DB/models/revokeToken.model.js"
// import { sendOTPEmail } from "./email.service.js"

export const sendOTPEmail = async ({ to, otp }) => {
  console.log(` OTP for ${to}: ${otp}`); 
};
// const sendEmailOtp = async ({ email, subject }) => {
//   const isBlocked = await ttl(blocked_otp_key({ email }));
//   if (isBlocked > 0) {
//     throw new Error(`you blocked please try again after ${isBlocked} seconds`);
//   }

//   const ttlOtp = await ttl(otp_key({ email, subject }));
//   if (ttlOtp > 0) {
//     throw new Error(
//       `you already have otp not expired yet please try again after ${ttlOtp} seconds`
//     );
//   }

//   if ((await get(max_otp_key({ email }))) >= 3) {
//     await setValue({
//       key: blocked_otp_key({ email }),
//       value: 1,
//       ttl: 15 * 60,
//     });
//     throw new Error("you exceed maximum number of trials");
//   }

//   const otp = await generateOtp();

//   await sendOTPEmail({ to: email, otp }); 

//   await setValue({
//     key: otp_key({ email, subject }),
//     value: Hash({ plainText: `${otp}` }),
//     ttl: 60 * 2,
//   });

//   await incr(max_otp_key({ email }));
// };


export const signUp = async (req, res, next) => {
  const { userName, email, password, confirmPassword, age, gender, phone} = req.body;
  console.log(req.file,"after");

  if(!req.file){
    throw new Error("File is required")
  }
  

//   if (password !== confirmPassword) {
//     throw new Error("Invalid password", { cause: 400 });
//   }

  if (await db_service.findOne({ model: userModel, filter: { email } })) {
    throw new Error("Email already exists", { cause: 409 });
  }

  const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
  folder: "sarahaApp/users"
});

  //  let coverPictures = [];

  // if (req.files?.coverPicture) {
  //   for (const file of req.files.coverPicture) {

  //     const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, {
  //       folder: "sarahaApp/users/coverPic"
  //     });

  //     coverPictures.push({ secure_url, public_id });
  //   }
  // }


// //   const hashedPassword = await Hash({ plainText: password });

// let arr_paths =[]
// for (const file of req.files.attachments) {
//   arr_paths.push(file.path)
// }

  const user = await db_service.create({
    model: userModel,
    data: {
      userName,
      email,
      password: Hash({plainText:password}),
      age,
      gender,
      phone: phone ? encrypt(phone) : null,
      profilePicture:{secure_url,public_id},
      coverPicture: [],
      role: rolesEnum.user
    },
  });

// // //   const otp = Math.floor(100000 + Math.random() * 900000); 

// // //   await sendOTPEmail({ to: email, otp });

  successResponse({ res, status: 201, message: "Successful Sign Up", data:user });
};

export const resendOtp = async (req, res, next) => {

  const { email } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      provider: providerEnum.system,
    },
  });

  if (!user) {
    throw new Error("User does not exist");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otp = otp;
  user.otpExpires = Date.now() + 5 * 60 * 1000;

  await user.save();

  await sendOTPEmail({ to: email, otp });


  return successResponse({
    res,
    message: "OTP resent successfully"
  });
};

export const signUpwithGmail = async (req, res, next) => {
  const { idToken } = req.body;
  console.log(idToken);

const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
      idToken,
      audience: "764522976030-d0d4vnatfm1t7pe0kn7sihfb2ubqv9hd.apps.googleusercontent.com",
      
  });
  const payload = ticket.getPayload();
  console.log(payload);
  const {email,email_verified,name,picture}=payload
  

  let user = await db_service.findOne({
    model: userModel,
    filter: { email }
  });
  
  if (!user){
    user = await db_service.create({
  model: userModel,
  data: {
    email,
    confirmed: email_verified,
    userName: name,             
    profilePicture: picture,     
    provider: providerEnum.google
  }
});
}
  const access_token = GenerateToken({
    payload:{ id: user._id, email:user.email },
    secret_key: ACCESS_SECRET_KEY,
    options:{
        expiresIn: "1h" 
    } 
  })
    
  successResponse({ res, message: "Successful Sign in", data: {access_token} })}

  
//   successResponse({ res, status: 201, message: "Successful Sign Up", data: user });

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: { email, provider: providerEnum.system },
  });

  if (!user) {
    throw new Error("User doesn't exist");
  }

  if (user.banUntil && user.banUntil > Date.now()) {
  throw new Error("You are banned for 5 minutes");
}


  if (!Compare({ plainText: password, cipherText: user.password })) {

  user.failedAttempts += 1;

  if (user.failedAttempts >= 5) {
    user.banUntil = Date.now() + 5 * 60 * 1000;
    user.failedAttempts = 0;
  }

  await user.save();

  throw new Error("Invalid Password", { cause: 400 });
}

user.failedAttempts = 0;
await user.save();

if (user.isTwoStepEnabled === true)  {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otp = otp;
  user.otpExpires = Date.now() + 5 * 60 * 1000;
  user.loginOTP = true;

  await user.save();

  await sendOTPEmail({ to: user.email, otp }); 

  return successResponse({ res, message: "OTP sent" });
}
  
  const jwtid = randomUUID()

  const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key:ACCESS_SECRET_KEY,  
    options: {
       expiresIn: 60*30,
       jwtid }
});
  const refresh_token = GenerateToken({
    payload:{ id: user._id, email:user.email },
    secret_key: REFRESH_SECRET_KEY,
    options:{ 
      expiresIn: "1y",
      jwtid } 
});
    
  successResponse({ res, message: "Successful Sign in", data: {access_token,refresh_token} });
};

export const sendEnable2FAOtp = async (req, res, next) => {

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  req.user.otp = otp;
  req.user.otpExpires = Date.now() + 5 * 60 * 1000;

  await req.user.save();

  await sendOTPEmail({ to: req.user.email, otp });

  successResponse({ res, message: "OTP sent to enable 2FA" });
};

export const verifyEnable2FA = async (req, res, next) => {
  const { otp } = req.body;

  if (
    req.user.otp !== otp ||
    req.user.otpExpires < Date.now()
  ) {
    throw new Error("Invalid or expired OTP");
  }

  req.user.isTwoStepEnabled = true;
  req.user.otp = null;
  req.user.otpExpires = null;

  await req.user.save();

  successResponse({ res, message: "2FA enabled successfully" });
};

export const confirmLogin = async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: { email }
  });

  // 1. check user exists
  if (!user) {
    throw new Error("User not found");
  }

  // 2. check login request
  if (!user.loginOTP) {
    throw new Error("No login request found");
  }

  // 3. check OTP
  if (user.otp !== otp || user.otpExpires < Date.now()) {
    throw new Error("Invalid or expired OTP");
  }

  // 4. reset values
  user.otp = null;
  user.otpExpires = null;
  user.loginOTP = false; 

  await user.save();

  // 5. generate tokens
  const jwtid = randomUUID();

  const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: ACCESS_SECRET_KEY,
    options: {
      expiresIn: 60 * 30,
      jwtid
    }
  });

  const refresh_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: REFRESH_SECRET_KEY,
    options: {
      expiresIn: "1y",
      jwtid
    }
  });

  successResponse({
    res,
    message: "Successful Login",
    data: { access_token, refresh_token }
  });
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: { email }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otp = otp;
  user.otpExpires = Date.now() + 5 * 60 * 1000;

  await user.save();

  await sendOTPEmail({ to: email, otp });

  successResponse({ res, message: "OTP sent to email" });
};

export const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: { email }
  });

  if (
    !user ||
    user.otp !== otp ||
    user.otpExpires < Date.now()
  ) {
    throw new Error("Invalid or expired OTP");
  }

  user.password = Hash({ plainText: newPassword });
  user.otp = null;
  user.otpExpires = null;

  await user.save();

  successResponse({ res, message: "Password reset successful" });
};

export const getProfile = async (req, res, next) => {
  
  
  successResponse({ res, message: "Done", data: req.user });
};

export const updateProfile = async (req, res, next) => {

  let { firstName, lastName, gender, phone } = req.body;

  if (phone) {
    phone = encrypt(phone);
  }

  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: req.user._id },
    update: { firstName, lastName, gender, phone }
  });

  if (!user) {
    throw new Error("User not found yet");
  }

  successResponse({ res, message: "Done", data: user });
};

export const updatePassword = async (req, res, next) => {

  let { oldPassword,newPassword } = req.body;

  if (!Compare({plainText:oldPassword,cipherText: req.user.password})){
    throw new Error ("Incorrect Old Password")
  }

  const hash= Hash({plainText:newPassword})
  
  req.user.password = hash

  await req.user.save()

  successResponse({ res });
};

export const shareProfile = async (req, res, next) => {
  const { id } = req.params;

  const user = await db_service.findById({
    model: userModel,
    id,
    select: "-password"
  });

  if (!user) {
    throw new Error("User not found yet");
  }

  user.visitCount += 1;
  await user.save();

  if (user.phone) {
    user.phone = decrypt(user.phone);
  }

  const data = { ...user._doc };

if (req.user?.role !== rolesEnum.admin && req.user._id.toString() !== user._id.toString()) {
  delete data.visitCount;
}

successResponse({ res, message: "Done", data });
};


export const refreshToken = async (req, res, next) => {
  const { authorization } = req.headers;

    if (!authorization) {
      throw new Error("Token is missing");
    }

    const [prefix,token]=authorization.split(" ")
    if(prefix!==PREFIX){
        throw new Error("Invalid Prefix")
    }

    const decoded = VerifyToken({ token, secret_key: REFRESH_SECRET_KEY});

    if (!decoded || !decoded.id) {
      throw new Error("Invalid token");
    }

   const user = await db_service.findOne({
    model: userModel,
    filter:{_id:decoded.id}});
    if(!user){
      throw new Error("User doesn't exist",{cause:400})
    }
    const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: ACCESS_SECRET_KEY,  
    options: { expiresIn: 60*5 }
});
    successResponse({res,data:access_token})
  }

export const logout = async (req, res, next) => {
  const {flag}=req.query
  
  if (flag === "all"){
    req.user.changeCredential= new Date()
    await req.user.save()

    await db_service.deleteMany({model:revokeTokenModel,filter:{userId:req.user._id}})
  }
  else{
    await db_service.create({
    model: revokeTokenModel,
    data: {
      tokenId:req.decoded.jti,
      userId:req.user._id,
      expiredAt: new Date(req.decoded.exp * 1000)
    }}
  )
}
  successResponse({ res });
};

export const uploadProfilePicture = async (req, res, next) => {

  if (!req.file) {
    throw new Error("Profile picture is required");
  }

  const user = await db_service.findById({
    model: userModel,
    id: req.user._id
  });

  const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
    folder: "sarahaApp/users/profile"
  });

  if (user.profilePicture) {

    user.gallery.push(user.profilePicture)

  }

  user.profilePicture = { secure_url, public_id }

  await user.save()

  successResponse({
    res,
    message: "Profile picture updated",
    data: user
  })
}

export const deleteProfilePicture = async (req, res, next) => {

  const user = await db_service.findById({
    model: userModel,
    id: req.user._id
  });

  if (!user.profilePicture) {
    throw new Error("No profile picture found");
  }

  await cloudinary.uploader.destroy(user.profilePicture.public_id)

  user.profilePicture = null

  await user.save()

  successResponse({
    res,
    message: "Profile picture deleted"
  })
}

export const uploadCoverPicture = async (req, res, next) => {

  if (!req.files?.length) {
    throw new Error("Cover pictures are required")
  }

  const user = await db_service.findById({
    model: userModel,
    id: req.user._id
  })

  const oldCovers = user.coverPicture?.length || 0
  const newCovers = req.files.length

  if (oldCovers + newCovers !== 2) {
    throw new Error("Cover pictures must equal 2")
  }

  let covers = []

  for (const file of req.files) {

    const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, {
      folder: "sarahaApp/users/cover"
    });

    covers.push({ secure_url, public_id })
  }

  user.coverPicture.push(...covers)

  await user.save()

  successResponse({
    res,
    message: "Cover pictures uploaded",
    data: user
  })
}