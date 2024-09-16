const {
  S3Client,
  PutObjectCommand,
  EncodingType,
} = require('@aws-sdk/client-s3')
const client = new S3Client({ region: process.env.REGION })

const uploadAttachmentsS3Service = async (bucketName, attachment, emailId) => {
  const params = {
    Bucket: bucketName,
    Key: `${emailId}/${attachment.name}`, // Ruta del archivo en S3
    Body: Buffer.from(attachment.contentBytes, 'base64'),
    ContentType: attachment.contentType, // Tipo de contenido del adjunto
    ContentEncoding: 'base64',
  }
  const command = new PutObjectCommand(params)
  try {
    await client.send(command)
    const url = `https://${bucketName}.s3.amazonaws.com/${emailId}/${attachment.name}`
    return url
  } catch (error) {
    console.log('Error', error)
    throw new Error(`Error uploading file to S3: ${error.message}`)
  }
}

const uploadBodyEmailS3Service = async (bucketName, body, emailId) => {
  let fileExtension = 'txt'
  let s3ContentType = 'text/plain'

  // Condicionar si el cuerpo del mensaje es HTML o texto plano
  if (body.contentType === 'html') {
    fileExtension = 'html'
    s3ContentType = 'text/html'
  }

  const params = {
    Bucket: bucketName,
    Key: `${emailId}/message_body.${fileExtension}`, // Nombre del archivo en S3
    Body: Buffer.from(body.content, 'utf-8'), // Contenido del mensaje en utf-8
    ContentType: s3ContentType, // Tipo de contenido en S3
  }

  const command = new PutObjectCommand(params)

  try {
    await client.send(command)

    // Generar URL basada en la clave del archivo en S3
    const url = `https://${bucketName}.s3.amazonaws.com/${emailId}/message_body.${fileExtension}`

    return url
  } catch (error) {
    console.log('Error', error)
    throw new Error(`Error uploading file to S3: ${error.message}`)
  }
}

module.exports = {
  uploadAttachmentsS3Service,
  uploadBodyEmailS3Service,
}
