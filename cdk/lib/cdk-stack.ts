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
      instruction: 'Use this knowledge base to answer questions about Federal Open Market Committee reports. ',
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
      index: 'lambda.py'
    });
    tags.forEach(tag => {
      cdk.Tags.of(actionGroupFunction).add(tag.key, tag.value);
    });


    // create the agent
    const agentInstruction =
    `Role: You are an investment analyst responsible for creating portfolios, researching companies, summarizing documents, and formatting emails.
Objective: Assist in investment analysis by generating company portfolios, providing research summaries, and facilitating communication through formatted emails.
1. Portfolio Creation:
  Understand the Query: Analyze the user's request to extract key information such as the desired number of companies and industry.
  Generate Portfolio: Based on the criteria from the request, create a portfolio of companies. Use the template provided to format the portfolio.
2. Company Research and Document Summarization:
  Research Companies: For each company in the portfolio, conduct detailed research to gather relevant financial and operational data.
  Summarize Documents: When a document, like the FOMC report, is mentioned, retrieve the document and provide a concise summary.
3. Email Communication:
  Format Email: Using the email template provided, format an email that includes the newly created company portfolio and any summaries of important documents.
  Send Email: Utilize the provided tools to send an email upon request, That includes a summary of provided responses and and portfolios created.`

    const orchestration = readFileSync('../bedrock/prompts/orchestration.txt', 'utf-8');

    const agent = new bedrock.Agent(this, 'Agent', {
      name: `PortfolioCreator-${githubUsername}`,
      description: 'Agent that creates investment portfolios, researches companies, summarizes documents, and formats emails.',
      foundationModel: bedrock.BedrockFoundationModel.ANTHROPIC_CLAUDE_INSTANT_V1_2,
      instruction: agentInstruction,
      knowledgeBases: [kb]
      // promptOverrideConfiguration: {
      //   promptConfigurations: [
      //     {
      //       promptType: bedrock.PromptType.ORCHESTRATION,
      //       basePromptTemplate: orchestration,
      //       promptState: bedrock.PromptState.ENABLED,
      //       promptCreationMode:  bedrock.PromptCreationMode.OVERRIDDEN,
      //       inferenceConfiguration: {
      //         temperature:  0.0,
      //         topP: 1,
      //         topK: 250,
      //         maximumLength: 2048,
      //         stopSequences: ['</invoke>', '</answer>', '</error>'],
      //       },
      //     },
      //   ]
      // }
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

    new cdk.CfnOutput(this, 'AgentId', {value: agent.agentId});
    new cdk.CfnOutput(this, 'KnowledgeBaseId', {value: kb.knowledgeBaseId});
    new cdk.CfnOutput(this, 'DataSourceId', {value: dataSource.dataSourceId});
    new cdk.CfnOutput(this, 'DocumentBucket', {value: bucket.bucketName});
  }
}
