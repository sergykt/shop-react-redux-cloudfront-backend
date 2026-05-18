import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";

const GITHUB_ACCOUNT_NAME = process.env.GITHUB_ACCOUNT_NAME;
const GITHUB_PASSWORD = process.env.GITHUB_PASSWORD;

export const basicAuthorizer = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  const { authorizationToken, methodArn } = event;

  // Validate the presence and format of the Authorization header, return 401 if it's missing or doesn't start with "Basic "
  if (!authorizationToken || !authorizationToken.startsWith("Basic ")) {
    throw new Error("Unauthorized");
  }

  // Extract and decode the credentials from the Authorization header
  const encoded = authorizationToken.split(" ")[1];
  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  const [username, password] = decoded.split(":");

  // Validate the credentials against the expected account name and password, returns 403 if they don't match
  if (username !== GITHUB_ACCOUNT_NAME || password !== GITHUB_PASSWORD) {
    return {
      principalId: "user",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: methodArn,
          },
        ],
      },
    };
  }

  return {
    principalId: username,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: methodArn,
        },
      ],
    },
  };
};
