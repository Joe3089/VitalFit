package cache

import "github.com/go-redis/redis/v8"

func NewRedisClient(addr, username, pw string, db int) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     addr,
		Username: username,
		Password: pw,
		DB:       db,
	})
}
