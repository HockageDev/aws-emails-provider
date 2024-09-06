const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb')
const { chunkArray } = require('../utils/chunkArray')

const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  BatchWriteItemCommand,
} = require('@aws-sdk/client-dynamodb')

const region = process.env.REGION

const client = new DynamoDBClient({
  region: region,
})

const putNewItem = async (tableName, itemBody) => {
  const params = {
    TableName: tableName,
    Item: marshall(itemBody, {
      convertClassInstanceToMap: true,
      removeUndefinedValues: true,
    }),
  }
  try {
    await client.send(new PutItemCommand(params))
  } catch (error) {
    console.log('ErrorPutnewItem', error)
    throw new Error('ErrorPutnewItem', error)
  }
}

const getItemPrimay = async (tableName, pk, sk) => {
  console.log('🚀 ~ getItemPrimay ~ tableName, pk, sk:', tableName, pk, sk)
  const params = {
    TableName: tableName,
    Key: marshall({
      PK: pk,
      SK: sk,
    }),
  }
  try {
    const data = await client.send(new GetItemCommand(params))
    console.log('🚀 ~ getItemPrimay ~ data:', data)
    console.log('🚀 ~ getItemPrimay ~  data:', data.Item)

    return data.Item ? unmarshall(data.Item) : null
  } catch (error) {
    console.log('ErrorGetItem', error)
    throw new Error('ErrorGetItem', error)
  }
}

const saveEmailsBatch = async (items, tableNameEmail) => {
  console.log('🚀 ~ saveEmailsBatch ~ items:', items)
  const batches = chunkArray(items, 25) // Dividir los correos en lotes de 25

  for (const batch of batches) {
    console.log('🚀 ~ saveEmailsBatch ~ batch:', batch)

    const requestItems = batch.map((item) => ({
      PutRequest: {
        Item: {
          PK: { S: `MESSAGE` },
          SK: { S: `MESSAGE#GMAIL#${item.threadId}` },
          // subject: { S: item.subject || '' },
          from: { S: item.from || '' },
          to: { S: item.to || '' },
          // date: { S: item.date || '' },
          // body: { S: item.body || '' },
          // labelIds: { SS: item.labelIds || [] },
        },
      },
    }))

    const params = {
      RequestItems: {
        [tableNameEmail]: requestItems,
      },
    }

    try {
      await client.send(new BatchWriteItemCommand(params))
    } catch (error) {
      console.error('Error saving batch to DynamoDB:', error)
      throw new Error('Error saving emails to DynamoDB')
    }
  }
}

const updateItem = async (
  tableName,
  pk,
  sk,
  updateExpression,
  expressionAttributeValues,
) => {
  const params = {
    TableName: tableName,
    Key: {
      PK: { S: pk },
      SK: { S: sk },
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: marshall(expressionAttributeValues),
    ReturnValues: 'ALL_NEW',
  }
  try {
    const response = await client.send(new UpdateItemCommand(params))
    return response.Attributes ? response.Attributes : null
  } catch (error) {
    throw new Error(`ErrorupdateItem`, error)
  }
}

module.exports = {
  putNewItem,
  getItemPrimay,
  updateItem,
  saveEmailsBatch,
}
