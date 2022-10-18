const { isTokenValid, attachCookiesToResponse } = require("../utils");
const Token = require("../models/Tokens");

const authenticateUser = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;
  console.log(req);
  try {
    if (accessToken) {
      const payload = isTokenValid(refreshToken);
      req.user = payload.user;
      return next();
    }
    const payload = isTokenValid(refreshToken);

    const existingToken = await Token.findOne({
      user: payload.user.userId,
      refreshToken: payload.refreshToken,
    });

    if (!existingToken || !existingToken.isValid) {
      return res.status(403).json({ msg: "Authentication Failed" });
    }

    attachCookiesToResponse({
      res,
      user: payload.user,
      refreshToken: existingToken.refreshToken,
    });
    (req.user = payload.user), next();
  } catch (error) {
    res.status(403).json({ msg: "Authentication Invalid" });
  }
};

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ msg: "Unauthorized to access this route" });
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizePermissions,
};
