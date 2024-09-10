const httpResponse = require('../../utils/schemas/httpResponse')
const { authUrlEmailService } = require('../../services/microsoftServices')

const handler = async (event) => {
  try {
    const authUrl = await authUrlEmailService()
    return httpResponse.ok({ authUrl })
  } catch (error) {
    return httpResponse.serverError()
  }
}

module.exports = { handler }
