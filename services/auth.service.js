const axios = require("axios");
const url = require("url");
const envVariables = require("../env-variables.json");
const keytar = require("keytar");
const os = require("os");
const crypto = require("crypto");

const { apiIdentifier, auth0Domain, clientId } = envVariables;

const redirectUri = "http://127.0.0.1:5321";

const keytarService = "noated-auth";
const keytarAccount = os.userInfo().username;

let accessToken = null;

function getAccessToken() {
  return accessToken;
}

function base64URLEncode(str) {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest();
}

var verifier = base64URLEncode(crypto.randomBytes(32));

var challenge = base64URLEncode(sha256(verifier));

function getAuthenticationURL() {
  return (
    "https://" +
    auth0Domain +
    "/authorize?" +
    "audience=" +
    apiIdentifier +
    "&" +
    "scope=openid offline_access&" +
    "response_type=code&" +
    "client_id=" +
    clientId +
    "&" +
    "code_challenge=" +
    challenge +
    "&" +
    "code_challenge_method=S256" +
    "&" +
    "redirect_uri=" +
    `${redirectUri}/logged-in`
  );
}

async function refreshTokens() {
  const refreshToken = await keytar.getPassword(keytarService, keytarAccount);

  if (refreshToken) {
    const refreshOptions = {
      method: "POST",
      url: `https://${auth0Domain}/oauth/token`,
      headers: { "content-type": "application/json" },
      data: {
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: refreshToken,
        code_verifier: verifier,
      },
    };

    try {
      const response = await axios(refreshOptions);
      accessToken = response.data.access_token;
      if (response.data && response.data.refresh_token) {
        console.log("adding new refresh token");
        await keytar.setPassword(
          keytarService,
          keytarAccount,
          response.data.refresh_token
        );
      }
    } catch (err) {
      if (err.code !== "ENOTFOUND") {
        throw err;
      }
    }
  } else {
    throw new Error("No available refresh token.");
  }
}

async function loadTokens(callbackURL) {
  const urlParts = url.parse(callbackURL, true);
  const query = urlParts.query;

  const exchangeOptions = {
    grant_type: "authorization_code",
    client_id: clientId,
    code_verifier: verifier,
    code: query.code,
    redirect_uri: redirectUri,
  };

  const options = {
    method: "POST",
    url: `https://${auth0Domain}/oauth/token`,
    headers: {
      "content-type": "application/json",
    },
    data: JSON.stringify(exchangeOptions),
  };

  try {
    const response = await axios(options);

    accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;

    if (refreshToken) {
      await keytar.setPassword(keytarService, keytarAccount, refreshToken);
    }
  } catch (error) {
    await logout();

    throw error;
  }
}

async function logout() {
  await keytar.deletePassword(keytarService, keytarAccount);
  accessToken = null;
  refreshToken = null;
}

function getLogOutUrl() {
  return `https://${auth0Domain}/v2/logout?client_id=${clientId}&&returnTo=${redirectUri}/logged-out`;
}

module.exports = {
  getAccessToken,
  getAuthenticationURL,
  getLogOutUrl,
  loadTokens,
  logout,
  refreshTokens,
};
