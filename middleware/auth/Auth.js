const User = require("../../model/User/User");
const jwt = require("jsonwebtoken");

const userAuth = async (req, res, next) => {
  const token =
    req?.cookies?.token ||
    req?.headers?.cookie?.slice(6) ||
    req?.header("token");
  try {
    if (!token) {
      return res.status(401).json({
        message: "No entry without Token! Please login",
      });
    }
    const user = jwt.verify(token, process.env.APP_JWT_SECRET_KEY);
    const userFound = await User.findById(user.id).select("-password");
    req.user = userFound;
    // console.log(userFound);
  } catch (error) {
    return res.status(401).json({ message: "Error At Authentication", error });
  }
  next();
};

module.exports = userAuth;
