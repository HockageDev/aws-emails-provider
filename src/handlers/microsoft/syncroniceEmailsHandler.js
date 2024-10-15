const { getEmailByIdService, getAttachmentsFromEmailService } = require('@/')
const MessageUserEntity = require('../../utils/entities/MessageUserEntity')
const { createItemService } = require('../../services/dynamoDBServices')
const {
  uploadBodyEmailS3Service,
  uploadAttachmentsS3Service,
} = require('../../services/BucketServices')

const EMAIL_TABLE_NAME = process.env.EMAIL_TABLE_NAME
const S3_BUCKTET_NAME = process.env.S3_BUCKET_NAME
const handler = async (event) => {
  try {
    const records = event.Records

    for (const record of records) {
      let { emailUser, emailIds } = JSON.parse(record.body)
      for (const emailId of emailIds) {
        const message = await getEmailByIdService(emailUser, emailId)
        const attachmentUrls = []
        const bodyAttachments = []

        if (message.body && message.body.content) {
          const s3AttachmentBody = await uploadBodyEmailS3Service(
            S3_BUCKTET_NAME,
            message.body,
            emailId,
          )
          bodyAttachments.push(s3AttachmentBody)
          message.body.content = bodyAttachments
        }
        if (message.hasAttachments) {
          const attachmentsEmail = await getAttachmentsFromEmailService(
            emailUser,
            emailId,
          )

          for (const attachment of attachmentsEmail) {
            const s3AttachmentUrl = await uploadAttachmentsS3Service(
              S3_BUCKTET_NAME,
              attachment,
              emailId,
            )
            attachmentUrls.push(s3AttachmentUrl)
          }
        }

        const messageUserEntity = new MessageUserEntity({
          ...message,
          attachmentUrls,
        })

        console.log('messageUserEntity', messageUserEntity)
        await createItemService(EMAIL_TABLE_NAME, messageUserEntity)
      }
    }
  } catch (error) {
    console.error('Error processing SQS messages:', error)
    throw new Error('Failed to process SQS messages.')
  }
}

module.exports = { handler }
