# ------------------------------------------------------------------------
# AWS CDK Targets
# ------------------------------------------------------------------------

# Deploying stacks with the CDK requires special dedicated AWS CDK resources 
# to be provisioned. The cdk bootstrap command creates the necessary resources 
# for you.
bootstrap: ## Bootstrap CDK stack
	@./scripts/banner.sh
	@echo -e "[${GREEN}INFO${NC}] - Bootstrap CDK stack"
	@cd cdk && cdk bootstrap

# To see a list of the IDs of the stacks in your AWS CDK application
list: ## List CDK stack
	@./scripts/banner.sh
	@echo -e "[${GREEN}INFO${NC}] - List CDK stack"
	@cd cdk && cdk list

# Synthesizes a stack defined in your app into a CloudFormation template
synth: ## Synth CDK stack
	@./scripts/banner.sh
	@echo -e "[${GREEN}INFO${NC}] - Synth CDK stack"
	@cd cdk && cdk synth

# Deploys stack to your AWS account
deploy-no-approval-no-rollback: ## Deploy CDK stack without approval and rollback
	@./scripts/banner.sh
	@echo -e "[${GREEN}INFO${NC}] - Deploy CDK stack without approval"
	@cd cdk && cdk deploy --no-rollback --require-approval never

deploy-no-rollback: ## Deploy CDK stack with approval and without rollback
	@./scripts/banner.sh
	@echo -e "[${GREEN}INFO${NC}] - Deploy CDK stack"
	@cd cdk && cdk deploy --no-rollback

deploy: ## Deploy CDK stack with approval and rollback
	@./scripts/banner.sh
	@echo -e "[${GREEN}INFO${NC}] - Deploy CDK stack"
	@cd cdk && cdk deploy

# Compares the current version of a stack (and its dependencies) defined in your app 
# with the already-deployed versions
diff: ## Diff CDK stack
	@./scripts/banner.sh
	@echo -e "[${GREEN}INFO${NC}] - Deploy CDK stack"
	@cd cdk && cdk diff

# ------------------------------------------------------------------------
# General Targets
# ------------------------------------------------------------------------

# Login to the AWS account with AWS SSO credential
aws-login: ## AWS Login
	@./scripts/banner.sh
	@echo -e "[${GREEN}INFO${NC}] - AWS Login"
	@aws sso login

# https://postd.cc/auto-documented-makefile/
help: ## Show help
	@./scripts/banner.sh
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@grep --no-filename -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# ------------------------------------------------------------------------
# Makefile configuration
# ------------------------------------------------------------------------

# Load .env file if it exists
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# Constant definitions
GREEN = \033[0;32m
NC = \033[0m

# Sets the default goal to be used if no targets were specified on the command line.
.DEFAULT_GOAL := help

# If this variable is not set in your makefile, the program /bin/sh is used as the shell.
# https://www.gnu.org/software/make/manual/html_node/Choosing-the-Shell.html
SHELL=/bin/bash

# This option causes make to display a warning whenever an undefined variable is expanded.
MAKEFLAGS += --warn-undefined-variables

# Disable any builtin pattern rules, then speedup a bit.
MAKEFLAGS += --no-builtin-rules

# Disable printing of the working directory
MAKEFLAGS += --no-print-directory

# Disable any builtin suffix rules, then speedup a bit.
.SUFFIXES:

# The arguments passed to the shell are taken from the variable .SHELLFLAGS.
#
# The -e flag causes bash with qualifications to exit immediately if a command it executes fails.
# The -u flag causes bash to exit with an error message if a variable is accessed without being defined.
# The -o pipefail option causes bash to exit if any of the commands in a pipeline fail.
# The -c flag is in the default value of .SHELLFLAGS and we must preserve it.
# Because it is how make passes the script to be executed to bash.
.SHELLFLAGS := -eu -o pipefail -c

# Sets the default goal to be used if no targets were specified on the command line.
.DEFAULT_GOAL := help

# https://gist.github.com/tadashi-aikawa/da73d277a3c1ec6767ed48d1335900f3
.PHONY: $(shell egrep -oh ^[a-zA-Z0-9][a-zA-Z0-9_-]+: $(MAKEFILE_LIST) | sed 's/://')