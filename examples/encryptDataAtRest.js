const MGO = require('../mongo.js')

const keys = {
  test: {
    columns: ['name', 'dob'],
    key: MGO.aes.format.key(
      '6233616364623234393935616165333332633466376134663031633833643262'
    ),
    iv: MGO.aes.format.iv('62323166666532663034393535346233'),
  },
}

const start = async (_) => {
  console.log('test connect')
  const DBName = 'Account'
  const DBHost = 'test.mongodb.net'
  const DBPort = null
  const DBUser = null
  const DBPass = null
  const DBx509 = ''
  await MGO.start(true, DBName, DBHost, DBPort, DBUser, DBPass, DBx509, 20000)
  console.log('connected')
  console.log(keys.test)
  if (false) {
    console.log('insert test')
    const data = {
      added: new Date(),
      incrementer: 2,
      test: 'TEST String',
    }
    console.log(
      await MGO.insert(
        DBName,
        'TestTable',
        data,
        ['test'],
        keys.test.key,
        keys.test.iv
      )
    )
    console.log(data)
  }
  if (false) {
    console.log('delete test')
    console.log(
      await MGO.delete(DBName, 'TestTable', {
        _id: MGO.id('655003e5d765319d61037ceb'),
      })
    )
  }
  if (false) {
    console.log('update test')
    console.log(
      await MGO.update(
        DBName,
        'TestTable',
        {
          _id: MGO.id('655003c9506eaf7ed924e885'),
        },
        { test: 'My favourite data' },
        ['test'],
        keys.test.key,
        keys.test.iv
      )
    )
  }
  if (false) {
    console.log('query test')
    console.log(
      await MGO.query(
        DBName,
        'TestTable',
        {},
        ['test'],
        keys.test.key,
        keys.test.iv
      )
    )
  }
  if (false) {
    console.log('single query test')
    console.log(
      await MGO.singleQuery(
        DBName,
        'TestTable',
        {
          _id: MGO.id('65500e6decab789298f5a32e'),
        },
        ['test'],
        keys.test.key,
        keys.test.iv
      )
    )
  }
  if (false) {
    console.log('query sort test')
    console.log(
      await MGO.querySort(
        DBName,
        'TestTable',
        { added: 1 },
        {},
        ['test'],
        keys.test.key,
        keys.test.iv
      )
    )
  }
  if (false) {
    console.log('query limit sort test')
    console.log(
      await MGO.queryLimitSort(
        DBName,
        'TestTable',
        1,
        { added: -1 },
        {},
        ['test'],
        keys.test.key,
        keys.test.iv
      )
    )
  }
  if (false) {
    console.log('join test')
    console.log(
      await MGO.join(
        DBName,
        'TestTable',
        'incrementer',
        'TestTable1',
        'incrementer',
        'innerObject',
        { added: 1 },
        {},
        ['test'],
        keys.test.key,
        keys.test.iv
      )
    )
  }

  console.log(MGO.aes.makeIv())
  console.log(MGO.aes.makeKey())
  process.exit()
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
