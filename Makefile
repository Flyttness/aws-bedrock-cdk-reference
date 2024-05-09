# ------------------------------------------------------------------------
# Sample Make Targets
# ------------------------------------------------------------------------

sample-cfn-deployment-target: ## Target title
	@./scripts/banner.sh
	@echo -e "[${GREEN}INFO${NC}] - Target title"
	@rain deploy --region us-east-1 ./example.cfn.yml

# ------------------------------------------------------------------------
# General Targets
# ------------------------------------------------------------------------

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