const Users = require("../models/Users");
const {
  createTokenUser,
  attachCookiesToResponse,
  checkPermissions,
} = require("../utils");

const getAllUsers = async (req, res) => {
  console.log(req.user);
  const users = await Users.find({ role: "user" }).select("-password");
  res.status(200).json({ users });
};

const getSingleUser = async (req, res) => {
  const user = await Users.findOne({ _id: req.params.id }).select("-password");
  if (!user) {
    return res
      .status(404)
      .json({ msg: "No user found with username: ${req.user}" });
  }
  checkPermissions(req.user, user._id);
  res.status(200).json({ user });
};

const showCurrentUser = async (req, res) => {
  res.status(200).json({ user: req.user });
};

const updateUser = async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ msg: "Please provide all values" });
  }
  const user = await Users.findOne({ _id: req.user.userId });

  user.email = email;
  user.name = name;
  await user.save();

  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(200).json({ user: tokenUser });
};

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ msg: "Please provide both values" });
  }
  const user = await Users.findOne({ _id: req.user.userId });

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    return res.status(403).json({ msg: "Invalid Credentials" });
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({ msg: "Success! Password Updated." });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};
