const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

/*
 * This is the database (table) configuration.
 */
const db = {
  Table: process.env.APPLICATION_TABLE,
  Primary: {
    Key: 'pk',
    Range: 'sk',
  },
  // All keys below represent Entities
  Connection: {
    Prefix: 'CONNECTION|',
    Entity: 'CONNECTION',
    Primary: {
      Key: 'pk',
      Range: 'sk',
    },
    // Relationships?
    Channels: {
      Index: 'reverse',
      Key: 'sk',
      Range: 'pk',
    },
  },
  Channel: {
    Prefix: 'CHANNEL|',
    Entity: 'CHANNEL',
    Primary: {
      Key: 'pk',
      Range: 'sk',
    },
    // Relationships?
    Connections: {
      Key: 'pk',
      Range: 'sk',
    },
    Messages: {
      Key: 'pk',
      Range: 'sk',
    },
  },
  Message: {
    Prefix: 'MESSAGE|',
    Entity: 'MESSAGE',
    Primary: {
      Key: 'pk',
      Range: 'sk',
    },
  },
};

// These regexes are used by `parseEntityId` to extract the entity id
const channelRegex = new RegExp(`^${db.Channel.Entity}\|`);
const messageRegex = new RegExp(`^${db.Message.Entity}\|`);
const connectionRegex = new RegExp(`^${db.Connection.Entity}\|`);

/**
 * @description Extract entity id.
 * Examples:
 *      - target is `CHANNEL|General` --> returns `General`
 *      - target is `CONNECTION|TT61Ych7kowCE5A=` --> returns `TT61Ych7kowCE5A=`
 * @param target
 * @returns
 */
function parseEntityId(target) {
  console.log('[parseEntityId] Target before parse -->', target);

  if (typeof target === 'object') {
    // use from raw event, only needed for connectionId at the moment
    target = target.requestContext.connectionId;
  } else {
    // strip prefix if set so we always get raw id
    target = target
      .replace(channelRegex, '')
      .replace(messageRegex, '')
      .replace(connectionRegex, '');
  }

  console.log('[parseEntityId] Target after parse, before return -->', target);

  return target.replace('|', ''); // why?!
}

/**
 * @description Query the table using the local secondary index, in order to get the
 * subscriptions associated with the connection Id.
 * @param connection
 * @returns {Promise<*>}
 */
async function fetchConnectionSubscriptions(connection) {
  const connectionId = parseEntityId(connection);

  const results = await ddb
    .query({
      TableName: db.Table,
      IndexName: db.Connection.Channels.Index,
      KeyConditionExpression:
        `${db.Connection.Channels.Key} = :connectionId ` +
        `and begins_with(${db.Connection.Channels.Range}, :channelEntity)`,
      ExpressionAttributeValues: {
        ':connectionId': `${db.Connection.Prefix}${connectionId}`,
        ':channelEntity': db.Channel.Prefix,
      },
    })
    .promise();

  return results.Items;
}

/**
 * @description Query the table for the subscriptions associated with the channel id.
 * [WARNING] This is done across al connection Ids.
 * @param channel
 * @returns {Promise<*>}
 */
async function fetchChannelSubscriptions(channel) {
  const channelId = parseEntityId(channel);

  const results = await ddb
    .query({
      TableName: db.Table,
      KeyConditionExpression:
        `${db.Channel.Connections.Key} = :channelId ` +
        `and begins_with(${db.Channel.Connections.Range}, :connectionEntity)`,
      ExpressionAttributeValues: {
        ':channelId': `${db.Channel.Prefix}${channelId}`,
        ':connectionEntity': db.Connection.Prefix,
      },
    })
    .promise();

  return results.Items;
}

// Exported client
const client = {
  ...db,
  parseEntityId,
  fetchConnectionSubscriptions,
  fetchChannelSubscriptions,
  Client: ddb,
};

module.exports = client;
