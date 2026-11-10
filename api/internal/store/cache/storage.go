package cache

import (
	"github.com/go-redis/redis/v8"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	billingrepository "github.com/vitalfit/api/internal/modules/billing/repository"
)

type Storage struct {
	Billing billingdomain.BillingStoreCacheRepository
}

func NewRedisStorage(rbd *redis.Client) Storage {
	return Storage{
		Billing: billingrepository.NewBillingCacheStore(rbd),
	}
}
