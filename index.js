require('dotenv').config({silent: true})
const SlackBot = require('slackbots')
const fs = require('fs')
const https = require('https')
const http = require('http')
const uuid = require('node-uuid')
const url = require('url')
const Buffer = require('buffer').Buffer
const queryString = require('querystring')
const Clarifai = require('clarifai')
const compile = require('string-template/compile')
const bot = new SlackBot({
  token: process.env.SLACK_TOKEN,
  name: process.env.APP_NAME
})
const messages = require('./messages.js')

/**
 * Create a server. This is necessary for Heroku
 */
http.createServer((req, res) => {
  return res.end('hit')
}).listen(process.env.PORT || 5000)

/**
 * Listen for messages and if they have a thumb attached, comment on it
 */
bot.on('start', function () {
  bot.on('message', (data) => {
    let channel = data.channel
    let emoji = `:${process.env.EMOJI}:`

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
     * Then, get a list of tags from Clarifai and generate a message based on results
     */
    _createImageBufferFromSlack(data.file.thumb_360, process.env.SLACK_TOKEN)
      .then((buf) => {
        Clarifai.getTagsByImageBytes(buf.toString('base64'))
          .then((d) => {
            bot.postMessage(
              data.channel,
              _summarizeTags(d.results[0].result.tag.classes),
              {icon_emoji: emoji}
            )
          })
          .catch((err) => console.error(err))
      })
      .catch((err) => console.error(err))
  })
})

/**
 * write a clever message based on an array of tags.
 * @param {Array<String>} tags - an array of tags in descending order of relevance
 * @return {String}
 */
function _summarizeTags (tags) {
  let template = messages[Math.floor(Math.random() * messages.length)]
  let messageTemplate = compile(template)
  return messageTemplate(tags)
}

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
