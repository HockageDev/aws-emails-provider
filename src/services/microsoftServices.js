const { ConfidentialClientApplication } = require('@azure/msal-node')
const { Client } = require('@microsoft/microsoft-graph-client')
const ClientTokenEntity = require('../utils/entities/ClientTokenEntity')
const { putNewItem, getItemPrimay } = require('./dynamoDBServices')
const { sendSqsService } = require('./sqsServices')

const TABLE_EMAIL = process.env.EMAIL_TABLE_NAME
const SQS_NAME = process.env.SQS_QUEUE_NAME
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID
const MICROSOFT_SECRET_ID_VALUE = process.env.MICROSOFT_SECRET_ID_VALUE
const MICROSOFT_REDIRECT_URL = process.env.MICROSOFT_REDIRECT_URL
const SCOPES = ['User.Read', 'Mail.Read', 'openid', 'profile', 'offline_access']

const cca = new ConfidentialClientApplication({
  auth: {
    clientId: MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/common`,
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

    const result = {
      emailUser: credentials.account.username,
      access_token: credentials.accessToken,
      refresh_token,
      expiry_date: credentials.expiresOn,
      token_cache: tokenCache,
    }
    const clientTokenEntity = new ClientTokenEntity(result)
    await putNewItem(TABLE_EMAIL, clientTokenEntity)
  } catch (error) {
    throw new Error('Failed to exchange authorization code for tokens.')
  }
}

const syncroniceEmailsService = async (emailUser) => {
  try {
    const credentialUser = await credentialsUserEmailAux(emailUser)
    if (credentialUser == null) {
      throw new Error('Failed to get credential user.')
    }
    let accessToken = await persistentTokenUserAux(credentialUser, emailUser)

    const client = await AuthenticatedClientMicrosoftAux(accessToken)

    const now = new Date()
    const pastTimeHours = new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    ).toISOString()

    const result = await client
      .api('/me/mailFolders/inbox/messages')
      .select('id')
      .filter(`receivedDateTime ge ${pastTimeHours}`)
      .orderby('receivedDateTime DESC')
      .get()

    const emailIds = result.value.map((email) => email.id)

    const payload = {
      emailUser: emailUser,
      emailIds: emailIds,
    }

    await sendSqsService(SQS_NAME, payload)
    return emailIds
  } catch (error) {
    console.error('Eroor', error)
    throw new Error('Failed to list emails.', error)
  }
}

const getEmailByIdService = async (emailUser, messageId) => {
  try {
    const credentialUser = await credentialsUserEmailAux(emailUser)
    if (credentialUser == null) {
      throw new Error('Failed to get credential user.')
    }
    let accessToken = await persistentTokenUserAux(credentialUser, emailUser)
    const client = await AuthenticatedClientMicrosoftAux(accessToken)
    const email = await client.api(`/me/messages/${messageId}`).get()
    return email
  } catch (error) {
    console.error('Error retrieving email by ID', error)
    throw new Error(`Failed to retrieve email by ID: ${messageId}`)
  }
}

const credentialsUserEmailAux = async (emailUser) => {
  try {
    const userEmail = await getItemPrimay(
      TABLE_EMAIL,
      'TOKEN',
      `MAIL#${emailUser}`,
    )
    return userEmail
  } catch (error) {
    throw new Error(`Error retrieving client token: ${error.message}`)
  }
}

const AuthenticatedClientMicrosoftAux = async (accessToken) => {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    },
  })
}

const persistentTokenUserAux = async (credential, emailUser) => {
  let { access_token, expiry_date, token_cache } = credential
  let now = new Date().getTime()
  if (token_cache) {
    await cca.getTokenCache().deserialize(token_cache)
  }

  if (now >= expiry_date) {
    const account = (await cca.getTokenCache().getAllAccounts()).find(
      (acc) => acc.username === emailUser,
    )
    const silentRequest = {
      account: account,
      scopes: SCOPES,
    }

    try {
      const tokenResponse = await cca.acquireTokenSilent(silentRequest)
      const tokenCache = cca.getTokenCache().serialize()
      const result = {
        emailUser: tokenResponse.account.username,
        access_token: tokenResponse.accessToken,
        expiry_date: tokenResponse.expiresOn,
        token_cache: tokenCache,
        token_refresh: true,
      }
      const clientTokenEntity = new ClientTokenEntity(result)
      await putNewItem(TABLE_EMAIL, clientTokenEntity)
      access_token = tokenResponse.accessToken
      return access_token
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error.message}`)
    }
  } else {
    return access_token
  }
}

module.exports = {
  authUrlEmailService,
  changeCodeByTokenService,
  syncroniceEmailsService,
  getEmailByIdService,
}
