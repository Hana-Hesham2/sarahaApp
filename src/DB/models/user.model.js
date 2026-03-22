import mongoose from "mongoose";
import { rolesEnum,genderEnum, providerEnum } from "../../common/enum/user.enum.js";


const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: function () {
      return this.provider !== providerEnum.google;
    },
    minLength: 3,
    maxLength: 20,
    trim: true
  },
  lastName: {
    type: String,
    required: function () {
      return this.provider !== providerEnum.google;
    },
    minLength: 3,
    maxLength: 20,
    trim: true
  },
  email: {
    type: String,
    minLength: 3,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: function () {
      return this.provider !== providerEnum.google;
    },
    minLength: 6,
    trim: true
  },
  age: {
  type: Number,
  required: function () {
    return this.provider !== providerEnum.google;
  },
  min: 20,
  max: 60
},
  gender: {
    type: String,
    enum: Object.values(genderEnum),
    default: genderEnum.male
  },
  phone: {
  type: String,
  required: function () {
    return this.provider !== providerEnum.google;
  }
},
  profilePicture:{
    secure_url:String,
    public_id:String
  },
  coverPicture:[{
    secure_url:String,
    public_id:String
  }],
  changeCredential: Date,
  visitCount:{
type:Number,
default:0
},
failedAttempts: {
  type: Number,
  default: 0
},
banUntil: Date,
isTwoStepEnabled: {
  type: Boolean,
  default: false
},
otp: String,
otpExpires: Date,
loginOTP: {
  type: Boolean,
  default: false
},
gallery:[
{
secure_url:String,
public_id:String
}
],   
  confirmed: {
  type: Boolean,
  default: false
},

expiresAt: {
  type: Date,
  default: function () {
    if (this.confirmed) return null;
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  },
  expires: 0
},
  provider: {
    type: String,
    enum: Object.values(providerEnum),
    default: providerEnum.system
  },
  role:{
    type: String,
    enum: Object.values(rolesEnum),
    default: rolesEnum.user
  }
}, {
  timestamps: true,
  strictQuery: true,
  toJSON: { virtuals: true }
});
userSchema.virtual("userName")
.set(function(v){
  const [firstName,lastName]=v.split(" ")
  this.set({firstName,lastName})
})


const userModel= mongoose.models.user || mongoose.model("user",userSchema)

export default userModel