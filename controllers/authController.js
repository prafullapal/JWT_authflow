const Users = require("../models/Users");
const Token = require("../models/Tokens");
const {
  sendVerificationEmail,
  sendResetPasswordEmail,
  attachCookiesToResponse,
  createTokenUser,
  hashString,
} = require("../utils");
const crypto = require("crypto");

const register = async (req, res) => {
  const { email, name, password } = req.body;
  const emailAlreadyExists = await Users.findOne({ email });
  if (emailAlreadyExists) {
    return res.status(400).json({ msg: "Email already exists" });
  }

  const isFirstAccount = (await Users.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  const verificationToken = crypto.randomBytes(40).toString("hex");

  const user = await Users.create({
    name,
    email,
    password,
    role,
    verificationToken,
  });
  const origin = req.headers.host.toString();
  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    verificationToken: user.verificationToken,
    origin,
  });
  res
    .status(200)
    .json({ msg: "Success! Please check your email to verify account" });
};

const verifyEmail = async (req, res) => {
  const { token, email } = req.query;
  console.log(typeof token, email);
  const user = await Users.findOne({ email });

  if (!user) {
    console.log("here");
    return res.status(403).json({ msg: "Verification Failed" });
  }

  if (user.verificationToken !== token) {
    console.log(user);
    console.log(token);
    return res.status(403).json({ msg: "Verification Failed" });
  }

  user.isVerified = true;
  user.verified = Date.now();
  user.verificationToken = "";

  await user.save();
  res.status(200).json({ msg: "Email Verified" });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: "Please provide email and password" });
  }
  const user = await Users.findOne({ email });

  if (!user) {
    return res.status(403).json({ msg: "Invalid Credentials" });
  }
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return res.status(403).json({ msg: "Invalid Credentials" });
  }

  if (!user.isVerified) {
    return res.status(403).json({ msg: "Please Verify Email" });
  }
  const tokenUser = createTokenUser(user);

  let refreshToken = "";
  const existingToken = await Token.findOne({ user: user._id });

  if (existingToken) {
    const { isValid } = existingToken;
    if (!isValid) {
      return res.status(403).json({ msg: "Invalid Credentials" });
    }
    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(200).json({ user: tokenUser });
    return;
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  const userAgent = req.headers["user-agent"];
  const ip = req.ip;
  const userToken = { refreshToken, ip, userAgent, user: user._id };

  await Token.create(userToken);

  attachCookiesToResponse({ res, user: tokenUser, refreshToken });

  res.status(200).json({ user: tokenUser });
};

const logout = async (req, res) => {
  await Token.findOneAndDelete({ user: req.user.userId });

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(200).json({ msg: "Success! User Logged Out." });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: "Please provide valid email" });
  }
  const user = await Users.findOne({ email });

  if (user) {
    const passwordToken = crypto.randomBytes(70).toString("hex");

    const origin = req.headers.host.toString();
    await sendResetPasswordEmail({
      name: user.name,
      email: user.email,
      token: passwordToken,
      origin,
    });

    const tenMinutes = 1000 * 60 * 100;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    user.passwordToken = hashString(passwordToken);
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;
    await user.save();
  }

  res
    .status(200)
    .json({ msg: "Please check your email for reset password link" });
};
const resetPassword = async (req, res) => {
  const { token, email } = req.query;
  const { password } = req.body;
  if (!token || !email || !password) {
    return res.status(400).json({ msg: "Please provide all values" });
  }
  const user = await Users.findOne({ email });

  if (user) {
    if (user.passwordToken !== token) {
      return res.status(400).json({ msg: "Could not update Password" });
    }
    user.password = password;
    user.passwordToken = null;
    user.passwordTokenExpirationDate = null;
    await user.save();
  }

  res.status(200).json({ msg: "Success! Password has been reset." });
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
