import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { faker } from '@faker-js/faker';

const ddb = new DynamoDBClient();

export const loadUser = async (ipAddress) => {
  const response = await ddb.send(new GetItemCommand({
    TableName: process.env.TABLE_NAME,
    Key: marshall({ pk: ipAddress, sk: 'user' })
  }));

  if (!response.Item) {
    const newUser = {
      pk: ipAddress,
      sk: 'user',
      username: generateRandomName(),
      exp: 0,
      level: 1,
      lastUpdateTime: Date.now()
    };

    await ddb.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: marshall(newUser)
    }));

    return { id: ipAddress, username: newUser.username, level: newUser.level };
  } else {
    const user = unmarshall(response.Item);
    return {
      id: user.pk,
      username: user.username,
      level: user.level
    };
  }
};

const generateRandomName = () => {
  const prefixes = [
    faker.color.human(),
    faker.commerce.productAdjective(),
    faker.food.adjective()
  ];

  const suffixes = [
    faker.animal.type(),
    faker.commerce.product(),
    faker.food.fruit()
  ];

  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  const username = `${randomPrefix.charAt(0).toUpperCase() + randomPrefix.slice(1)}${randomSuffix.charAt(0).toUpperCase() + randomSuffix.slice(1)}`;
  return username.replace(/ /g, '');
};
