const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const BCRYPT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(String(plain), BCRYPT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(String(plain), hash);
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function generateResetToken() {
  return String(crypto.randomInt(100000, 1000000));
}

module.exports = {
  hashPassword,
  verifyPassword,
  hashResetToken,
  generateResetToken,
};
