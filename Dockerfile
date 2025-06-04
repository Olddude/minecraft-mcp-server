FROM node:22-bookworm-slim
WORKDIR /minecraft-mcp-server
ENV DEBIAN_FRONTEND=noninteractive
# Install GitHub CLI and other dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    wget \
    unzip \
    bash \
    tree \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

COPY . .
RUN chmod +x scripts/*.sh

ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=${GITHUB_TOKEN}

RUN scripts/setup.sh
RUN npm ci
RUN npm run build
ENTRYPOINT [ "/bin/bash", "-c" ]
CMD [ "./scripts/run.sh" ]
