package main

import (
	"log"

	"github.com/go-redis/redis/v8"
	"github.com/vitalfit/api/config"
	"github.com/vitalfit/api/internal/app"
	"github.com/vitalfit/api/internal/store/cache"
	"github.com/vitalfit/api/pkg/db"

	_ "github.com/lib/pq"
)

//	@title			VitalFit API
//	@description	API for VitalFit, a gym system management
//	@termsOfService	http://swagger.io/terms/

//	@contact.name	API Support
//	@contact.url	http://www.swagger.io/support
//	@contact.email	support@swagger.io

//	@license.name	Apache 2.0
//	@license.url	http://www.apache.org/licenses/LICENSE-2.0.html

// @BasePath					/v1
//
// @securityDefinitions.apikey	ApiKeyAuth
// @in							header
// @name						Authorization
// @description
//
// @securityDefinitions.apikey	BIApiKey
// @in							header
// @name						X-API-Key
// @description				API key for BI integrations, created in /insights/api-keys
func main() {
	//initialize config
	config := config.LoadConfig()

	//db gorm connection
	db, err := db.New(config.Db.Dsn, config.Db.MaxOpenConns, config.Db.MaxIdleConns, config.Db.MaxIdleTime)
	if err != nil {
		log.Fatal(err)
	}
	var rdb *redis.Client
	if config.RedisCfg.Enabled {
		rdb = cache.NewRedisClient(config.RedisCfg.Addr, config.RedisCfg.Username, config.RedisCfg.Pw, config.RedisCfg.Db)
		log.Print("redis cache connection established")

		defer rdb.Close()
	}
	//initialize application

	app := app.BuildApplication(config, db, rdb)
	mux := app.Mount()
	app.Cronjob.Start()
	if err := app.Run(mux); err != nil {
		log.Fatal(err)
	}

}
