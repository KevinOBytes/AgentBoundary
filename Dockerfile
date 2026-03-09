# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS website-builder
WORKDIR /app/website
COPY website/package.json ./
RUN npm install
COPY website/ ./
RUN npm run build

FROM python:3.11-slim AS harness-runner
WORKDIR /app
COPY harness/ ./harness/
COPY dataset/ ./dataset/
COPY results/ ./results/
COPY scripts/ ./scripts/
COPY .env.example ./
RUN python3 -m compileall harness
CMD ["python3", "harness/runner.py", "--dry-run"]

FROM node:22-alpine AS website-runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=website-builder /app/website .
EXPOSE 3000
CMD ["npm", "run", "start"]
