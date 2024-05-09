#!/bin/bash

# Copy welcome-message.txt to the default location for the first-run notice
sudo cp --force ./.devcontainer/welcome-message.txt /usr/local/etc/vscode-dev-containers/first-run-notice.txt

# Install the AWS Config file
mkdir "$HOME"/.aws
ln -sf "$PWD"/.devcontainer/aws/config "$HOME"/.aws/config