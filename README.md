# Credits

Original code from https://github.com/serverless/serverless-websockets-plugin/tree/master/example.

Also see https://github.com/aws-samples/simple-websockets-chat-app.

# General

# Architecture

- API Gateway websockets
- Lambda
- DynamoDB
- DynamoDB Streams (just to demo some durability)

# Chat Protocol

### Connect

`npm i -g wscat` - to install WebSocket cat

`wscat -c wss://{ApiId}.execute-api.{ApiRegion}.amazonaws.com/{ApiStage}`

### Messages

`{"action": "sendMessage", "name": "johndoe", "channelId": "General", "content": "hello world!"}`

### Channel Subscriptions

`{"action": "subscribeChannel", "channelId": "Secret"}`
`{"action": "unsubscribeChannel", "channelId": "Secret"}`

### Get channel history

(coming soon)