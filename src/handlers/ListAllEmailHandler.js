const { queryAllItems } = require('../services/dynamoDBServices')
const httpResponse = require('../utils/schemas/httpResponse')
module.exports.handler = async (event) => {
  try {
    const result = await queryAllItems(process.env.EMAIL_TABLE_NAME, 'MESSAGE')
    if (result) {
      return httpResponse.ok(result)
    } else {
      return httpResponse.badRequest({ message: 'No items found' })
    }
  } catch (error) {
    throw new Error(`ErrorgetAllItems`, error)
  }
}
