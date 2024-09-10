const httpResponse = require('../utils/schemas/httpResponse')
const { changeCodeByTokenService } = require('../services/microsoftServices')

const handler = async (event) => {
  const code = event.queryStringParameters.code
  try {
    await changeCodeByTokenService(code)
    return httpResponse.ok({
      message: 'Token processed and saved successfully',
    })
  } catch (error) {
    return httpResponse.serverError()
  }
}

module.exports = { handler }
