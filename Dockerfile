# Build stage
FROM denoland/deno:alpine-2.4.0
EXPOSE 8000
WORKDIR /app
USER deno
COPY . .
RUN deno install

CMD ["deno", "run", "--allow-net", "--allow-env", "main.ts"]
