const httpResponse = require('../../utils/schemas/httpResponse')
const { syncroniceEmailsService } = require('../../services/microsoftServices')

const handler = async (event) => {
  const { email } = JSON.parse(event.body)

  try {
    const message = await syncroniceEmailsService(email)
    return httpResponse.ok(message)
  } catch (error) {
    return httpResponse.serverError()
  }
}

module.exports = { handler }
