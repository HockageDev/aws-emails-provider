const { saveEmailsBatch } = require('../services/dynamoDBServices')

module.exports.handler = async (event) => {
  try {
    // Recorrer todos los mensajes recibidos de SQS
    for (const record of event.Records) {
      const messageBody = JSON.parse(record.body)

      const emails = messageBody.emails

      await saveEmailsBatch(emails, process.env.EMAIL_TABLE_NAME)
    }

    return {
      statusCode: 200,
      body: JSON.stringify('Emails processed successfully'),
    }
  } catch (error) {
    throw new Error('Error processing emails')
  }
}
