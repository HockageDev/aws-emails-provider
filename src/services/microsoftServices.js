const { ConfidentialClientApplication } = require('@azure/msal-node')
const { Client } = require('@microsoft/microsoft-graph-client')
const ClientTokenEntity = require('../utils/entities/ClientTokenEntity')
const {
  putNewItem,
  getItemPrimay,
  saveEmailsBatch,
} = require('./dynamoDBServices')

const tableNameEmail = process.env.EMAIL_TABLE_NAME
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID
const MICROSOFT_SECRET_ID_VALUE = process.env.MICROSOFT_SECRET_ID_VALUE
const MICROSOFT_REDIRECT_URL = process.env.MICROSOFT_REDIRECT_URL
const SCOPES = ['User.Read', 'Mail.Read', 'openid', 'profile', 'offline_access']

const cca = new ConfidentialClientApplication({
  auth: {
    clientId: MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_AUTHORITY}`,
    clientSecret: MICROSOFT_SECRET_ID_VALUE,
  },
})

const authUrlEmailService = async () => {
  try {
    const authUrl = await cca.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: MICROSOFT_REDIRECT_URL,
    })
    return authUrl
  } catch (error) {
    throw new Error(`Error generating authentication URL: ${error.message}`)
  }
}

const changeCodeByTokenService = async (authCode) => {
  const codeRequest = {
    code: authCode,
    scopes: SCOPES,
    redirectUri: MICROSOFT_REDIRECT_URL,
  }
  try {
    const credentials = await cca.acquireTokenByCode(codeRequest)
    const tokenCache = cca.getTokenCache().serialize()
    const refreshTokenObject = JSON.parse(tokenCache).RefreshToken
    const refresh_token =
      refreshTokenObject[Object.keys(refreshTokenObject)[0]].secret

    const result = {
      emailUser: credentials.account.username,
      access_token: credentials.accessToken,
      refresh_token,
      expiry_date: credentials.expiresOn,
    }
    const clientTokenEntity = new ClientTokenEntity(result)
    await putNewItem(tableNameEmail, clientTokenEntity)
  } catch (error) {
    throw new Error('Failed to exchange authorization code for tokens.')
  }
}

const getClientTokenByEmail = async (emailUser) => {
  const userEmail = await getItemPrimay(
    tableNameEmail,
    'TOKEN',
    `MAIL#${emailUser}`,
  )
  return userEmail
}

const refreshAccessTokenService = async (emailUser) => {
  const clientToken = await getClientTokenByEmail(emailUser)
  const { refresh_token } = clientToken

  const newCredentials = await cca.acquireTokenByRefreshToken({
    refreshToken: refresh_token,
    scopes: SCOPES,
  })

  const result = {
    emailUser: newCredentials.account.username,
    access_token: newCredentials.accessToken,
    refresh_token,
    expiry_date: newCredentials.expiresOn,
  }
  const clientTokenEntity = new ClientTokenEntity(result)
  await putNewItem(tableNameEmail, clientTokenEntity)
}

const getAuthenticatedClient = (accessToken) => {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    },
  })
}

// const validateUserCredentials = async (emailUser) => {
//   const userCredentials = await getClientTokenByEmail(emailUser)
//   if (!userCredentials) {
//     throw new Error('User no login')
//   }
//   return userCredentials
// }

// const verifyAndRefreshToken = async (userCredentials) => {
//   let { access_token, refresh_token, expiry_date, token_refresh } =
//     userCredentials

//   const now = new Date().getTime()
//   const tokenExpiryTime = new Date(expiry_date).getTime()

//   if (now >= tokenExpiryTime) {
//     console.log('Token expired, refreshing...')

//     try {
//       const newCredentials = await cca.acquireTokenByRefreshToken({
//         refreshToken: refresh_token,
//         scopes: SCOPES,
//       })
//       console.log('newCredentials', newCredentials)

//       const updatedCredentials = {
//         emailUser: newCredentials.account.username,
//         access_token: newCredentials.accessToken,
//         refresh_token,
//         expiry_date: newCredentials.expiresOn,
//       }
//       const clientTokenEntity = new ClientTokenEntity(updatedCredentials)
//       await putNewItem(tableNameEmail, clientTokenEntity)

//       return newCredentials.accessToken
//     } catch (error) {
//       console.log('failed refresh', error)
//       throw new Error(`Failed to refresh token: ${error.message}`)
//     }
//   } else {
//     return access_token
//   }
// }

const listEmailsService = async (emailUser) => {
  try {
    const clientToken = await getClientTokenByEmail(emailUser)
    const accessToken = clientToken.access_token
    console.log('🚀 ~ listEmailsService ~ accessToken :', accessToken)
    const client = getAuthenticatedClient(accessToken)
    const result = await client
      .api('/me/messages')
      .top(10)
      .select('id,subject,from,body,isRead,receivedDateTime')
      .orderby('receivedDateTime DESC')
      .get()

    const emails = result.value.map((email) => ({
      id: email.id,
      threadId: email.id,
      subject: email.subject,
      from: email.from.emailAddress.address,
      date: email.receivedDateTime,
      body: email.body.content,
    }))

    await saveEmailsBatch(emails, tableNameEmail)
    return emails
  } catch (error) {
    console.log('��� ~ listEmailsService ~ error:', error)
    throw new Error('Failed to list emails.', error)
  }
}
module.exports = {
  authUrlEmailService,
  changeCodeByTokenService,
  refreshAccessTokenService,
  listEmailsService,
}
