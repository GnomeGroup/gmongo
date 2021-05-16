const crypto = require('crypto')

module.exports = {
  encrypt: (key, iv, plainData) => {
    const encipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    return Buffer.from(
      encipher.update(plainData, 'utf8', 'binary') + encipher.final('binary'),
      'binary'
    ).toString('base64')
  },
  decrypt: (key, iv, encrypted) => {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    return (
      decipher.update(
        Buffer.from(encrypted, 'base64').toString('binary'),
        'binary',
        'utf8'
      ) + decipher.final('utf8')
    )
  },
  makeIv: _ => crypto.randomBytes(16).toString('hex'),
  makeKey: _ =>
    crypto
      .createHash('sha256')
      .update(crypto.randomBytes(256))
      .digest()
      .toString('hex')
}
