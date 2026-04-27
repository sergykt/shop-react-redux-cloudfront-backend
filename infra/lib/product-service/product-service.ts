import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
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
  public readonly productsTable: dynamodb.Table;
  public readonly stockTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: ProductServiceProps) {
    super(scope, id);

    const { apiGateway } = props;

    // Create DynamoDB Tables
    this.productsTable = new dynamodb.Table(this, "ProductsTable", {
      tableName: "products",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.stockTable = new dynamodb.Table(this, "StockTable", {
      tableName: "stock",
      partitionKey: {
        name: "product_id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development; change for production
    });

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
      environment: {
        PRODUCTS_TABLE_NAME: this.productsTable.tableName,
        STOCK_TABLE_NAME: this.stockTable.tableName,
      },
    });

    this.productsTable.grantReadData(getProductsListLambda);
    this.stockTable.grantReadData(getProductsListLambda);

    const createProductLambda = new lambda.Function(this, "createProduct", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "index.createProduct",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../resources/build/handlers/createProduct")
      ),
      environment: {
        PRODUCTS_TABLE_NAME: this.productsTable.tableName,
        STOCK_TABLE_NAME: this.stockTable.tableName,
      },
    });

    this.productsTable.grantWriteData(createProductLambda);
    this.stockTable.grantWriteData(createProductLambda);

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
            statusCode: "500",
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
          statusCode: "500",
          responseParameters: METHOD_DEFAULT_CORS_HEADERS,
        },
      ],
    });

    // Create a Lambda integration for the POST method on /products
    const createProductIntegration = new apigateway.LambdaIntegration(
      createProductLambda,
      {
        requestTemplates: {
          "application/json": "$input.json('$')",
        },
        integrationResponses: [
          {
            statusCode: "201",
            responseParameters: INTEGRATION_DEFAULT_CORS_HEADERS,
          },
          {
            statusCode: "400",
            selectionPattern: ".*Invalid product payload.*",
            responseParameters: INTEGRATION_DEFAULT_CORS_HEADERS,
            responseTemplates: DEFAULT_ERROR_RESPONSE_TEMPLATE,
          },
          {
            statusCode: "500",
            selectionPattern: ".*Failed to create product.*",
            responseParameters: INTEGRATION_DEFAULT_CORS_HEADERS,
            responseTemplates: DEFAULT_ERROR_RESPONSE_TEMPLATE,
          },
        ],
        proxy: false,
      }
    );

    // Add POST method to /products resource
    productsResource.addMethod("POST", createProductIntegration, {
      methodResponses: [
        {
          statusCode: "201",
          responseParameters: METHOD_DEFAULT_CORS_HEADERS,
        },
        {
          statusCode: "400",
          responseParameters: METHOD_DEFAULT_CORS_HEADERS,
        },
        {
          statusCode: "500",
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
      environment: {
        PRODUCTS_TABLE_NAME: this.productsTable.tableName,
        STOCK_TABLE_NAME: this.stockTable.tableName,
      },
    });

    // Grant Lambda read access to DynamoDB tables
    this.productsTable.grantReadData(getProductsByIdLambda);
    this.stockTable.grantReadData(getProductsByIdLambda);

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
          {
            statusCode: "500",
            selectionPattern: ".*Failed to retrieve product by ID.*",
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
        {
          statusCode: "500",
          responseParameters: METHOD_DEFAULT_CORS_HEADERS,
        },
      ],
    });
  }
}
