require('dotenv').config()
const MGO = require('../mongo.js')

function splitIntoBatches(array, batchSize) {
  const batches = []
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize))
  }
  return batches
}

async function copyCollections() {
  const Source = {
    ATLAS: process.env.FROM_ATLAS === 'true',
    DB: process.env.FROM_DB,
    IP: process.env.FROM_IP,
    PORT: process.env.FROM_PORT,
    USER: process.env.FROM_USER,
    PASS: process.env.FROM_PASS,
    X509: process.env.FROM_X509 === 'true',
  }
  const Destination = {
    ATLAS: process.env.TO_ATLAS === 'true',
    DB: process.env.TO_DB,
    IP: process.env.TO_IP,
    PORT: process.env.TO_PORT,
    USER: process.env.TO_USER,
    PASS: process.env.TO_PASS,
    X509: process.env.TO_X509 === 'true',
  }
  const timeoutInMS = parseInt(process.env.CONNECTION_TIMEOUT_MS) || 10000
  const insertBatchSize = parseInt(process.env.INSERT_BATCH_SIZE) || 1000

  await MGO.start(
    Source.ATLAS,
    Source.DB,
    Source.IP,
    Source.PORT,
    Source.USER,
    Source.PASS,
    Source.X509,
    timeoutInMS,
  )
  await MGO.start(
    Destination.ATLAS,
    Destination.DB,
    Destination.IP,
    Destination.PORT,
    Destination.USER,
    Destination.PASS,
    Destination.X509,
    timeoutInMS,
  )

  const CollectionsToCopy = process.env.COLLECTIONS_TO_COPY.split(',').map(
    (c) => c.trim(),
  )

  try {
    for (const collectionName of CollectionsToCopy) {
      const fromCollection = await MGO.query(Source.DB, collectionName, {})
      const insertList = splitIntoBatches(fromCollection, insertBatchSize)
      for (const batch of insertList) {
        await MGO.insert(Destination.DB, collectionName, batch)
      }
      console.log(
        `Copied collection: ${collectionName} with ${fromCollection.length} documents`,
      )
    }
  } catch (error) {
    console.error('Error copying collections:', error)
  }
}

copyCollections()
