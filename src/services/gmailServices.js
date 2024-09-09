const { google } = require('googleapis')
const OAuth2 = google.auth.OAuth2
const ClientTokenEntity = require('../utils/entities/ClientTokenEntity')
const {
  putNewItem,
  getItemPrimay,
  updateItem,
  saveEmailsBatch,
} = require('./dynamoDBServices')

const tableNameEmail = process.env.EMAIL_TABLE_NAME
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL || process.env.GOOGLE_REDIRECT_URL2,
)

const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

const authUrlEmailService = async () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  })
}

const changeCodeByToken = async (code) => {
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)
  const userInfo = await getUserInfoService(oauth2Client)
  const emailUser = userInfo.email
  const clientToken = new ClientTokenEntity({ ...tokens, emailUser })
  await putNewItem(tableNameEmail, clientToken)
}

const getUserInfoService = async (auth) => {
  const oauth2 = google.oauth2({ version: 'v2', auth })
  const res = await oauth2.userinfo.get()
  return res.data
}

const getTokenUser = async (emailUser) => {
  const userToken = await getItemPrimay(
    tableNameEmail,
    'TOKEN',
    `GMAIL#${emailUser}`,
  )
  return userToken
}

const getTokenRefreshUser = async (refreshToken) => {
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  return {
    access_token: credentials.access_token,
    expiry_date: credentials.expiry_date,
  }
}

const validateUserCredentials = async (emailUser) => {
  const userCredentials = await getTokenUser(emailUser)
  if (!userCredentials) {
    throw new Error('User no login')
  }
  return userCredentials
}

const updateUserCredentials = async (emailUser, access_token, expiry_date) => {
  let updated_at = Date.now().toString()
  const updateExpression =
    'SET access_token = :access_token, expiry_date = :expiry_date , updated_at = :updated_at, token_refresh = :token_refresh'

  const expressionAttributeValues = {
    ':access_token': access_token,
    ':expiry_date': expiry_date,
    ':updated_at': updated_at,
    ':token_refresh': true,
  }
  await updateItem(
    tableNameEmail,
    'TOKEN',
    `GMAIL#${emailUser}`,
    updateExpression,
    expressionAttributeValues,
  )
}

const verifyAndRefreshToken = async (userCredentials) => {
  let { access_token, refresh_token, expiry_date, token_refresh } =
    userCredentials
  const dateToday = new Date().getTime()
  if (token_refresh === true && dateToday > expiry_date) {
    throw new Error('User should login')
  }
  if (dateToday > expiry_date) {
    const newToken = await getTokenRefreshUser(refresh_token)
    access_token = newToken.access_token
    expiry_date = newToken.expiry_date

    await updateUserCredentials(
      userCredentials.emailUser,
      access_token,
      expiry_date,
    )
  }
  return access_token
}

const listEmailsWithFullContent = async (access_token) => {
  oauth2Client.setCredentials({ access_token })
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 10,
    })

    const messages = response.data.messages || []

    const emailsWithFullContent = await Promise.all(
      messages.map(async (message) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        })

        const headers = msg.data.payload.headers
        const subject =
          headers.find((header) => header.name === 'Subject')?.value ||
          '(No Subject)'
        const from =
          headers.find((header) => header.name === 'From')?.value ||
          '(No From Address)'
        const to =
          headers.find((header) => header.name === 'To')?.value ||
          '(No To Address)'
        const date =
          headers.find((header) => header.name === 'Date')?.value || '(No Date)'

        let body = ''
        if (msg.data.payload.parts) {
          msg.data.payload.parts.forEach((part) => {
            if (part.mimeType === 'text/plain') {
              body = Buffer.from(part.body.data, 'base64').toString('utf-8')
            }
          })
        } else {
          body = Buffer.from(msg.data.payload.body.data, 'base64').toString(
            'utf-8',
          )
        }

        return {
          id: message.id,
          threadId: message.threadId,
          labelIds: msg.data.labelIds,
          subject,
          from,
          to,
          date,
          body,
        }
      }),
    )

    return emailsWithFullContent
  } catch (error) {
    console.error('Error listing emails with full content:', error)
    throw new Error('Error listing emails with full content')
  }
}

const listEmailUser = async (emailUser) => {
  const userCredentials = await validateUserCredentials(emailUser)
  const access_token = await verifyAndRefreshToken(userCredentials)
  const emailsWithFullContent = await listEmailsWithFullContent(access_token)
  await saveEmailsBatch(emailsWithFullContent, tableNameEmail)
  return emailsWithFullContent
}

module.exports = {
  authUrlEmailService,
  changeCodeByToken,
  listEmailUser,
}
