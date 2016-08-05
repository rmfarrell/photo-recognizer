# Autocaptioner
Slackbot which uses the Clarifai image recognition api to automatically comment on photos as they are uploaded in a channel.

## Demo


## Setup
1. Create an `.env` file.
2. Configure a Slack integration. Instructions can be found by by following this path: `https://{slack directory}/apps/build`. Add your
3. Find the application token and copy it into your `.env` file as `SLACK_TOKEN={YOUR TOKEN HERE}`
4. [Create an app](https://developer.clarifai.com/account/applications/) in Clarifai.
5. Find the Client ID and Client Secret fields values and set your `CLARIFAI_ID` and `CLARIFAI_SECRET` values in `.env`
6. Run `npm install`
7. Run `npm start`

### Optional
1. In `.env` set the `EMOJI` var to the name of a different emoji
2. `APP_NAME` can also be customized.

## Content
Comment templates are located in `messages.js`. The app uses `string-template` to consume a list of tags (guesses about the contents of the image) Clarifai supplies to the image.
