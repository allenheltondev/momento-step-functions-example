import { AuthClient, CredentialProvider, ExpiresIn, GenerateDisposableToken } from '@gomomento/sdk';

let authClient;

export const getAuthToken = async (permissions) => {
  if (!authClient) {
    authClient = new AuthClient({
      credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY')
    });
  }

  const token = await authClient.generateDisposableToken({ permissions }, ExpiresIn.minutes(30));
  if (token instanceof GenerateDisposableToken.Success) {
    return token.authToken;
  }
};
