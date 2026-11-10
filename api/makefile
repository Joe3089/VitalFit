MIGRATIONS_PATH=./internal/migrate/migrations
APP_SERVICE=app 
include .env

.PHONY: test
test:
	@go test -v ./...

.PHONY: docker-up
docker-up:
	@docker compose up --build

.PHONY: docker-down
docker-down:
	@docker compose down

.PHONY: migrate-create
migration:
	@docker compose run --rm $(APP_SERVICE) migrate create -seq -ext sql -dir $(MIGRATIONS_PATH) $(filter-out $@,$(MAKECMDGOALS))

.PHONY: migrate-up
migrate-up:
	@docker compose run --rm $(APP_SERVICE) migrate -path=$(MIGRATIONS_PATH) -database=$(DB_ADDR) up

.PHONY: migrate-down
migrate-down:
	@docker compose run --rm $(APP_SERVICE) migrate -path=$(MIGRATIONS_PATH) -database=$(DB_ADDR) down $(filter-out $@,$(MAKECMDGOALS))

.PHONY: migrate-force 
migrate-force:
	@docker compose run --rm $(APP_SERVICE) migrate -path=$(MIGRATIONS_PATH) -database=$(DB_ADDR) force $(NAME)

.PHONY: gen-docs
gen-docs:
	@swag init -g ./api/main.go -d cmd,internal && swag fmt

.PHONY: seed
seed: 
	@docker compose run --rm $(APP_SERVICE) go run internal/migrate/seed/main.go

.PHONY: run
run:
	@echo "Use 'make docker-up' to run the app with Air and Docker."