ARG VARIANT=2
FROM mcr.microsoft.com/devcontainers/universal:${VARIANT}

# Note: This could have been installed as a devcontainer feature,
# However then the AWS VSCode extension would be installed as well.
# In this case we only want to install the AWS CLI and AWS CDK.
# To move this back to a feature, follow instructions here:
# https://github.com/devcontainers/features/tree/main/src/aws-cli
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
        unzip awscliv2.zip && \
        sudo ./aws/install

# Note: Moved to devcontainer feature
# RUN npm install -g aws-cdk

RUN wget https://github.com/aws-cloudformation/rain/releases/download/v1.8.5/rain-v1.8.5_linux-amd64.zip && \
        unzip rain-v1.8.5_linux-amd64.zip rain-v1.8.5_linux-amd64/rain && \
        sudo mv rain-v1.8.5_linux-amd64/rain /usr/local/bin/ && \
        rm -r rain-v1.8.5_linux-amd64

RUN curl -OL releases.commonfate.io/granted/v0.21.1/granted_0.21.1_linux_x86_64.tar.gz && \
        sudo tar -zxvf ./granted_0.21.1_linux_x86_64.tar.gz -C /usr/local/bin/