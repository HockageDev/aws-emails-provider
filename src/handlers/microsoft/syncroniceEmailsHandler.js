const handler = async (event) => {
  try {
    const records = event.Records

    for (const record of records) {
      let listIdMessages = JSON.parse(record.body)
      


    }
  } catch (error) {
    console.error('Error processing SQS messages:', error)
    throw new Error('Failed to process SQS messages.')
  }
}

module.exports = { handler }
