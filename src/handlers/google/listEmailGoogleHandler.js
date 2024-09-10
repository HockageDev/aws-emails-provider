const httpResponse = require('../../utils/schemas/httpResponse')
const { listEmailUser } = require('../../services/gmailServices')

const handler = async (event) => {
  const { email } = JSON.parse(event.body)

  try {
    const messages = await listEmailUser(email)
    return httpResponse.ok(messages)
  } catch (error) {

    return httpResponse.serverError()
  }
}

module.exports = { handler }
