# Setup Stage - create a non-root user and set up the ZSH environment for optimal developer experience
FROM node:14-alpine AS setup
# Use the unprivileged `node` user (created by the image) for safety and so we don't need `--no-sandbox` with Puppeteer
RUN mkdir -p /home/node/Downloads /app \
    && chown -R node:node /home/node \
    && chown -R node:node /app
# Set up ZSH and our preferred terminal environment for containers
RUN apk --no-cache add zsh curl git
RUN mkdir -p /home/node/.antigen
RUN curl -L git.io/antigen > /home/node/.antigen/antigen.zsh
COPY .dockershell.sh /home/node/.zshrc
RUN chown -R node:node /home/node/.antigen /home/node/.zshrc
# Set up ZSH as the unprivileged user
USER node
RUN /bin/zsh /home/node/.zshrc
USER root

# Base Stage - install system-level dependencies, disable telemetry, and run `yarn`
FROM setup AS base
WORKDIR /app
# Add system-level dependencies
RUN apk add --no-cache python3 bash
# Disable telemetry of various tools for privacy
RUN yarn config set --home enableTelemetry 0
# Let scripts know we're running in Docker
ENV RUNNING_IN_DOCKER true
COPY . .

# Playground Stage - simple ZSH entrypoint for us to shell into the container as the non-root user
FROM base AS playground
USER node
ENTRYPOINT [ "/bin/zsh" ]
