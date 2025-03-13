const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
   countryCode: {
      type: String,
      required: true,
      trim: true
   },
   mobileNumber: {
      type: String,
      required: true,
      trim: true,
      min: 3,
      max: 20,
   },
   webName: {
      type: String,
      required: true,
      //   unique: true,
      trim: true,
      index: true,
      min: 3,
      max: 20,
   },
   fullName: {
      type: String,
      required: true,
      trim: true
   },
   dob: {
      type: String,
      // required: true,
      trim: true
   },
   description: {
      type: String,
      required: false,
      trim: true
   },
   role: {
      type: String,
      enum: ["user", "verified user", "business", "verified business"],
      default: "user",
   },
   accountStatus: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
   },
   profilePicture: {
      type: String,
   },
   believer: {
      type: [String],
      "default": []
   },
   fcmToken: {
      type: String,
      default: ""
   },
   //device will contain "device"
   device: {
      type: Map,
      of: String,
      // required: true
   },
   //registeredMeta will contain "registeredMeta"
   registeredMeta: {
      type: Map,
      of: String,
      // required: true
   },
   //lastLoginMeta will contain "lastLoginMeta"
   lastLoginMeta: {
      type: Map,
      of: String,
      // required: true,
      
   },
   userControlCenter: {
      type: Map,
      of: Boolean,
      // required: true
   },
   lastOnlineTime: {
      type: Date,
      default:null
   },
   contactList: {
      type: [String],
      "default": []
   },
   blip_count: {
      type: Number,
      default: 0
    },
    video_count: {
      type: Number,
      default: 0
    },
    photo_count: {
      type: Number,
      default: 0
    },
    article_count: {
      type: Number,
      default: 0
    },
    thoughts_count: {
      type: Number,
      default: 0
    },
    note_count: {
      type: Number,
      default: 0
    },
    music_count: {
      type: Number,
      default: 0
    },
    podcast_count: {
      type: Number,
      default: 0
    },
    believedBy: {
      type: [String],
      "default": []
   },
   voipToken: {
      type: String,
      default: ""
   },
   createdAt: { type: Date, default: Date.now },
   updatedAt: { type: Date, default: Date.now }

});
module.exports = mongoose.model("User", userSchema);

//device
// {
//    "deviceType": "mobile",
//    "deviceOS": "iOS",
//    "deviceId": "1233",
//    "deviceMake": "apple/ samsung/ google",
//    "deviceModel": "iphone 14, pixel 9"
// }

//registeredMeta
// {
//       "country": "Singapore",
//          "countryCode": "SG",
//                "regionName": "Central Singapore",
//                   "city": "Singapore",
//                      "zip": "409625",
//                         "lat": 1.32252,
//                            "lon": 103.898,
//                               "timezone": "Asia/Singapore",
//                                  "isp": "Singapore Telecommunications Ltd, Magix Services",
//                                     "org": "SingNet Pipte Ltd",
//                                        "as": "AS9506 Singtel Fibre Broadband",
//                                           "ip": "119.74.152.159"
// }

// lastLoginMeta
// {
//    "login_time": "",
//       "login_device_id": "",
//          "ip": "123.123.12.1"
// }
