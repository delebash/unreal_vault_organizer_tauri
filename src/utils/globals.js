export const ENDPOINTS = {

  authenticate: function (clientId) {
    return "https://www.epicgames.com/id/login?redirectUrl=" +
      encodeURIComponent(`https://www.epicgames.com/id/api/redirect?clientId=${clientId}&responseType=code`);
  },

  auth_token: "https://account-public-service-prod.ak.epicgames.com/account/api/oauth/token",

  refresh_token: "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token",

  fab_tags: function (accountId) {
    return "https://www.fab.com/i/tags"
  },

  vault: function (accountId) {
    return `https://www.fab.com/e/accounts/${accountId}/ue/library`;
  },

  detail: function (listingIdentifier) {
    return `https://www.fab.com/i/listings/${listingIdentifier}`;
  }
};


export const VARS = {
  client_id: "34a02cf8f4414e29b15921876da36f9a",
  client_cred: "daafbccc737745039dffe53d94fc76cf",
  client_cred_base64: "MzRhMDJjZjhmNDQxNGUyOWIxNTkyMTg3NmRhMzZmOWE6ZGFhZmJjY2M3Mzc3NDUwMzlkZmZlNTNkOTRmYzc2Y2Y=",
  client_ua: "UELauncher/17.0.2-37848679+++Portal+Release-Live Windows/10.0.22631.1.768.64bit",
  date_options: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }
}
