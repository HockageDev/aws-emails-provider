const { ConfidentialClientApplication } = require('@azure/msal-node')
const { Client } = require('@microsoft/microsoft-graph-client')
const { auth } = require('googleapis/build/src/apis/abusiveexperiencereport')

const config = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_AUTHORITY}`, // Interpolación correcta
    clientSecret: process.env.MICROSOFT_SECRET_ID_VALUE,
  },
}

const cca = new ConfidentialClientApplication(config)

const authParams = {
  scopes: ['user.read', 'mail.read'],
  redirectUri: process.env.MICROSOFT_REDIRECT_URL,
}

const authUrlEmailService = async () => {
  try {
    return await cca.getAuthCodeUrl(authParams)
  } catch (error) {
    console.log('ErrorAuthUrlEmailService', error)
  }
}

module.exports = {
  authUrlEmailService,
}
