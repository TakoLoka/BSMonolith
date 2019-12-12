const crypto = require("crypto");

const algorithm = "aes-256-ctr";
const secret = "bookstoreIsTheBest";

function encryptPassword(password) {
  const cipher = crypto.createCipher(algorithm, secret);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

function decrypt(encrypted) {
  const decipher = crypto.createDecipher(algorithm, secret);
  let dec = decipher.update(encrypted, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
};

module.exports = {encryptPassword, decrypt};
