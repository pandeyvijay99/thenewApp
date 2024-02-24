const { StatusCodes } = require("http-status-codes");
const User = require("../models/auth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");
/**
 * @api {post} /api/signin Request User information
 * @apiName signin
 * @apiGroup User
 * @apiParam {coutryCode} {string} CountryCode is required.
 * @apiParam {mobileNumber} {String} MobileNumber is required.
 * 
 */
const signUp = async (req, res) => {
  const { countryCode, mobileNumber } = req.body;
//   console.log("data is ",req.body)
  if (!countryCode || !mobileNumber ) {
     return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Please Provide Required Information",
     });
  }

//   const hash_password = await bcrypt.hash(password, 10);
 
  const userData = {
     countryCode,
     mobileNumber
  };

  const user = await User.findOne({ mobileNumber });
  if (user) {
     return res.status(StatusCodes.BAD_REQUEST).json({
        message: "User already registered",
     });
  } else {
     User.create(userData).then((data, err) => {
     if (err) res.status(StatusCodes.BAD_REQUEST).json({ err });
     else
       res
        .status(StatusCodes.CREATED)
        .json({ message: "User created Successfully" });
     });
  }
};
const signIn = async (req, res) => {
    // console.log("validation ")
  try {
    console.log("inside validation ")
     if (!req.body.countryCode || !req.body.mobileNumber) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "Please Enter Valid Number with country Code",
        });
     }
 
     const user = await User.findOne({ mobileNumber: req.body.mobileNumber });
    // console.log("user details ",user)
     if (user) {
           const accessToken = jwt.sign(
              { _id: user._id, mobileNumber: user.mobileNumber },
              process.env.JWT_SECRET,{ expiresIn: "100d"});
        const { _id,mobileNumber,countryCode} = user;
        // const refreshToken = jwt.sign({ username: user.username, role: user.role }, refreshTokenSecret);

        // refreshTokens.push(refreshToken);

        res.status(StatusCodes.OK).json({
            accessToken,
            // refreshTokens,
        user: { _id,countryCode, mobileNumber },
  });
 
} else {
  res.status(StatusCodes.BAD_REQUEST).json({
      message: "User does not exist..!",
  });
}
} catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.BAD_REQUEST).json({ error });
  }
};
//update the existing document with new details
const webNameCheck = async (req, res) => {
    // console.log("webName validation ")
  try {

    console.log("inside  webName validation ",req.body);
     if (!req.body.webName ) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "Please Enter Valid WebName",
        });
     }
 
     const user = await User.findOne({ webName:req.body.webName });
     if (user) {
        return res.status(StatusCodes.BAD_REQUEST).json({
           message: "WebName already registered",
        });
     } else {
        const filter = { mobileNumber: req.body.mobileNumber };
        const update = { webName: req.body.webName };
        
        // `doc` is the document _after_ `update` was applied because of
        // `returnOriginal: false`
        const doc = await User.findOneAndUpdate(filter, update, {
          returnOriginal: false
        });
        res.status(StatusCodes.OK).json({
            user: { doc },
      });

     }
     
} catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.BAD_REQUEST).json({ error });
  }
};

//user details Update 
const updateUserDetails = async (req, res) => {
    // console.log("user updation ")
  try {

    console.log("userUpdation ",req.body);
     if (((req.body.fullName)&& !req.body.fullName) || ((req.body.description)&&!req.body.description)) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "Please Enter Valid Input",
        });
     }
 
     const user = await User.where({ mobileNumber:req.body.mobileNumber });
    //  console.log("user details ",user)
     if (user) {
        const filter = { mobileNumber: req.body.mobileNumber };
        const update = req.body;
        // console.log("updated value",update)
        // `doc` is the document _after_ `update` was applied because of
        // `returnOriginal: false`
        const doc = await User.findOneAndUpdate(filter, {$set:req.body}, {
          returnOriginal: false
        });
        res.status(StatusCodes.OK).json({
            user: { doc },
      });
     }  
} catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.BAD_REQUEST).json({ error });
  }
};

//Fetch User Details 

const getUserDetails = async (req, res) => {
   // console.log("validation ")
 try {
   console.log("inside validation ")
    if (!req.body.countryCode || !req.body.mobileNumber) {
       res.status(StatusCodes.BAD_REQUEST).json({
          message: "Please Enter Valid Number with country Code",
       });
    }

    const user = await User.findOne({ mobileNumber: req.body.mobileNumber });
   // console.log("user details ",user)
    if (user) {
          console.log("user ", user);
       res.status(StatusCodes.OK).json({statusCode:"0",message:"",
       data: { user}
 });

} else {
 res.status(StatusCodes.BAD_REQUEST).json({
     message: "User does not exist..!",
 });
}
} catch (error) {
   console.log("catch ", error );
  res.status(StatusCodes.BAD_REQUEST).json({ error });
 }
};

module.exports = { signUp, signIn,webNameCheck,updateUserDetails,getUserDetails};