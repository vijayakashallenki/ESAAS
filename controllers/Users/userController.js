const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../../model/User/User.js");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.APP_STRIPE_SECRET_KEY);
const crypto = require("crypto");
const nodemailer = require("nodemailer");

//@dev logic register user
const registerUser = asyncHandler(async (req, res) => {
  // console.log("🚀register user");
  const { email, password, firstName, lastName } = req?.body;
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      throw new Error("User Already exists! Please Login.");
    }
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    //@dev stripe customer id
    const stripeCustomer = await stripe.customers.create({ email: email });
    // console.log(stripeCustomer);

    const newUser = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: encryptedPassword,
      stripe_customer_id: stripeCustomer.id,
    });

    //@dev set cookie token
    const data = {
      id: newUser?._id,
    };
    const token = jwt.sign(data, process.env.APP_JWT_SECRET_KEY, {
      expiresIn: "12h",
    });

    const createdUser = newUser;
    createdUser.password = undefined;

    // Set the cookie to expire in 12 hours
    const expiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000);

    res
      .status(201)
      .cookie("token", token, {
        expires: expiryDate,
        httpOnly: true,
        secure: true,
      })
      .json({ success: true, token, createdUser });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev login user
const userLogin = asyncHandler(async (req, res) => {
  // console.log("🚀userLogin");
  const { email, password } = req?.body;

  try {
    const emailExists = await User.findOne({ email: email })?.populate("saved");

    if (!emailExists) {
      throw new Error("No Account yet! Please Register.");
    }

    const user = await User.findOne({ email: email });
    const comparePassword = await bcrypt.compare(password, user?.password);

    if (!comparePassword) {
      throw new Error("Password Doesn't Match!");
    }

    const data = {
      id: user?._id,
    };

    //sign the cookie token
    const token = jwt.sign(data, process.env.APP_JWT_SECRET_KEY, {
      expiresIn: "12h",
    });

    user.password = undefined;
    const expiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000);

    res
      .status(200)
      .cookie("token", token, {
        expires: expiryDate,
        sameSite: "None",
        secure: true,
      })
      .json({
        success: true,
        token,
        user,
      });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev logic user details
const userDetails = asyncHandler(async (req, res) => {
  // console.log("🚀userDetails");
  const id = req?.user?._id;
  try {
    // console.log("namstea");
    const user = await User.findById(id).select("-password").populate("saved");
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev logic fetching all users
const fetchAllUsers = asyncHandler(async (req, res) => {
  // console.log("🚀fetch all users");
  try {
    const user = await User.find();
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev logic get all stripe subscriptions
const stripePrices = asyncHandler(async (req, res) => {
  // console.log("🚀stripe prices");
  try {
    const prices = await stripe.prices.list();
    const pricesdata = prices?.data;

    res.status(200).json({
      success: true,
      pricesdata,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev user password update
const userPasswordUpdate = asyncHandler(async (req, res) => {
  // console.log("🚀 userPasswordUpdate");
  const { password } = req?.body;
  const id = req?.user?._id;

  try {
    const user = await User.findById(id);
    const comparePassword = await bcrypt.compare(password, user?.password);
    if (comparePassword) {
      throw new Error("New Password is same as previous password");
    } else {
      const salt = await bcrypt.genSalt(10);
      const encryptedPassword = await bcrypt.hash(password, salt);
      user.password = encryptedPassword;
      await user.save();
      const updatedUser = await User.findById(id).select("-password");

      res.status(201).json({
        updatedUser,
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev password reset!
const userPasswordReset = asyncHandler(async (req, res) => {
  // console.log("🚀 userPasswordReset");
  const { email } = req?.body;
  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      throw new Error("User Doesn't Exist! Please Register.");
    }

    const resetPasswordToken = await user.createPasswordResetToken();
    user.passwordResetToken = resetPasswordToken;
    await user.save();

    //sending a token to the email

    const resetURL = `https://lazyshoppers.netlify.app/forgot-passsword-reset/${resetPasswordToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "lazyyshoppers@gmail.com",
        pass: "nzed oqhb nzhc lycy",
      },
    });

    const mailOptions = {
      from: "lazyyshoppers@gmail.com",
      to: email,
      subject: "Password Reset",
      html: `<div style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
          <h1 style="color: #333; text-align: center;">Shoppers - Password Reset</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              You are receiving this email because you (or someone else) have requested the reset of the password for your account.
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:
          </p>
          <a href="${resetURL}" style="display: inline-block; background-color: #007BFF; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px; margin-top: 10px;">Reset Password</a>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-top: 20px;">
              If you did not request this, please ignore this email and your password will remain unchanged.
          </p>
      </div>
  </div>
  `,
    };

    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json(`A reset email was sent to ${email}. the reset url: ${resetURL}`);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev reset password logic after mail has been clicked
const userPasswordResetAfterClick = asyncHandler(async (req, res) => {
  // console.log("🚀userPasswordResetAfterClick");
  const { password, token } = req?.body;

  try {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) throw new Error("User Does not Exist! Please Register!");

    if (user) {
      const salt = await bcrypt.genSalt(10);
      const encryptedPassword = await bcrypt.hash(password, salt);
      user.password = encryptedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      res.status(201).json(user);
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev verify email-account
const verifyAccount = asyncHandler(async (req, res) => {
  // console.log("🚀verifyAccount");
  const { email } = req?.body;
  const id = req?.user?._id;
  try {
    const user = await User.findById(id);
    if (!user) throw new Error("No user exists!");

    const verificationToken = await user.createAccountVerificationToken();

    await user.save();

    const verfiyURL = `https://lazyshoppers.netlify.app/forgot-passsword-reset/${verificationToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "lazyyshoppers@gmail.com",
        pass: "nzed oqhb nzhc lycy",
      },
    });

    const mailOptions = {
      from: "lazyyshoppers@gmail.com",
      to: email,
      subject: "Verify Account",
      html: `<div style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
          <h1 style="color: #333; text-align: center;">Shoppers - Verify Your Account</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              You are receiving this email because you (or someone else) have requested to verify your account.
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Please click on the following link, or paste this into your browser to complete the verification process within one hour of receiving it:
          </p>
          <a href="${verfiyURL}" style="display: inline-block; background-color: #007BFF; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px; margin-top: 10px;">Verify Account</a>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-top: 20px;">
              If you did not request this, please ignore this email and your account will remain unverified.
          </p>
      </div>
  </div>  
  `,
    };

    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json(`A reset email was sent to ${email}. the reset url: ${verfiyURL}`);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev verifying user account after clikcing the url in the email
const verifyAccountAfterClick = asyncHandler(async (req, res) => {
  // console.log("🚀verifyAccountAfterClick");
  const { token } = req?.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    accountVerificationToken: hashedToken,
    accountVerificationTokenExpires: { $gt: Date.now() },
  });

  try {
    if (!user) throw new Error("Token expired please try again!");

    user.isVerified = true;
    user.accountVerificationToken = undefined;
    user.accountVerificationTokenExpires = undefined;

    await user.save();

    res.status(201).json(user);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev update user field logic
const updateUserField = asyncHandler(async (req, res) => {
  // console.log("🚀updateUserField");
  const id = req?.user?._id;

  try {
    const user = await User.findByIdAndUpdate(id, { ...req?.body }).select(
      "-pasword"
    );

    if (!user) throw new Error("No user Found!");

    const updatedUser = await User.findById(id)
      .populate("saved")
      .select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev save a product
const saveProduct = asyncHandler(async (req, res) => {
  // console.log("🚀saveProduct");
  const { productId } = req?.body;
  const id = req?.user?._id;

  const targetUser = await User.findById(id);
  const savedLog = targetUser?.saved?.map((prod) => {
    return prod?._id;
  });

  const isSaved = targetUser?.saved?.includes(productId);

  try {
    if (isSaved) throw new Error("Already Saved this Product!");
    const user = await User.findByIdAndUpdate(
      id,
      {
        $push: { saved: productId },
      },
      { new: true }
    );

    const updatedUser = await User.findById(id).populate("saved");

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev unsave product
const unSaveProduct = asyncHandler(async (req, res) => {
  // console.log("🚀unSaveProduct");
  const { productId } = req?.body;
  const id = req?.user?._id;

  const targetUser = await User.findById(id);
  const savedLog = targetUser?.saved?.map((prod) => {
    return prod?._id;
  });

  const isSaved = targetUser?.saved?.includes(productId);

  try {
    if (isSaved) {
      const user = await User.findByIdAndUpdate(
        id,
        {
          $pull: { saved: productId },
        },
        { new: true }
      );

      const updatedUser = await User.findById(id).populate("saved");

      res.status(200).json(updatedUser);
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev create subscription window hosted by stripe
const createSubWindow = asyncHandler(async (req, res) => {
  // console.log("🚀createSubWindow");
  const id = req?.user?._id;

  try {
    const targetUser = await User.findById(id);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: req?.body?.priceId,
          quantity: 1,
        },
      ],
      customer: targetUser?.stripe_customer_id,
      success_url: process.env.APP_STRIPE_SUCCESS_URL,
      cancel_url: process.env.APP_STRIPE_CANCEL_URL,
    });

    res.status(200).json(session.url);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev stripe subscription status
const subStatusUpdate = asyncHandler(async (req, res) => {
  // console.log("🚀subStatusUpdate");
  const id = req?.user?._id;
  const targetUser = await User.findById(id);

  const customerId = await targetUser?.stripe_customer_id;

  try {
    const subStatus = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    const updateSubStatus = await User.findByIdAndUpdate(
      id,
      {
        subscriptions: subStatus.data,
        role: "subscriber",
      },
      { new: true }
    );

    const updatedUser = await User.findById(id).populate("saved");

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev customer subscriptions portal - manage subscriptions
const customerPortal = asyncHandler(async (req, res) => {
  // console.log("🚀customerPortal");
  const id = req?.user?._id;
  const targetUser = await User.findById(id);

  const customerId = await targetUser?.stripe_customer_id;

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.APP_STRIPE_HOME_URL,
    });

    res.status(200).json(portalSession.url);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev update user role after cancel
const updateSubAfterCancel = asyncHandler(async (req, res) => {
  // console.log("🚀updateSubAfterCancel");
  const id = req?.user?._id;
  const targetUser = await User.findById(id);

  const customerId = await targetUser?.stripe_customer_id;

  try {
    const subStatus = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    const updateSubStatus = await User.findByIdAndUpdate(
      id,
      {
        subscriptions: subStatus.data,
      },
      { new: true }
    );

    const hasCanceld = updateSubStatus.subscriptions[0].cancel_at_period_end;
    const periodEnd = updateSubStatus.subscriptions[0].current_period_end;

    function hasSubscriptionEnded(periodEnd) {
      const currentDate = new Date();
      const endDate = new Date(periodEnd * 1000);

      return currentDate > endDate;
    }

    if (hasCanceld && hasSubscriptionEnded(periodEnd)) {
      //revoke his priviledge
      const foundUser = await User.findByIdAndUpdate(id, {
        role: "freeuser",
      });
      res.status(200).json(foundUser);
    }
    if (hasCanceld && !hasSubscriptionEnded(periodEnd)) {
      const foundUser = await User.findByIdAndUpdate(
        id,
        {
          isSubCanceled: "ActiveTillEnd",
        },
        { new: true }
      );
      res.status(200).json(foundUser);
    } else {
      res.status(200).json(targetUser);
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev checking if user renews plan
const renewSub = asyncHandler(async (req, res) => {
  // console.log("🚀renewSub");
  const id = req?.user?._id;
  const targetUser = await User.findById(id);
  const customerId = await targetUser?.stripe_customer_id;

  try {
    const subStatus = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    const updateSubStatus = await User.findByIdAndUpdate(
      id,
      {
        subscriptions: subStatus.data,
        role: "subscriber",
      },
      { new: true }
    );

    if (
      updateSubStatus.subscriptions[0].cancel_at_period_end === false &&
      updateSubStatus.isSubCanceled === "ActiveTillEnd"
    ) {
      const subStatus = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        expand: ["data.default_payment_method"],
      });

      const updateSubStatus = await User.findByIdAndUpdate(
        id,
        {
          subscriptions: subStatus.data,
          role: "subscriber",
          isSubCanceled: "Active",
        },
        { new: true }
      );

      const updatedUser = await User.findById(id);

      res.status(200).json(updatedUser);
    } else {
      res.status(200).json(targetUser);
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = {
  registerUser,
  userLogin,
  userDetails,
  fetchAllUsers,
  stripePrices,
  userPasswordUpdate,
  userPasswordReset,
  userPasswordResetAfterClick,
  verifyAccount,
  verifyAccountAfterClick,
  updateUserField,
  saveProduct,
  unSaveProduct,
  createSubWindow,
  subStatusUpdate,
  customerPortal,
  updateSubAfterCancel,
  renewSub,
};
