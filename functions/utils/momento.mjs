import { AuthClient, CredentialProvider, ExpiresIn, GenerateDisposableToken } from '@gomomento/sdk';
import { getSecret } from '@aws-lambda-powertools/parameters/secrets';

let authClient;

export const getAuthToken = async (permissions) => {
  if (!authClient) {
    const secrets = await getSecret(process.env.SECRET_ID, { transform: 'json' });
    authClient = new AuthClient({
      credentialProvider: CredentialProvider.fromString(secrets.momento)
    });
  }

  const token = await authClient.generateDisposableToken({ permissions }, ExpiresIn.minutes(30));
  if (token instanceof GenerateDisposableToken.Success) {
    return token.authToken;
  }
};
