package config

import (
	"time"

	env "github.com/vitalfit/api/pkg/Env"
	"github.com/vitalfit/api/pkg/ratelimiter"
)

type Config struct {
	Addrs         string
	ApiUrl        string
	Db            dbConfig
	Env           string
	Mail          MailConfig
	Auth          AuthConfig
	RateLimiter   ratelimiter.Config
	FrontURL      string
	FrontURLE     string
	RedisCfg      redisConfig
	OpenExchange  OpenExchangeConfig
	Clerk         ClerkConfig
	EncryptionKey string
	Rekognition   RekognitionConfig
	OpenAI        OpenAIConfig
	Stripe        StripeConfig
}

type redisConfig struct {
	Addr     string
	Username string
	Pw       string
	Db       int
	Enabled  bool
}

type OpenExchangeConfig struct {
	AppID string
}

type dbConfig struct {
	Dsn          string
	MaxOpenConns int
	MaxIdleConns int
	MaxIdleTime  string
}

type MailConfig struct {
	FromEmail string
	Exp       time.Duration
	Resend    ResendConfig
}

type ResendConfig struct {
	ApiKey string
}

type AuthConfig struct {
	Token TokenConfig
}
type TokenConfig struct {
	Secret     string
	AccessExp  time.Duration
	RefreshExp time.Duration
	Iss        string
	Aud        string
}

type ClerkConfig struct {
	JwksURL string
}
type RekognitionConfig struct {
	Region    string
	AccessKey string
	SecretKey string
}

type OpenAIConfig struct {
	APIKey string
}

type StripeConfig struct {
	SecretKey     string `mapstructure:"STRIPE_SECRET_KEY"`     // Empieza con sk_test_...
	WebhookSecret string `mapstructure:"STRIPE_WEBHOOK_SECRET"` // Empieza con whsec_...
}

func LoadConfig() *Config {
	return &Config{
		Addrs: env.GetString("ADDRS", ":8080"),
		Db: dbConfig{
			Dsn:          env.GetString("DB_ADDR", "postgres://admin:adminpassword@localhost/vitalfit?sslmode=disable"),
			MaxOpenConns: env.GetInt("DB_MAX_OPEN_CONNS", 30),
			MaxIdleConns: env.GetInt("DB_MAX_IDLE_CONNS", 30),
			MaxIdleTime:  env.GetString("DB_MAX_IDLE_TIME", "15m"),
		},
		Env:    env.GetString("ENV", "dev"),
		ApiUrl: env.GetString("API_URL", "localhost:8080"),
		Mail: MailConfig{
			Exp:       time.Hour * 24 * 3, //3 days
			FromEmail: env.GetString("FROM_RESEND_EMAIL", ""),
			Resend: ResendConfig{
				ApiKey: env.GetString("RESEND_API_KEY", ""),
			},
		},
		Auth: AuthConfig{
			Token: TokenConfig{
				Secret:     env.GetString("JWT_SECRET", ""),
				AccessExp:  time.Minute * 3,
				RefreshExp: time.Hour * 24 * 7, //7 days
				Iss:        env.GetString("JWT_ISS", ""),
				Aud:        env.GetString("JWT_AUD", ""),
			},
		},
		RateLimiter: ratelimiter.Config{
			RequestsPerTimeFrame: env.GetInt("RATE_LIMITER_REQUESTS_PER_TIME_FRAME", 500),
			TimeFrame:            time.Minute * 1,
			Enabled:              env.GetBool("RATE_LIMITER_ENABLED", true),
		},
		FrontURL:  env.GetString("FRONT_URL", ""),
		FrontURLE: env.GetString("FRONT_URL_E", ""),
		RedisCfg: redisConfig{
			Addr:     env.GetString("REDIS_ADDR", "localhost:6379"),
			Username: env.GetString("REDIS_USERNAME", ""),
			Pw:       env.GetString("REDIS_PW", ""),
			Db:       env.GetInt("REDIS_DB", 0),
			Enabled:  env.GetBool("REDIS_ENABLED", false),
		},
		OpenExchange: OpenExchangeConfig{
			AppID: env.GetString("OPEN_EXCHANGE_APP_ID", ""),
		},
		Clerk: ClerkConfig{
			JwksURL: env.GetString("CLERK_JWKS_URL", ""),
		},
		EncryptionKey: env.GetString("ENCRYPTION_KEY", "vitalfit-medical-encrypt-key1234"),
		Rekognition: RekognitionConfig{
			Region:    env.GetString("AWS_REGIONR", ""),
			AccessKey: env.GetString("AWS_ACCESS_KEY_ID", ""),
			SecretKey: env.GetString("AWS_SECRET_ACCESS_KEY", ""),
		},
		OpenAI: OpenAIConfig{
			APIKey: env.GetString("OPENAI_API_KEY", ""),
		},
		Stripe: StripeConfig{
			SecretKey:     env.GetString("STRIPE_SECRET_KEY", ""),
			WebhookSecret: env.GetString("STRIPE_WEBHOOK_SECRET", ""),
		},
	}
}
