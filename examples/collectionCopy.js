require('dotenv').config({ path: __dirname + '/.env' })
const MGO = require('../mongo.js')

function splitIntoBatches(array, batchSize) {
  const batches = []
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize))
  }
  return batches
}

async function copyCollections() {
  // Validate required environment variables
  if (!process.env.COLLECTIONS_TO_COPY) {
    console.error('Error: COLLECTIONS_TO_COPY environment variable is required')
    process.exit(1)
  }

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

  console.log('Connecting to source database...')
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
  console.log('✓ Connected to source database')

  console.log('Connecting to destination database...')
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
  console.log('✓ Connected to destination database')

  const CollectionsToCopy = process.env.COLLECTIONS_TO_COPY.split(',').map(
    (c) => c.trim(),
  )

  console.log('Starting collection copy process...')
  console.log(`Collections to copy: ${CollectionsToCopy.join(', ')}`)

  let totalDocuments = 0

  try {
    for (const collectionName of CollectionsToCopy) {
      console.log(`\nCopying collection: ${collectionName}`)
      const fromCollection = await MGO.query(Source.DB, collectionName, {})
      console.log(`  Found ${fromCollection.length} documents`)
      
      if (fromCollection.length === 0) {
        console.log(`  Skipping empty collection`)
        continue
      }
      
      const insertList = splitIntoBatches(fromCollection, insertBatchSize)
      console.log(`  Inserting in ${insertList.length} batches...`)
      
      for (let i = 0; i < insertList.length; i++) {
        await MGO.insert(Destination.DB, collectionName, insertList[i])
        console.log(`  Batch ${i + 1}/${insertList.length} completed`)
      }
      
      totalDocuments += fromCollection.length
      console.log(
        `✓ Copied collection: ${collectionName} (${fromCollection.length} documents)`,
      )
    }
    console.log(`\n✓ All collections copied successfully! (Total: ${totalDocuments} documents)`)
    process.exit(0)
  } catch (error) {
    console.error('\n✗ Error copying collections:', error)
    process.exit(1)
  }
}

copyCollections()
