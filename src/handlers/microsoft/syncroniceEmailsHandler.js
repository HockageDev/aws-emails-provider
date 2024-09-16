const {
  getEmailByIdService,
  getAttachmentsFromEmailService,
} = require('../../services/microsoftServices')
const MessageUserEntity = require('../../utils/entities/MessageUserEntity')
const { createItemService } = require('../../services/dynamoDBServices')

const EMAIL_TABLE_NAME = process.env.EMAIL_TABLE_NAME
const handler = async (event) => {
  try {
    const records = event.Records

    for (const record of records) {
      let { emailUser, emailIds } = JSON.parse(record.body)
      for (const emailId of emailIds) {
        const message = await getEmailByIdService(emailUser, emailId)
        // const attachmentUrls = []
        if (message.hasAttachments) {
          const attachmentsEmail = await getAttachmentsFromEmailService(
            emailUser,
            emailId,
          )

          console.log('��� ~ handler ~ attachmentsEmail:', attachmentsEmail)
        }
        console.log('🚀 ~ handler ~ message:', message)
        const messageUserEntity = new MessageUserEntity(message)
        await createItemService(EMAIL_TABLE_NAME, messageUserEntity)
      }
    }
  } catch (error) {
    console.error('Error processing SQS messages:', error)
    throw new Error('Failed to process SQS messages.')
  }
}

module.exports = { handler }
