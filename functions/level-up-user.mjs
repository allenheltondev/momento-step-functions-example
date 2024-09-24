import { marshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
const ddb = new DynamoDBClient();

export const handler = async (state) => {
  try {
    const newExp = Number(state.user.exp) + Number(state.exp);

    let currentLevel = Number(state.user.level);
    let nextLevelThreshold = 2 ** (currentLevel + 1);
    let didUserLevelUp = false;

    // Check if the user leveled up one or more levels. Each level is a power of 2
    while (newExp >= nextLevelThreshold) {
      currentLevel++;
      nextLevelThreshold = 2 ** (currentLevel + 1);
      didUserLevelUp = true;
    }

    // Update the user level and exp in the database. This will cause an async update to the cache from DDB Streams to an EventBridge pipe
    await ddb.send(
      new UpdateItemCommand({
        TableName: process.env.TABLE_NAME,
        Key: marshall({ pk: state.user.id, sk: 'user' }),
        UpdateExpression: 'SET #exp = :exp, #level = :level',
        ExpressionAttributeNames: {
          '#exp': 'exp',
          '#level': 'level',
        },
        ExpressionAttributeValues: marshall({
          ':exp': newExp,
          ':level': currentLevel,
        }),
      }),
    );

    return {
      didUserLevelUp,
      level: currentLevel,
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
};
