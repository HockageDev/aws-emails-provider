const { google } = require('googleapis')
const OAuth2 = google.auth.OAuth2
const ClientTokenEntity = require('../utils/entities/ClientTokenEntity')
const {
  putNewItem,
  getItemPrimay,
  updateItem,
} = require('../services/s3Services')

const tableNameEmail = process.env.EMAIL_TABLE_NAME
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL,
)

const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

const authUrlEmailService = async () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
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

const listEmails = async (access_token) => {
  oauth2Client.setCredentials({ access_token })
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 10,
    })
    return response.data.messages || []
  } catch (error) {
    console.error('Error listing emails:', error)
    throw new Error('Error listing emails')
  }
}

const listEmailUser = async (emailUser) => {
  const userCredentials = await validateUserCredentials(emailUser)
  const access_token = await verifyAndRefreshToken(userCredentials)
  return await listEmails(access_token)
}

// const listEmailUser1 = async (emailUser) => {
//   const userCredentials = await getTokenUser(emailUser)
//   if (!userCredentials) {
//     throw new Error('User no login')
//   }
//   let { access_token, refresh_token, expiry_date, token_refresh } =
//     userCredentials

//   const dateToday = new Date().getTime()
//   if (token_refresh === true && dateToday > expiry_date) {
//     throw new Error('User should login')
//   }
//   if (dateToday > expiry_date) {
//     const newToken = await getTokenRefreshUser(refresh_token)
//     access_token = newToken.access_token
//     expiry_date = newToken.expiry_date

//     let updated_at = Date.now().toString()

//     const updateExpression =
//       'SET access_token = :access_token, expiry_date = :expiry_date , updated_at = :updated_at, token_refresh = :token_refresh'

//     const expressionAttributeValues = {
//       ':access_token': access_token,
//       ':expiry_date': expiry_date,
//       ':updated_at': updated_at,
//       ':token_refresh': true,
//     }

//     await updateItem(
//       tableNameEmail,
//       'TOKEN',
//       `GMAIL#${emailUser}`,
//       updateExpression,
//       expressionAttributeValues,
//     )
//   }

//   oauth2Client.setCredentials({ access_token })
//   const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

//   try {
//     const response = await gmail.users.messages.list({
//       userId: 'me',
//       labelIds: ['INBOX'],
//       maxResults: 10,
//     })

//     return response.data.messages || []
//   } catch (error) {
//     console.error('Error listing emails:', error)
//     throw new Error('Error listing emails')
//   }
// }

module.exports = {
  authUrlEmailService,
  changeCodeByToken,
  getUserInfoService,
  getTokenUser,
  listEmailUser,
}
