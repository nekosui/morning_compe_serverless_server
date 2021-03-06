'use strict'

const env = process.env

const request_promise = require('request-promise')
const HmacSHA1 = require('crypto-js/hmac-sha1')
const Base64 = require('crypto-js/enc-base64')
const { access } = require('fs')

const OAuth1Client = function({
    // oauth_callback, 
    oauth_consumer_key, 
    oauth_consumer_secret,
    // oauth_signature,
    // oauth_token,
    oauth_token_secret,
    // oauth_verifier
    // access_token_url,
}) {
    const timestamp = (new Date()).getTime()
    const oauth_nonce =  encodeURIComponent(Buffer.from(String(timestamp)).toString('base64'))
    // const access_token_url = "https://api.twitter.com/oauth/access_token"
    // const access_token_url_encoded = encodeURIComponent(access_token_url)

    const header = {
        oauth_timestamp: String(Math.floor(timestamp / 1000)),
        // oauth_callback: oauth_callback, 
        oauth_consumer_key: oauth_consumer_key, 
        oauth_nonce: oauth_nonce,
        // oauth_signature: oauth_signature,
        oauth_signature_method:  "HMAC-SHA1",
        // oauth_token,
        // oauth_token_secret,
        // oauth_verifier,
        oauth_version: "1.0"
    }

    // this.oauth_token_secret = oauth_token_secret

    // this.oauth_token_secret = oauth_token_secret

    const getSignatureKey = function() {
        return oauth_consumer_secret + "&" + oauth_token_secret 
    }

    const getSignature = function(method, additional_header, uri) {

        const header_combined = {...header, ...additional_header}
        const keys = Object.keys(header_combined).sort()
        const values = keys.map(key => `${key}=${header_combined[key]}`)
        const access_token_url_encoded = encodeURIComponent(uri)
        const parameter_string = values.join("&")

        const signature_base = method + "&" + access_token_url_encoded + "&" + encodeURIComponent(parameter_string)
        const signature_key = getSignatureKey()
        const hash = HmacSHA1(signature_base, signature_key)
        const signature = Base64.stringify(hash)
        return encodeURIComponent(signature)
    }

    const getHeader = function(method, additional_header, uri) {
        const signature = getSignature(method, additional_header, uri)
        const header_combined = {...header, ...additional_header, oauth_signature: signature}
        const keys = Object.keys(header_combined).sort()
        const values = keys.map(key => `${key}=${header_combined[key]}`)

        const header_string = values.join(",")

        return {
            'Authorization': 'OAuth ' + header_string
        }
    }

    this.request = async function(method, additional_header, uri, form={}) {
        const headers = getHeader(method, additional_header, uri)

        const options = {
            method: method,
            uri: uri,
            headers: headers,
            form: form
        };
        return await request_promise(options)
    }
}


module.exports.TwitterClient = function(oauth_token_secret="") {

    const oauth_consumer_key = env.TWITTER_CONSUMER_KEY // 環境変数注入したほうがいいかも
    const oauth_consumer_secret = env.TWITTER_CONSUMER_SECRET

    const client = new OAuth1Client({
        oauth_consumer_key: oauth_consumer_key, 
        oauth_consumer_secret: oauth_consumer_secret,
        oauth_token_secret: oauth_token_secret,
    })

    this.fetchRequestToken = async function() {
        const url = "https://api.twitter.com/oauth/request_token"
        const res = await client.request("POST", {}, url)

        const res_param_strings = res.split("&")
        const oauth_token = res_param_strings[0].split("=")[1]
        const oauth_token_secret = res_param_strings[1].split("=")[1]

        return {oauth_token, oauth_token_secret}
    }


    this.fetchAccessToken = async function(oauth_token, oauth_token_secret, oauth_verifier) {


        const url = "https://api.twitter.com/oauth/access_token"
        const res = await client.request("POST", {oauth_token: oauth_token, oauth_verifier: oauth_verifier}, url, {oauth_verifier: oauth_verifier})

        return res
    }

        // this.fetchUserInfo = async function(oauth_token, oauth_verifier) {
        //     return 
        // }

}


// module.exports = TwitterClient