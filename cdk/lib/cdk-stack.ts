import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { bedrock } from '@cdklabs/generative-ai-cdk-constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as lambda_python from '@aws-cdk/aws-lambda-python-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { readFileSync } from 'fs';

export class BedrockReferenceArchitectureCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const region = cdk.Stack.of(this).region;
    const githubUsername = process.env.GITHUB_USER;

    const tags = [
      { key: 'Product', value: 'Bedrock Reference Architecture'},
      { key: 'Solution', value: 'Example project'},
      { key: 'Customer', value: 'Flyttness.ai'},
      { key: 'Documentation', value: 'https://github.com/build-on-aws/bedrock-agents-streamlit/blob/main/README.md'},
    ]

    tags.forEach(tag => {
      cdk.Tags.of(this).add(tag.key, tag.value);
    });

    // Create the S3 bucket to store the knowledge base
    const bucket = new s3.Bucket(this, 'KnowledgeBaseBucket', {
      bucketName: `bedrock-knowledgebase-${githubUsername}-${region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,

      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true // This is for demo purposes, use a proper removal policy in production
    });
    tags.forEach(tag => {
      cdk.Tags.of(bucket).add(tag.key, tag.value);
    });

    // Populate the knowledge base S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployKnowledgeBase', {
      sources: [s3deploy.Source.asset('/workspaces/aws-bedrock-cdk-reference/bedrock/knowledge-base')],
      destinationBucket: bucket
    });

    // create the Bedrock knowledge base
    const kb = new bedrock.KnowledgeBase(this, 'KnowledgeBase', {
      embeddingsModel: bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V1,
      description: 'FOMC (Federal Open Market Committee) reports',
      instruction: 'Use this knowledge base when a user asks about data, such as economic trends, company financial statements, or the outcomes of the Federal Open Market Committee meetings.',
    });
    tags.forEach(tag => {
      cdk.Tags.of(kb).add(tag.key, tag.value);
    });

    const dataSource = new bedrock.S3DataSource(this, 'DataSource', {
      bucket: bucket,
      knowledgeBase: kb,
      dataSourceName: `kb-s3-bucket-${githubUsername}`,
      chunkingStrategy: bedrock.ChunkingStrategy.DEFAULT
    });

    // create the action group lambda function
    const actionGroupFunction = new lambda_python.PythonFunction(this, 'ActionGroupFunction', {
      entry: path.join(__dirname, '../lambda/action-group'),
      functionName: `PortfolioCreator-actions-${githubUsername}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      index: 'lambda.py',
      handler: 'lambda_handler'
    });
    tags.forEach(tag => {
      cdk.Tags.of(actionGroupFunction).add(tag.key, tag.value);
    });


    // create the agent
    const agentInstruction = readFileSync('../bedrock/prompts/agent.txt', 'utf-8');
    const orchestration = readFileSync('../bedrock/prompts/orchestration.txt', 'utf-8');

    const agent = new bedrock.Agent(this, 'Agent', {
      name: `PortfolioCreator-${githubUsername}`,
      description: 'Agent that creates investment portfolios, researches companies, summarizes documents, and formats emails.',
      foundationModel: bedrock.BedrockFoundationModel.ANTHROPIC_CLAUDE_INSTANT_V1_2,
      instruction: agentInstruction,
      knowledgeBases: [kb],
      shouldPrepareAgent: true,
      promptOverrideConfiguration: {
        promptConfigurations: [
          {
            promptType: bedrock.PromptType.ORCHESTRATION,
            basePromptTemplate: orchestration,
            promptState: bedrock.PromptState.ENABLED,
            promptCreationMode:  bedrock.PromptCreationMode.OVERRIDDEN,
            inferenceConfiguration: {
              temperature:  0.0,
              topP: 1,
              topK: 250,
              maximumLength: 2048,
              stopSequences: ['</function_call>','</invoke>', '</answer>', '</error>'],
            },
          },
        ]
      }
    });
    tags.forEach(tag => {
      cdk.Tags.of(agent).add(tag.key, tag.value);
    });
    
    // add an action group to the Bedrock Agent
    agent.addActionGroup({
      actionGroupName: `PortfolioCreator-actions-${githubUsername}`,
      description: 'Use these functions to get a portfolio.',
      actionGroupExecutor: actionGroupFunction,
      actionGroupState: "ENABLED",
      apiSchema: bedrock.ApiSchema.fromAsset(path.join(__dirname, '../lambda/action-group/openApiSpec.yaml')),
    });

    // Add Agent prod alias
    const alias = agent.addAlias({
      aliasName: 'prod',
      agentVersion: '1',
    });
    
    new cdk.CfnOutput(this, 'AgentId', {value: agent.agentId});
    new cdk.CfnOutput(this, 'AgentAliasId', {value: alias.aliasId});
    new cdk.CfnOutput(this, 'KnowledgeBaseId', {value: kb.knowledgeBaseId});
    new cdk.CfnOutput(this, 'DataSourceId', {value: dataSource.dataSourceId});
    new cdk.CfnOutput(this, 'DocumentBucket', {value: bucket.bucketName});
  }
}
