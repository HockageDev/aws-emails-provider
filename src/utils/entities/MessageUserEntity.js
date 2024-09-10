module.exports = class MessageUserEntity {
  constructor({ id, threadId, labelIds, subject, from, to, date, body }) {
    this.PK = 'MESSAGE'
    this.SK = `MESSAGE#GMAIL#${id}`
    this.id = id
    this.threadId = threadId ? threadId : undefined
    this.labelIds = labelIds ? labelIds : undefined
    this.subject = subject ? subject : undefined
    this.from = from
    this.to = to ? to : undefined
    this.date = date
    this.body = body ? body : undefined
  }
}
