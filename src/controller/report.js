const Report = require("../models/report");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");




const report = async (req, res) => {
    try {
        debugger
        const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
        if (authHeader) {
          const token = authHeader.split(' ')[1];
          if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
          console.log("token", token);
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          mobileNumber = decoded.mobileNumber;
          userId  = decoded._id  
        //   console.log("blipdecoded ", decoded.mobileNumber);
        }
        debugger;
        const reportData ={
            contentId :req.body.contentId?req.body.contentId:"",
            contentType :req.body.contentType?req.body.contentType:"",
            subContentType:req.body.subContentType?req.body.subContentType:"",
            subContentId:req.body.subContentId?req.body.subContentId:"",
            reporter:userId,
            description: req.body.description?req.body.description:""
        }
        const dumpReport = await Report.create(reportData);
    // const createdId = dumpReport._id;
        return res.status(StatusCodes.OK).json({
            statusCode: "0",
            message: "Report Successful",
            data: ""
        });
    } catch (error) {
       console.error("Error in getCall:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            statusCode: 1,
            message: error.message,
            data: null
        });
    }
};




module.exports = { report };