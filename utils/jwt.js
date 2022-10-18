const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return token;
};

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachCookiesToResponse = ({ res, user, refreshToken }) => {
  const accessTokenJWT = createJWT({ payload: { user } });
  const refreshTokenJWT = createJWT({ payload: { user, refreshToken } });

  const oneDay = 1000 * 60 * 60 * 24;
  const oneMonth = oneDay * 30;

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + oneDay),
  });

  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + oneMonth),
  });
};

const createTokenUser = (user) => {
  return { name: user.name, userId: user._id, role: user.role };
};

const hashString = (string) =>
  crypto.createHash("md5").update(string).digest("hex");

const checkPermissions = (reqUser, resUserId) => {
  if (reqUser.role === "admin") return;
  if (reqUser.userId === resUserId.toString()) return;
  res.status(403).json({ msg: "Not authorized to access this route" });
};

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
  createTokenUser,
  hashString,
  checkPermissions,
};
