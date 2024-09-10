const httpResponse = require('../utils/schemas/httpResponse')
const { changeCodeByToken } = require('../services/gmailServices')

const handler = async (event) => {
  const code = event.queryStringParameters.code
  try {
    const token = await changeCodeByToken(code)
    return httpResponse.ok({
      message: 'Token processed and saved successfully',
    })
  } catch (error) {
    return httpResponse.serverError()
  }
}

module.exports = { handler }
