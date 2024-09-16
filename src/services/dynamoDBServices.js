const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb')
const { chunkArray } = require('../utils/chunkArray')
const MessageUserEntity = require('../utils/entities/MessageUserEntity')
const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  BatchWriteItemCommand,
  QueryCommand,
} = require('@aws-sdk/client-dynamodb')

const region = process.env.REGION

const client = new DynamoDBClient({
  region: region,
})

const createItemService = async (tableName, itemBody) => {
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
    console.log('🚀 ~ createItemService ~ error:', error)
    throw new Error('ErrorPutnewItem', error)
  }
}

const getPrimaryItemService = async (tableName, pk, sk) => {
  const params = {
    TableName: tableName,
    Key: marshall({
      PK: pk,
      SK: sk,
    }),
  }
  try {
    const data = await client.send(new GetItemCommand(params))
    return data.Item ? unmarshall(data.Item) : null
  } catch (error) {
    console.log('ERROR', error)
    throw new Error('ErrorGetItem', error)
  }
}

const addBatchEmailService = async (items, tableNameEmail) => {
  const batches = chunkArray(items, 25)

  for (const batch of batches) {
    const requestItems = batch.map((item) => {
      const emailEntity = new MessageUserEntity(item)

      return {
        PutRequest: {
          Item: marshall(emailEntity, {
            convertClassInstanceToMap: true,
            removeUndefinedValues: true,
          }),
          ConditionExpression: 'attribute_not_exists(SK)',
        },
      }
    })

    const params = {
      RequestItems: {
        [tableNameEmail]: requestItems,
      },
    }

    try {
      await client.send(new BatchWriteItemCommand(params))
    } catch (error) {
      throw new Error('Error saving emails to DynamoDB')
    }
  }
}

const updateItemService = async (
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

const getAllItemsService = async (tableName, pk) => {
  const params = {
    TableName: tableName,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': { S: pk },
    },
  }
  try {
    const response = await client.send(new QueryCommand(params))
    const unmarshallItems = response.Items
      ? response.Items.map((item) => unmarshall(item))
      : null

    return {
      Message: unmarshallItems,
      Count: unmarshallItems?.length || 0,
    }
  } catch (error) {
    throw new Error(`ErrorgetAllItems`, error)
  }
}

const queryAllItemsService = async (tableName, pk) => {
  const params = {
    TableName: tableName,
    KeyConditionExpression: 'PK = :pk',
    ProjectionExpression: 'subject, #fromAlias',
    ExpressionAttributeNames: {
      '#fromAlias': 'from', // Define el alias para 'from'
    },
    ExpressionAttributeValues: {
      ':pk': { S: pk },
    },
  }

  let items = []
  let lastEvaluatedKey = null

  try {
    do {
      // Si existe una clave de evaluación, la añadimos a los parámetros
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey
      }

      const response = await client.send(new QueryCommand(params))

      // Si hay ítems, unmarshall cada uno
      if (response.Items) {
        const unmarshalled = response.Items.map((item) => unmarshall(item))
        items = items.concat(unmarshalled)
      }

      // Establecer el `LastEvaluatedKey` para la paginación
      lastEvaluatedKey = response.LastEvaluatedKey
    } while (lastEvaluatedKey) // Continuar mientras haya más ítems

    return {
      items,
      count: items.length, // Número total de ítems devueltos
    }
  } catch (error) {
    throw new Error(`Error in queryAllItems: ${error.message}`)
  }
}

module.exports = {
  createItemService,
  getPrimaryItemService,
  updateItemService,
  addBatchEmailService,
  queryAllItemsService,
  getAllItemsService,
}
