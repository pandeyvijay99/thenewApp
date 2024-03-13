const { StatusCodes } = require("http-status-codes");
const Blip = require("../models/blip");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");


//Fetch User Details 

const fetchBlip = async (req, res) => {
    // console.log("validation ")
  try {
    console.log("inside validation ")
     if (!req.body.countryCode || !req.body.mobileNumber) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "Please Enter Valid Number with country Code",
        });
     }
 
     const blips = await Blip.findOne({ mobileNumber: req.body.mobileNumber });
    // console.log("user details ",user)
     if (blips) {
           console.log("user ", user);
        res.status(StatusCodes.OK).json({statusCode:"0",message:"",
        data: { blips}
  });
 
 } else {
  res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
      message: "Blip does not exist..!",
      data:null
  });
 }
 } catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.BAD_REQUEST).json({ error });
  }
 };

 module.exports = {fetchBlip };