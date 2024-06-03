const { StatusCodes } = require("http-status-codes");
const User = require("../models/auth");
const Webname = require("../models/webname");
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
     return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
        message: "Please Provide Required Information",data:null
     });
  }

//   const hash_password = await bcrypt.hash(password, 10);
 
//   const userData = {
//      countryCode,
//      mobileNumber
//   };
const userData = req.body;

  const user = await User.findOne({ mobileNumber });
  if (user) {
     return res.status(StatusCodes.OK).json({statusCode:1,
        message: "User already registered",data:null
     });
  } else {
     User.create(userData).then((user, err) => {
     if (err) return res.status(StatusCodes.OK).json({ statusCode:1,message:err,data:null });
     else{
      // console.log("data is ", user);
      /*Insert webName */
      const update = { webName: req.body.webName ,mobileNumber: req.body.mobileNumber};
        
        // `doc` is the document _after_ `update` was applied because of
        // `returnOriginal: false`
      //   const doc = await Webname.findOneAndUpdate(filter, update, {
      //     returnOriginal: false
      //   });
      Webname.create(update).then((data, err) => {
         if (err) return res.status(StatusCodes.OK).json({statusCode:1,message: err,data:null });
         // else
         //   res
         //    .status(StatusCodes.OK)
         //    .json({statusCode:0, message: "User created Successfully",data:null });
         });
      /*End of WebName insertion*/
      const accessToken = jwt.sign(
         { _id: user._id, mobileNumber: user.mobileNumber },
         process.env.JWT_SECRET,{ expiresIn: "100d"});
       res
        .status(StatusCodes.OK)
        .json({statusCode:0, message: "User created Successfully", data:{accessToken,user}});
     }
     });
  }
};
const signIn = async (req, res) => {
    // console.log("validation ")
  try {
    console.log("inside validation ")
     if (!req.body.countryCode || !req.body.mobileNumber) {
        return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "Please Enter Valid Number with country Code",data:null
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

        return res.status(StatusCodes.OK).json({
         statusCode:0,
         message:"",
            
            
            // refreshTokens,
      //   data: { _id,countryCode, mobileNumber },
      data:{accessToken,user}
  });
 
} else {
  return res.status(StatusCodes.OK).json({statusCode:1,
      message: "User does not exist..!",data:null
  });
}
} catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1, message:error,data:null });
  }
};
//update the existing document with new details
const webNameCheck = async (req, res) => {
     console.log("webName validation ")
  try {

      console.log("inside  webName validation ",req.body);
      if (!req.body.webName ) {
        return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "Please Enter Valid WebName",data:null
        });
     }
 
     const user = await Webname.findOne({ webName:req.body.webName });
     if (user) {
        return res.status(StatusCodes.OK).json({statusCode:1,
           message: "WebName already registered",data:null
        });
     } else {
      console.log("data available")
      //   const filter = { mobileNumber: req.body.mobileNumber };
      //   const update = { webName: req.body.webName ,mobileNumber: req.body.mobileNumber};
        
      //   // `doc` is the document _after_ `update` was applied because of
      //   // `returnOriginal: false`
      // //   const doc = await Webname.findOneAndUpdate(filter, update, {
      // //     returnOriginal: false
      // //   });
      // Webname.create(update).then((data, err) => {
      //    if (err) res.status(StatusCodes.OK).json({statusCode:1,message: err,data:null });
      //    else
      //      res
      //       .status(StatusCodes.OK)
      //       .json({statusCode:0, message: "User created Successfully",data:null });
      //    });
      //   res.status(StatusCodes.OK).json({statusCode:0,
      //    message:"",   
      //    data: { doc },

      // });
      return res.status(StatusCodes.OK).json({statusCode:0,
         message: "webName available",data:null
      });

   }
     
} catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.BAD_REQUEST).json({ statusCode:1,message: error,data:null });
  }
};

//user details Update 
const updateUserDetails = async (req, res) => {
    // console.log("user updation ")
  try {

    console.log("userUpdation ",req.body);
     if (((req.body.fullName)&& !req.body.fullName) || ((req.body.description)&&!req.body.description)) {
        return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "Please Enter Valid Input",data:null
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
        return res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { doc },
      });
     }  
} catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.OK).json({ statusCode:1,message: error,data:null });
  }
};

//Fetch User Details 

const getUserDetails = async (req, res) => {
   // console.log("validation ")
 try {
   console.log("inside validation ")
   //  if (!req.body.countryCode || !req.body.mobileNumber) {
   //     res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
   //        message: "Please Enter Valid Number with country Code",data:null
   //     });
   //  }
    if (!req.body.userId ) {
      return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
         message: "Please Provide Valid details ",data:null
      });
   }

    const user = await User.findOne({ _id: req.body.userId });
   // console.log("user details ",user)
    if (user) {
          console.log("user ", user);
       return res.status(StatusCodes.OK).json({statusCode:0,message:"",
       data: { user}
 });

} else {
 return res.status(StatusCodes.BAD_REQUEST).json({
   statusCode:1,
     message: "User does not exist..!",
     data:null
 });
}
} catch (error) {
   console.log("catch ", error );
  return res.status(StatusCodes.BAD_REQUEST).json({ error });
 }
};
//Code for searchWebName
const searchWebName = async (req, res) => {
   // console.log("user updation ")
 try {

   console.log("userUpdation ",req.body);
    if (!req.body.searchString) {
       return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
          message: "Please Enter Valid Input",data:null
       });
    }
    
    const user = await Webname.find({ webName:{$regex:req.body.searchString}});
    console.log("data  response is ",user.length);
    
    if (user && user.length>0) {
      return res.status(StatusCodes.OK).json({statusCode:0,
         message: "",data:user
      });
       
    } else {
      return res.status(StatusCodes.OK).json({statusCode:1,
         message: "No data found",data:null
      });
   }  
} catch (error) {
   console.log("catch ", error );
  return res.status(StatusCodes.OK).json({ statusCode:1,message: error,data:null });
 }
};

/*Believers Blip  */
const believer = async (req, res) => {

   try{
    /*code for getting user_id from  header*/
    const authHeader = (req.headers.authorization)?req.headers.authorization:null;
    if(authHeader){
        const token =  authHeader.split(' ')[1];
        if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null}); 
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("token" , token);
            user_id = decoded._id;
            console.log("user id ",decoded._id);
    }
    if (!req.body.believers && (req.body.believers).length==0) {
     return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
        message: "Provide atleast one believer",data:null
     });
  }
  const ObjectId = require('mongoose').Types.ObjectId
//   const conditions = {  _id: new ObjectId(user_id) };
//   const result = await User.updateMany(conditions,{ $addToSet: { believer: { $each: req.body.believers } } }, { multi: true })
debugger
const doc = await User.findById( new ObjectId(user_id));

  if (!doc) {
   return res.status(StatusCodes.OK).json({statusCode:1,
      message: "no data found",data:""
   });
  }

  const index = doc.believer.indexOf(req.body.believers);
  if (index > -1) {
    // User ID is in the believers array, remove it
    doc.believer.splice(index, 1);
  } else {
    // User ID is not in the believers array, add it
    console.log("believer",req.body.believers)
   let believer = req.body.believers
    doc.believer.push(...believer);
  }

  await doc.save();

return res.status(StatusCodes.OK).json({statusCode:0,
   message: "",data:"data saved"
});
  debugger
   }catch(error){
      return res.status(StatusCodes.OK).json({statusCode:1,
         message: error,data:null
      });
   }
 }; 
 
/*Believers Blip  */
const getBeleiver = async (req, res) => {

   try{
    /*code for getting user_id from  header*/
    const authHeader = (req.headers.authorization)?req.headers.authorization:null;
    if(authHeader){
        const token =  authHeader.split(' ')[1];
        if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null}); 
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("token" , token);
            user_id = decoded._id;
            console.log("user id ",decoded._id);
    }
    const ObjectId = require('mongoose').Types.ObjectId
  const conditions = {  _id: new ObjectId(user_id) };
   // const result = await User.find(conditions,{believer:1 })
   const result = await User.find().populate('believer');
  return res.status(StatusCodes.OK).json({statusCode:0,
   message: "",data:result
});
  debugger
   }catch(error){
      return res.status(StatusCodes.OK).json({statusCode:1,
         message: "something went wrong",data:null
      });
   }
 }; 

module.exports = { signUp, signIn,webNameCheck,updateUserDetails,getUserDetails,searchWebName,believer,getBeleiver};