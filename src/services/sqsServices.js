const {
  SQSClient,
  SendMessageCommand,
  GetQueueUrlCommand,
} = require('@aws-sdk/client-sqs')

const region = process.env.REGION
const MAX_MESSAGE_SIZE = 256 * 1024 // 256 KB
const MIN_BATCH_SIZE = 1 // Tamaño mínimo del lote
let BATCH_SIZE = 10 // Tamaño inicial del lote (ajustable)
const Client = new SQSClient({ region })

// Función para enviar el mensaje a SQS
const sendSqs = async (nameQueue, emails) => {
  const queueUrl = await getQueueUrl(nameQueue)

  // Dividir los correos en lotes más pequeños
  const emailBatches = splitIntoBatches(emails)

  for (const batch of emailBatches) {
    await sendBatchToSQS(queueUrl, batch)
  }
}

// Función para dividir los correos en lotes más pequeños
const splitIntoBatches = (emails) => {
  const batches = []
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    batches.push(emails.slice(i, i + BATCH_SIZE))
  }
  return batches
}

// Función para enviar un lote a SQS y manejar si el lote es demasiado grande
const sendBatchToSQS = async (queueUrl, batch) => {
  let messageBody = JSON.stringify({ emails: batch })

  // Verificar el tamaño del mensaje antes de enviarlo
  if (Buffer.byteLength(messageBody, 'utf8') > MAX_MESSAGE_SIZE) {
    // Reducir el tamaño del lote y reintentar
    if (BATCH_SIZE > MIN_BATCH_SIZE) {
      BATCH_SIZE = Math.max(MIN_BATCH_SIZE, Math.floor(BATCH_SIZE / 2))
      const smallerBatches = splitIntoBatches(batch)
      for (const smallBatch of smallerBatches) {
        await sendBatchToSQS(queueUrl, smallBatch)
      }
      return
    } else {
      return
    }
  }

  const params = {
    QueueUrl: queueUrl,
    MessageBody: messageBody,
  }

  try {
    const command = new SendMessageCommand(params)
    await Client.send(command)
  } catch (error) {
    throw new Error('Failed to send message to SQS', error)
  }
}

// Función para obtener la URL de la cola
const getQueueUrl = async (nameQueue) => {
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
  sendSqs,
}
