const {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
  createTokenUser,
  hashString,
  checkPermissions,
} = require("./jwt");
const sendVerificationEmail = require("./sendVerificationEmail");
const sendResetPasswordEmail = require("./sendResetPasswordEmail");

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
  createTokenUser,
  hashString,
  checkPermissions,
  sendVerificationEmail,
  sendResetPasswordEmail,
};
