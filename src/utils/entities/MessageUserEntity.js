module.exports = class MessageUser {
  constructor({ emailUser, access_token, refresh_token }) {
    this.userEmail = emailUser
    this.access_token = access_token
    this.refresh_token = refresh_token
    this.expiry_date = expiry_date
  }
}
