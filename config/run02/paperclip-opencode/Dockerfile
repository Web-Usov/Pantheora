ARG PAPERCLIP_IMAGE=ghcr.io/paperclipai/paperclip:latest
FROM ${PAPERCLIP_IMAGE}

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates bash \
  && rm -rf /var/lib/apt/lists/*

USER node
ENV HOME=/home/node
WORKDIR /home/node

# Install OpenCode CLI for Paperclip's built-in `opencode_local` adapter.
# If upstream installer behavior changes, this step is the first place to adjust.
RUN curl -fsSL https://opencode.ai/install | bash

ENV PATH=/home/node/.opencode/bin:${PATH}

# Lightweight sanity check during image build.
RUN opencode --help >/dev/null 2>&1

USER root
WORKDIR /app
