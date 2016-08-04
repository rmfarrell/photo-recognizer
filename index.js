require('dotenv').config()
const SlackBot = require('slackbots')
const fs = require('fs')
const https = require('https')
const http = require('http')
const uuid = require('node-uuid')
const url = require('url')
const Buffer = require('buffer').Buffer
const queryString = require('querystring')
const Clarifai = require('clarifai')

var bot = new SlackBot({
  token: process.env.SLACK_TOKEN,
  name: 'Caption Bot'
})

bot.on('start', function () {
  bot.on('message', (data) => {

    /**
     * Return if message contains no files
     * TODO: also return if file type doesn't match image file
     */
    if (!data.file || !data.file.thumb_360) {
      return
    }

    /**
     * Initialize Clarifai
     */
    Clarifai.initialize({
      clientId: process.env.CLARIFAI_ID,
      clientSecret: process.env.CLARIFAI_SECRET
    })

    /**
     * Create a buffer forom the `thumb_360` property of the slack message.
     * Then, get a list of tags from Clarifai.
     */
    _createImageBufferFromSlack(data.file.thumb_360, process.env.SLACK_TOKEN)
      .then((buf) => {
        Clarifai.getTagsByImageBytes(buf.toString('base64'))
          .then((d) => {
            console.log(d)
          })
          .catch((err) => console.error(err))
      })
      .catch((err) => console.error(err))
  })
})

/**
 * read a thumbnail from slack and return a buffer
 * @param {String} thumb - URI of image from Slack
 * @param {String} accessToken - access token for slack app
 * @return {Promise<Buffer|Error>}
 */
function _createImageBufferFromSlack (thumb, accessToken) {
  let t = url.parse(thumb)
  let options = {
    host: t.hostname,
    path: t.path,
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  }
  let imgBufs = []
  return new Promise((resolve, reject) => {
    let req = https.request(options, (res) => {
      res.on('data', (d) => imgBufs.push(d))
      res.on('end', (d) => resolve(Buffer.concat(imgBufs)))
      res.on('error', (e) => reject(e))
    })
    req.end()
  })
}
