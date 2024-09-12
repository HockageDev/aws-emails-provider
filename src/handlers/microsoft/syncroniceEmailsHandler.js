const { getEmailByIdService } = require('../../services/microsoftServices')

const handler = async (event) => {
  try {
    const records = event.Records

    for (const record of records) {
      let { emailUser, emailIds } = JSON.parse(record.body)

      for (const emailId of emailIds) {
        const email = await getEmailByIdService(emailUser, emailId)
        console.log('🚀 ~ handler ~ email :', email)
      }
    }
  } catch (error) {
    console.error('Error processing SQS messages:', error)
    throw new Error('Failed to process SQS messages.')
  }
}

module.exports = { handler }
