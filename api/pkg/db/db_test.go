package db

import "testing"

func TestSanitizeDSN(t *testing.T) {
	cases := map[string]string{
		"postgresql://u:p@host/db?sslmode=require&channel_binding=require": "postgresql://u:p@host/db?sslmode=require",
		"postgres://u:p@host/db?sslmode=disable":                           "postgres://u:p@host/db?sslmode=disable",
		"host=localhost user=u":                                            "host=localhost user=u",
	}
	for in, want := range cases {
		if got := SanitizeDSN(in); got != want {
			t.Errorf("SanitizeDSN(%q) = %q, want %q", in, got, want)
		}
	}
}
