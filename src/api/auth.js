import {ENDPOINTS, VARS} from "src/utils/globals.js";
import {utils} from "src/utils/utils.js";
import {settings} from "src/api/setting.js";

export const auth = {

  getAuthUrl() {
    return ENDPOINTS.authenticate(VARS.client_id)
  },

  async isAuthDataValid() {
    let userSettings = await settings.getUserSettings()
    if (userSettings?.auth) {
      let authData = userSettings.auth
      if (authData.access_token && new Date() < new Date(authData.expires_at)) {
        return true;
      } else {
        utils.showErrorMessage('Access token expired.  On your settings tab please request a new authorization code to get a new access token.')
        console.log('Auth expired.');
        return false;
      }
    } else {
      utils.showErrorMessage('Access token invalid.  On your settings tab please request a new authorization code to get a new access token.')
      console.log('Auth invalid.');
      return false;
    }
  },

  async authorize(authorizationCode) {
    return await utils.httpRequest(ENDPOINTS.auth_token, {
      method: 'post',
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        token_type: 'eg1'
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${VARS.client_cred_base64}`,
        'User-Agent': VARS.client_ua
      }
    })
  }
}
