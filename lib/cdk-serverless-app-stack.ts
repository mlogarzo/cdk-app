import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as path from 'path';

export class CdkServerlessAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // dynamoDB table definition
    const greetingsTable = new dynamodb.Table(this, "Greetingstable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });

    // lambda function
    const saveHelloFunction = new lambda.Function(this, "SaveHelloFunction", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler.saveHello',
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')),
      environment: {
        GREETINGS_TABLE: greetingsTable.tableName,
      },
    });

    // lamba to return from dynamodb table
    // getHello method
    const getHelloFunction = new lambda.Function(this, "GetHelloFunction", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler.getHello',
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')),
      environment: {
        GREETINGS_TABLE: greetingsTable.tableName,
      },
    });

    // lambda permissions to dynamo table
    greetingsTable.grantReadWriteData(saveHelloFunction);
    greetingsTable.grantReadData(getHelloFunction);

    // create API gateway with one method and path using level 2 constructor
    const helloAPI = new apigw.RestApi(this, "helloApi");

    helloAPI.root
      .resourceForPath("hello")
      .addMethod('POST', new apigw.LambdaIntegration(saveHelloFunction));

    helloAPI.root
      .resourceForPath('hello')
      .addMethod('GET', new apigw.LambdaIntegration(getHelloFunction));

  }
}
