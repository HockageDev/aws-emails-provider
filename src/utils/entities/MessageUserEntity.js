module.exports = class MessageUserEntity {
  constructor({
    id,
    threadId,
    labelIds,
    subject,
    from,
    body,
    createdDateTime,
    lastModifiedDateTime,
    changeKey,
    categories,
    receivedDateTime,
    sentDateTime,
    hasAttachments,
    internetMessageId,
    parentFolderId,
    conversationId,
    conversationIndex,
    isDeliveryReceiptRequested,
    isReadReceiptRequested,
    isRead,
    isDraft,
    webLink,
    inferenceClassification,
    replyTo,
    flag,
    toRecipients,
    ccRecipients,
    bccRecipients,
    attachmentUrls,
  }) {
    this.PK = 'MESSAGE'
    this.SK = `MESSAGE#MAIL#${id}`
    this.id = id
    this.threadId = threadId || undefined
    this.labelIds = labelIds || undefined
    this.subject = subject || undefined
    this.from = from
    this.body = body || undefined
    this.attachments =
      attachmentUrls && attachmentUrls.length > 0 ? attachmentUrls : undefined

    // Nuevos campos añadidos
    this.createdDateTime = createdDateTime || undefined
    this.lastModifiedDateTime = lastModifiedDateTime || undefined
    this.changeKey = changeKey || undefined
    this.categories = categories || undefined
    this.receivedDateTime = receivedDateTime || undefined
    this.sentDateTime = sentDateTime || undefined
    this.hasAttachments = hasAttachments || false
    this.internetMessageId = internetMessageId || undefined
    this.parentFolderId = parentFolderId || undefined
    this.conversationId = conversationId || undefined
    this.conversationIndex = conversationIndex || undefined
    this.isDeliveryReceiptRequested = isDeliveryReceiptRequested || null
    this.isReadReceiptRequested = isReadReceiptRequested || false
    this.isRead = isRead || false
    this.isDraft = isDraft || false
    this.webLink = webLink || undefined
    this.inferenceClassification = inferenceClassification || 'other'
    this.toRecipients = toRecipients || undefined
    this.ccRecipients = ccRecipients || undefined
    this.bccRecipients = bccRecipients || undefined
    this.replyTo = replyTo || undefined
    this.flag = flag || { flagStatus: 'notFlagged' }
  }
}
