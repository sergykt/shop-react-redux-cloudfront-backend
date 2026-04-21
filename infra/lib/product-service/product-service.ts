import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import {
  DEFAULT_ERROR_RESPONSE_TEMPLATE,
  INTEGRATION_DEFAULT_CORS_HEADERS,
  METHOD_DEFAULT_CORS_HEADERS,
} from "../constants";

export interface ProductServiceProps {
  apiGateway: apigateway.RestApi;
}

export class ProductService extends Construct {
  constructor(scope: Construct, id: string, props: ProductServiceProps) {
    super(scope, id);

    const { apiGateway } = props;

    // Create /products resource
    const productsResource = apiGateway.root.addResource("products");

    // Create a Lambda function to handle GET requests for /products
    const getProductsListLambda = new lambda.Function(this, "getProductsList", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "index.getProductsList",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../resources/build/handlers/getProductsList")
      ),
    });

    // Create a Lambda integration for the GET method on /products
    const getProductsListIntegration = new apigateway.LambdaIntegration(
      getProductsListLambda,
      {
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: INTEGRATION_DEFAULT_CORS_HEADERS,
          },
          {
            statusCode: "404",
            selectionPattern: ".*Failed to retrieve products list.*",
            responseParameters: INTEGRATION_DEFAULT_CORS_HEADERS,
            responseTemplates: DEFAULT_ERROR_RESPONSE_TEMPLATE,
          },
        ],
        proxy: false,
      }
    );

    // Add GET method to /products resource
    productsResource.addMethod("GET", getProductsListIntegration, {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: METHOD_DEFAULT_CORS_HEADERS,
        },
        {
          statusCode: "404",
          responseParameters: METHOD_DEFAULT_CORS_HEADERS,
        },
      ],
    });

    // Create /products/{productId} resource
    const productByIdResource = productsResource.addResource("{productId}");

    // Create a Lambda function to handle GET requests for /products/{id}
    const getProductsByIdLambda = new lambda.Function(this, "getProductsById", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "index.getProductsById",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../resources/build/handlers/getProductsById")
      ),
    });

    // Create a Lambda integration for the GET method on /products/{id}
    const getProductsByIdIntegration = new apigateway.LambdaIntegration(
      getProductsByIdLambda,
      {
        requestTemplates: {
          "application/json": `{
            "productId": "$input.params('productId')"
          }`,
        },
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: INTEGRATION_DEFAULT_CORS_HEADERS,
          },
          {
            statusCode: "400",
            selectionPattern: ".*Product ID is required.*",
            responseParameters: INTEGRATION_DEFAULT_CORS_HEADERS,
            responseTemplates: DEFAULT_ERROR_RESPONSE_TEMPLATE,
          },
          {
            statusCode: "404",
            selectionPattern: ".*Product with ID.*not found.*",
            responseParameters: INTEGRATION_DEFAULT_CORS_HEADERS,
            responseTemplates: DEFAULT_ERROR_RESPONSE_TEMPLATE,
          },
        ],
        proxy: false,
      }
    );

    // Add GET method to /products/{id} resource
    productByIdResource.addMethod("GET", getProductsByIdIntegration, {
      requestParameters: {
        "method.request.path.productId": true,
      },
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: METHOD_DEFAULT_CORS_HEADERS,
        },
        {
          statusCode: "400",
          responseParameters: METHOD_DEFAULT_CORS_HEADERS,
        },
        {
          statusCode: "404",
          responseParameters: METHOD_DEFAULT_CORS_HEADERS,
        },
      ],
    });
  }
}
