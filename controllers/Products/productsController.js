const express = require("express");
const asyncHandler = require("express-async-handler");
const Product = require("../../model/Products/Products.js");
const mongoose = require("mongoose");

//@dev create product
const createProduct = asyncHandler(async (req, res) => {
  // console.log("🚀create product");
  const {
    title,
    description,
    description2,
    description3,
    descriptionHero,
    adcopyFb1,
    adcopyFb2,
    adcopy1,
    adcopy2,
    adcopy3,
    creative1,
    creative2,
    free,
    priceOfGoods,
    sellPrice,
    aliexpressLink,
    cjdropshippingLink,
    competitorShop,
    productAge,
    popullarity,
    competitivness,
    bestPlatform,
    category,
    keywords,
    image1,
    image2,
    image3,
    image4,
    image5,
    image6,
    image7,
    image8,
  } = req?.body;
  try {
    //logic is there a video
    const creativeGot = [];
    const imagesGot = [];

    req.images.map((creative) => {
      if (creative.endsWith(".mov") || creative.endsWith(".mp4")) {
        creativeGot.push(creative);
      }
    });

    req.images.map((image) => {
      if (
        image.endsWith(".jpg") ||
        image.endsWith(".png") ||
        image.endsWith(".jpeg")
      ) {
        imagesGot.push(image);
      }
    });
    //console.log(`imagesGot: ${imagesGot}`);
    const newProduct = await Product.create({
      ...req?.body,
      creative1: creativeGot[0],
      creative2: creativeGot[1],
      image1: imagesGot[0],
      image2: imagesGot[1],
      image3: imagesGot[2],
      image4: imagesGot[3],
      image5: imagesGot[4],
      image6: imagesGot[5],
      image7: imagesGot[6],
      image8: imagesGot[7],
      user: req?.user?._id,
    });

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev fetch all products
const fetchAllProducts = asyncHandler(async (req, res) => {
  // console.log("🚀fetch all products");
  try {
    const allProducts = await Product.find({})
      .populate("user")
      .sort({ createdAt: -1 });

    res.status(200).json(allProducts);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev fetch free products
const fetchFreeProd = asyncHandler(async (req, res) => {
  // console.log("🚀fetch free products");
  try {
    const fetchFreeProducts = await Product.find({ free: true })
      .populate("user")
      .sort({ createdAt: -1 });

    res.status(200).json(fetchFreeProducts);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev fetch paid products controller
const fetchPaidProd = asyncHandler(async (req, res) => {
  // console.log("🚀fetch paid products");
  try {
    const fetchPaidProducts = await Product.find({ free: false })
      .populate("user")
      .sort({ createdAt: -1 });

    res.status(200).json(fetchPaidProducts);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev fetch all tiktok products
const fetchTiktokProd = asyncHandler(async (req, res) => {
  // console.log("🚀fetch tiktok products");
  try {
    const tiktokProd = await Product.find({
      free: false,
      bestPlatform: "Tiktok",
    })
      .populate("user")
      .sort({ createdAt: -1 });
    res.status(200).json(tiktokProd);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev fetch all google products
const fetchGoogleProd = asyncHandler(async (req, res) => {
  // console.log("🚀fetch google products");
  try {
    const googleProd = await Product.find({
      free: false,
      bestPlatform: "Google",
    })
      .populate("user")
      .sort({ createdAt: -1 });
    res.status(200).json(googleProd);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev fetch all facebook products
const fetchFacebookProd = asyncHandler(async (req, res) => {
  // console.log("🚀fetch facebook products");
  try {
    const facebookProd = await Product.find({
      free: false,
      bestPlatform: "Facebook",
    })
      .populate("user")
      .sort({ createdAt: -1 });
    res.status(200).json(facebookProd);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev fetch single product
const fetchSingleProd = asyncHandler(async (req, res) => {
  // console.log("🚀fetch single product");
  const { id } = req?.params;
  try {
    const singleProd = await Product.findById(id).populate("user");
    res.status(200).json(singleProd);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev fetch single product free
const fetchSingleProdFree = asyncHandler(async (req, res) => {
  // console.log("🚀fetch single product free");
  const { id } = req?.params;
  try {
    const singleProdFree = await Product.find({ _id: id, free: true }).populate(
      "user"
    );
    res.status(200).json(singleProdFree);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev update product
const updateProduct = asyncHandler(async (req, res) => {
  // console.log("🚀update product");
  const { id } = req?.params;

  try {
    const user = req?.user;
    const updateProd = await Product.findByIdAndUpdate(
      id,
      {
        ...req.body,
        user: user?._id,
      },
      { new: true }
    );

    const updatedProd = await Product.findById(id).populate("user");

    res.status(201).json(updatedProd);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev delete a product single
const deleteProductSingle = asyncHandler(async (req, res) => {
  // console.log("🚀delete product single");
  const { id } = req?.params;

  try {
    const deleteProduct = await Product.findByIdAndDelete(id);

    res.status(200).json(deleteProduct);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//@dev delete all products
const deleteAllProducts = asyncHandler(async (req, res) => {
  // console.log("🚀delete all products");
  try {
    const deleteAll = await Product.deleteMany({});
    res.status(200).json(deleteAll);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = {
  createProduct,
  fetchAllProducts,
  fetchFreeProd,
  fetchPaidProd,
  fetchTiktokProd,
  fetchGoogleProd,
  fetchFacebookProd,
  fetchSingleProd,
  fetchSingleProdFree,
  updateProduct,
  deleteProductSingle,
  deleteAllProducts,
};
