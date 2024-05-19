const express = require("express");
const sendEMailMsgCtrl = require("../../controllers/Email/emailMsgCtrl");
const userAuth = require("../../middleware/auth/Auth");

const emailrouter = express.Router();

emailrouter.post("/", userAuth, sendEMailMsgCtrl);

module.exports = emailrouter;
