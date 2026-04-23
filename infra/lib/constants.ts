export const FRONTEND_URL = "https://d67pyit89tiwq.cloudfront.net";
export const FRONTEND_URL_LITERAL = `'${FRONTEND_URL}'`;

export const INTEGRATION_DEFAULT_CORS_HEADERS = {
  "method.response.header.Access-Control-Allow-Origin": FRONTEND_URL_LITERAL,
  "method.response.header.Access-Control-Allow-Headers":
    "'Content-Type,Authorization'",
  "method.response.header.Access-Control-Allow-Methods": "'GET,POST,OPTIONS'",
} as const;

export const METHOD_DEFAULT_CORS_HEADERS = {
  "method.response.header.Access-Control-Allow-Origin": true,
  "method.response.header.Access-Control-Allow-Headers": true,
  "method.response.header.Access-Control-Allow-Methods": true,
} as const;

export const DEFAULT_ERROR_RESPONSE_TEMPLATE = {
  "application/json": `{"message": "$input.path('$.errorMessage')"}`,
} as const;
