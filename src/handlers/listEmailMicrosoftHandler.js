const httpResponse = require('../utils/schemas/httpResponse')
const { listEmailsService } = require('../services/microsoftServices')

const handler = async (event) => {
  const { email } = JSON.parse(event.body)

  try {
    const messages = await listEmailsService(email)
    return httpResponse.ok(messages)
  } catch (error) {
    return httpResponse.serverError()
  }
}

module.exports = { handler }
