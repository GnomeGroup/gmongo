const crypto = require('crypto')

const getBufferFromData = (bytes, data) => {
  const newData = Buffer.alloc(bytes)
  newData.write(data, 'utf-8')
  return newData.toString('hex')
}

module.exports = {
  encrypt: (key, iv, plainData) => {
    const encipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex')
    )
    return Buffer.from(
      encipher.update(plainData, 'utf8', 'binary') + encipher.final('binary'),
      'binary'
    ).toString('base64')
  },
  decrypt: (key, iv, encrypted) => {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex')
    )
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
      .toString('hex'),
  format: {
    iv: value => getBufferFromData(16, value),
    key: value => getBufferFromData(32, value)
  }
}
