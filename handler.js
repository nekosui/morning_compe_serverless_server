'use strict';

module.exports.hello = async (event) => {
  console.log("hoge")
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};


module.exports.getUrl = async (event) => {


  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "hoge"
    })
  }
}


const oauth = require('oauth');

const env = process.env

const TWITTER_CONSUMER_KEY = env.TWITTER_CONSUMER_KEY
const TWITTER_CONSUMER_SECRET = env.TWITTER_CONSUMER_SECRET

function getOAuth() {
  return new oauth.OAuth(
    "https://twitter.com/oauth/request_token", 
    "https://twitter.com/oauth/access_token", 
    TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET,
    "1.0A",
    "http://badgestar.com/sessions/callback",
    "HMAC-SHA1"
  );   
}