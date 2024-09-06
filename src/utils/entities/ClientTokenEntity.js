module.exports = class ClientTokenEntity {
  constructor({ emailUser, access_token, refresh_token, expiry_date }) {
    this.PK = 'TOKEN'
    this.SK = `GMAIL#${emailUser}`
    this.emailUser = emailUser
    this.access_token = access_token
    this.refresh_token = refresh_token
    this.expiry_date = expiry_date
    this.token_refresh = false
    this.created_at = this.updated_at = Date.now().toString()
  }
}
