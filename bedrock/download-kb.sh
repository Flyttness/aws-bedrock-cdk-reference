#!/bin/bash

TARGET_DIR=/workspaces/aws-bedrock-cdk-reference/bedrock/knowledgeBase
SOURCE_URL_BASE=https://raw.githubusercontent.com/build-on-aws/bedrock-agents-streamlit/main/S3docs

curl $SOURCE_URL_BASE/fomcminutes20230201.pdf --output $TARGET_DIR/fomcminutes20230201.pdf
curl $SOURCE_URL_BASE/fomcminutes20230322.pdf --output $TARGET_DIR/fomcminutes20230322.pdf
curl $SOURCE_URL_BASE/fomcminutes20230614.pdf --output $TARGET_DIR/fomcminutes20230614.pdf
curl $SOURCE_URL_BASE/fomcminutes20230726.pdf --output $TARGET_DIR/fomcminutes20230726.pdf
curl $SOURCE_URL_BASE/fomcminutes20230920.pdf --output $TARGET_DIR/fomcminutes20230920.pdf
curl $SOURCE_URL_BASE/fomcminutes20231101.pdf --output $TARGET_DIR/fomcminutes20231101.pdf
