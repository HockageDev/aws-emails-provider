const {
  SQSClient,
  SendMessageCommand,
  GetQueueUrlCommand,
} = require('@aws-sdk/client-sqs')

const region = process.env.REGION
const Client = new SQSClient({ region })

const sendSqsService = async (nameQueue, data) => {
  try {
    const queueUrl = await getQueueUrlAux(nameQueue)
    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(data),
    }
    await Client.send(new SendMessageCommand(params))
  } catch (error) {
    throw new Error('Failed to send message to SQS', error)
  }
}

const getQueueUrlAux = async (nameQueue) => {
  const params = {
    QueueName: nameQueue,
  }

  try {
    const command = new GetQueueUrlCommand(params)
    const response = await Client.send(command)
    return response.QueueUrl
  } catch (error) {
    throw new Error('Failed to get queue URL', error)
  }
}

module.exports = {
  sendSqsService,
}
