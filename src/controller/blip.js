const { StatusCodes } = require("http-status-codes");
const Blip = require("../models/blip");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");
const { BlobServiceClient,StorageSharedKeyCredential } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
// const { DefaultAzureCredential } = require('@azure/identity');
const multer = require('multer');
const path = require('path');
require("dotenv").config();


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

 //upload Profile Pic 


const uploadProfilePic = async (req, res) => {
  const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const accountName = process.env.ACCOUNT_NAME;
const accountKey = process.env.KEY_DATA;
const containerName = process.env.PROFILE_CONTAINER;
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
);
const containerClient = blobServiceClient.getContainerClient(containerName);
const file = req.files.file;
// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
// });


    if (!file) {
        return res.status(400).send({statusCode:1, message:'No file uploaded.',data:null});
    }else if (file.size>(5*1024*1024)){
      return res.status(400).send({statusCode:1, message:'Maximum allowed size is 5MB',data:null});
    }
    const blobName = file.name;
    const stream = file.data;

    // Upload file to Azure Blob Storage
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    try {
        const uploadResponse = await blockBlobClient.upload(stream, stream.length);

        console.log('File uploaded successfully to Azure Blob Storage:', uploadResponse);
        const fileUrl = blockBlobClient.url;
        console.log("fileUrl",fileUrl)
        return res.status(200).send({statusCode:0,message:'',data:"File uploaded successfully."});
    } catch (error) {
        console.error("Error uploading to Azure Blob Storage:", error);
        return res.status(500).send({statusCode:1,message:'Error uploading file to Azure Blob Storage.',data:null});
    }

}

 //upload Blip  File

const uploadBlipFile = async (req, res) => {
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const accountName = process.env.ACCOUNT_NAME;
const accountKey = process.env.KEY_DATA;
const containerName = process.env.BLIP_CONTAINER;
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
);
const containerClient = blobServiceClient.getContainerClient(containerName);
const file = req.files.file;
// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
// });


    if (!file) {
        return res.status(400).send({statusCode:1, message:'No file uploaded.',data:null});
    }else if (file.size>(5*1024*1024)){
      return res.status(400).send({statusCode:1, message:'Maximum allowed size is 5MB',data:null});
    }
    const blobName = file.name;
    const stream = file.data;

    // Upload file to Azure Blob Storage
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    try {
        const uploadResponse = await blockBlobClient.upload(stream, stream.length);
        const fileUrl = blockBlobClient.url;
        console.log("fileUrl",fileUrl)
        console.log('File uploaded successfully to Azure Blob Storage:', uploadResponse);
        return res.status(200).send({statusCode:0,message:'',data:"File uploaded successfully."});
    } catch (error) {
        console.error("Error uploading to Azure Blob Storage:", error);
        return res.status(500).send({statusCode:1,message:'Error uploading file to Azure Blob Storage.',data:null});
    }

}

 module.exports = {fetchBlip,uploadProfilePic,uploadBlipFile };