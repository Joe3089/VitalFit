FROM golang:1.25.0-alpine AS development


RUN apk add --no-cache git make
RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

RUN go install github.com/air-verse/air@latest

RUN go install github.com/swaggo/swag/cmd/swag@latest

WORKDIR /app

COPY .air.toml go.mod go.sum ./

RUN go mod download

COPY . .

EXPOSE 8080

#builder stage
FROM golang:1.25.0-alpine AS builder

RUN apk add --no-cache ca-certificates git

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go install github.com/swaggo/swag/cmd/swag@latest
RUN swag init -g ./api/main.go -d cmd,internal && swag fmt

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/main ./cmd/api

RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

#production stage
FROM alpine:latest AS production

RUN apk --no-cache add ca-certificates
RUN apk --no-cache add postgresql-client

WORKDIR /app

COPY --from=builder /app/main .

COPY --from=builder /go/bin/migrate .

COPY ./internal/migrate/migrations ./migrations

COPY --from=builder /app/docs ./docs

EXPOSE 8080

CMD ["./main"]