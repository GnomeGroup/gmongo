const APP = require('gnodejs')
const MGO = require('gmongo')

const keys = {
  test: {
    columns: ['name', 'dob'],
    key: MGO.aes.format.key(
      '6233616364623234393935616165333332633466376134663031633833643262'
    ),
    iv: MGO.aes.format.iv('62323166666532663034393535346233')
  }
}

const start = async _ => {
  await MGO.start(
    true,
    'this',
    'serverip',
    null,
    'user',
    'password',
    null,
    20000
  )
  console.log(keys.test)
  /*
  console.log(MGO.aes.makeIv())
  console.log(MGO.aes.makeKey())

    await MGO.insert(
      'this',
      'test',
      [
        { name: 'James Encke', dob: '2021-01-01' },
        { name: 'Matthew Encke', dob: '2021-01-01' }
      ],
      keys.test.columns,
      keys.test.key,
      keys.test.iv
    )
    await MGO.query(
      'this',
      'test',
      {},
      keys.test.columns,
      keys.test.key,
      keys.test.iv
    )

    */
}

start()
