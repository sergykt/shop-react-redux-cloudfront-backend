import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3deployment from "aws-cdk-lib/aws-s3-deployment";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import {
  DEFAULT_ERROR_RESPONSE_TEMPLATE,
  FRONTEND_URL,
  INTEGRATION_DEFAULT_CORS_HEADERS,
  METHOD_DEFAULT_CORS_HEADERS,
} from "../constants";

export class ImportServiceStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly apiGateway: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, "ImportServiceBucket", {
      versioned: true,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedOrigins: [FRONTEND_URL],
          allowedMethods: [s3.HttpMethods.PUT],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
          maxAge: 3000,
        },
      ],
    });

    // Create placeholder object for "uploaded" folder
    new s3deployment.BucketDeployment(this, "DeployUploadedFolder", {
      sources: [s3deployment.Source.data("uploaded/.keep", "")],
      destinationBucket: this.bucket,
    });

    // Create the API Gateway REST API
    this.apiGateway = new apigateway.RestApi(this, "ImportServiceApiGateway", {
      restApiName: "Import Service API",
      description: "API for the Import Service",
      defaultCorsPreflightOptions: {
        allowOrigins: [FRONTEND_URL],
        allowMethods: ["GET", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // Create /import resource
    const importProductsFileResource =
      this.apiGateway.root.addResource("import");

    // Create a Lambda function to handle GET requests for /import
    const importProductsFileLambda = new lambda.Function(
      this,
      "importProductsFile",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "index.importProductsFile",
        code: lambda.Code.fromAsset(
          path.join(
            __dirname,
            "../../resources/build/handlers/importProductsFile"
          )
        ),
        environment: {
          BUCKET_NAME: this.bucket.bucketName,
        },
      }
    );

    // Grant the Lambda permission to put objects into the import bucket
    this.bucket.grantPut(importProductsFileLambda);

    // Create a Lambda integration for the GET method on /import
    const importProductsFileIntegration = new apigateway.LambdaIntegration(
      importProductsFileLambda,
      {
        requestTemplates: {
          "application/json": `{ "fileName": "$input.params('fileName')" }`,
        },
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: INTEGRATION_DEFAULT_CORS_HEADERS,
          },
          {
            statusCode: "400",
            selectionPattern: ".*Missing required query parameter: fileName.*",
            responseParameters: INTEGRATION_DEFAULT_CORS_HEADERS,
            responseTemplates: DEFAULT_ERROR_RESPONSE_TEMPLATE,
          },
          {
            statusCode: "400",
            selectionPattern:
              ".*Invalid file type. Only .csv files are allowed.*",
            responseParameters: INTEGRATION_DEFAULT_CORS_HEADERS,
            responseTemplates: DEFAULT_ERROR_RESPONSE_TEMPLATE,
          },
          {
            statusCode: "500",
            selectionPattern: ".*Failed to import products file.*",
            responseParameters: INTEGRATION_DEFAULT_CORS_HEADERS,
            responseTemplates: DEFAULT_ERROR_RESPONSE_TEMPLATE,
          },
        ],
        proxy: false,
      }
    );

    // Add GET method to /import resource
    importProductsFileResource.addMethod("GET", importProductsFileIntegration, {
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
          statusCode: "500",
          responseParameters: METHOD_DEFAULT_CORS_HEADERS,
        },
      ],
    });

    // Create a Lambda function to handle S3 events for the import bucket
    const importFileParserLambda = new lambda.Function(
      this,
      "importFileParser",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "index.importFileParser",
        code: lambda.Code.fromAsset(
          path.join(
            __dirname,
            "../../resources/build/handlers/importFileParser"
          )
        ),
      }
    );

    // Grant the Lambda permission to read, copy and delete objects (needed for move: uploaded/ → parsed/)
    this.bucket.grantReadWrite(importFileParserLambda);

    // Trigger importFileParser when any object is created under uploaded/
    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: "uploaded/" }
    );

    new cdk.CfnOutput(this, "ImportServiceBucketName", {
      value: this.bucket.bucketName,
      description: "Name of the S3 bucket for the import service",
      exportName: "ImportServiceBucketName",
    });

    new cdk.CfnOutput(this, "ImportServiceApiGatewayUrl", {
      value: this.apiGateway.url,
      description: "URL of the API Gateway endpoint for the import service",
      exportName: "ImportServiceApiGatewayUrl",
    });
  }
}
