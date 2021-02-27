'use strict'

const env = process.env

const request_promise = require('request-promise')
const HmacSHA1 = require('crypto-js/hmac-sha1')
const Base64 = require('crypto-js/enc-base64')
const { access } = require('fs')


module.exports.getUrl = async (event) => {
//   const res = ""
  const client = new TwitterClient()
  const {oauth_token, oauth_token_secret} = await client.fetchRequestToken()

  const url = "https://api.twitter.com/oauth/authorize?oauth_token="+oauth_token
  return {
    statusCode: 200,
    body: JSON.stringify({url: url})
  }
}

module.exports.getAccessToken = async (event) => {

    const body = JSON.parse(event.body)
    const {oauth_token, oauth_token_secret, oauth_verifier} = body

    const client = new TwitterClient()

    const res = await client.fetchAccessToken(oauth_token, oauth_token_secret, oauth_verifier)
    console.log(res)

    return {
        statusCode: 200,
        body: JSON.stringify(body)
    }
}

const TwitterClient = function() {
    
    const timestamp = (new Date()).getTime()

    const oauth_callback = encodeURIComponent(env.TWITTER_CALLBACK_URL) // 環境変数注入あり
    const oauth_consumer_key = env.TWITTER_CONSUMER_KEY // 環境変数注入したほうがいいかも
    const oauth_nonce =  encodeURIComponent(Buffer.from(String(timestamp)).toString('base64'))
    // const oauth_nonce = "ihwSP0DU6TO"
    const oauth_signature_method = "HMAC-SHA1"
    const oauth_timestamp = String(Math.floor(timestamp / 1000))
    const oauth_version = "1.0"

    const request_method = "POST"
    const url = "https://api.twitter.com/oauth/request_token"
    const url_encoded = encodeURIComponent(url)

    const access_token_url = "https://api.twitter.com/oauth/access_token"
    const access_token_url_encoded = encodeURIComponent(access_token_url)
    const request_token_signature_key =  env.TWITTER_CONSUMER_SECRET + "&" // 環境変数注入かも

    const getRequestTokenSignature = function() {
        // TODO 完結に書きたい
        const parameter_string = `oauth_callback=${oauth_callback}&oauth_consumer_key=${oauth_consumer_key}&oauth_nonce=${oauth_nonce}&oauth_signature_method=${oauth_signature_method}&oauth_timestamp=${oauth_timestamp}&oauth_version=${oauth_version}`
        const signature_base = request_method + "&" + url_encoded + "&" + encodeURIComponent(parameter_string)
        const hash = HmacSHA1(signature_base, request_token_signature_key)
        const signature = Base64.stringify(hash)
        return encodeURIComponent(signature)
    }

    const getAccessTokenSignatureKey = (secret) => {
        return env.TWITTER_CONSUMER_SECRET + "&" + secret
    }

    const getAccessTokenSignature = function(oauth_token, oauth_secret, oauth_verifier) {
        const parameter_string = `oauth_consumer_key=${oauth_consumer_key}&oauth_nonce=${oauth_nonce}&oauth_signature_method=${oauth_signature_method}&oauth_timestamp=${oauth_timestamp}&` + 
                                `oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}&oauth_version=${oauth_version}`
        const signature_base = request_method + "&" + access_token_url_encoded + "&" + encodeURIComponent(parameter_string)
        const signature_key = getAccessTokenSignatureKey(oauth_secret)
        const hash = HmacSHA1(signature_base, signature_key)
        const signature = Base64.stringify(hash)
        return encodeURIComponent(signature)
    }

    this.fetchAccessToken = async function(oauth_token, oauth_token_secret, oauth_verifier) {
        const oauth_signature = getAccessTokenSignature(oauth_token, oauth_token_secret, oauth_verifier)
        const header_string = `oauth_consumer_key="${oauth_consumer_key}",oauth_nonce="${oauth_nonce}",oauth_signature_method="${oauth_signature_method}",oauth_timestamp="${oauth_timestamp}",` + 
                                `oauth_token="${oauth_token}",oauth_verifier="${oauth_verifier}",oauth_version="${oauth_version}",oauth_signature="${oauth_signature}"`
        const headers = {
            'Authorization': 'OAuth ' + header_string
        }
        const options = {
            method: "post",
            uri: access_token_url,
            headers: headers,
            form: {
                oauth_verifier: oauth_verifier
            },
        };
        const res = await request_promise(options)

        return res

        // const res_param_strings = res.split("&")
        // const oauth_token = res_param_strings[0].split("=")[1]
        // const oauth_token_secret = res_param_strings[1].split("=")[1]

        // console.log(oauth_token, oauth_token_secret)

        // return {oauth_token, oauth_token_secret}
        // console.log("signature", oauth_signature)
        // oauth_token=Ypqf7QAAAAABMljoAAABd-JWAk8&oauth_verifier=Db51orqcWNB9dA7MUUw8DeLGvm931qIi
    }

    this.fetchRequestToken = async function() {
        // "" でかこわないとだめかも
        const oauth_signature = getRequestTokenSignature()
        const header_string = `oauth_callback="${oauth_callback}",oauth_consumer_key="${oauth_consumer_key}",oauth_nonce="${oauth_nonce}",oauth_signature_method="${oauth_signature_method}",oauth_timestamp="${oauth_timestamp}",oauth_version="${oauth_version}",oauth_signature="${oauth_signature}"`
        const headers = {
            'Authorization': 'OAuth ' + header_string
        }
        const options = {
            method: "post",
            uri: url,
            headers: headers
        };

        console.log("signature", oauth_signature)
        
        //リクエスト送信

        const res = await request_promise(options)

        const res_param_strings = res.split("&")
        const oauth_token = res_param_strings[0].split("=")[1]
        const oauth_token_secret = res_param_strings[1].split("=")[1]

        console.log(oauth_token, oauth_token_secret)

        return {oauth_token, oauth_token_secret}
        /*
        await request.post(options, function (error, response, body) {
            console.log(body);
            console.log(typeof body)
        });
        */ 
    }
}
