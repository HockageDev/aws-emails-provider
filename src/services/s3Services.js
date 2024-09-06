import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
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
}
