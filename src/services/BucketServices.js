const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const S3_BUCKTE_NAME = process.env.S3_BUCKTE_NAME
const client = new S3Client({ region: process.env.REGION })

const uploadFile = async (file, name) => {
  const params = {
    Bucket: S3_BUCKTE_NAME,
    Key: name,
    Body: file.data,
    contentEncoding: 'base64',
  }
  const command = new PutObjectCommand(params)
  try {
    await client.send(command)
  } catch (error) {
    throw new Error('Failed to upload file', error)
  }
}

module.exports = {
  uploadFile,
}
