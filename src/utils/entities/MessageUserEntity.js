module.exports = class MessageUserEntity {
  constructor({ id, threadId, labelIds, subject, from, to, date, body }) {
    this.PK = 'MESSAGE'
    this.SK = `MESSAGE#GMAIL#${id}`
    this.id = id
    this.threadId = threadId
    this.labelIds = labelIds
    this.subject = subject ? subject : undefined
    this.from = from
    this.to = to
    this.date = date
    this.body = body ? body : undefined
  }
}
