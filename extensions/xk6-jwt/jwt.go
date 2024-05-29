package jwt

import (
	"github.com/golang-jwt/jwt/v5"
	"go.k6.io/k6/js/modules"
)

func init() {
	modules.Register(
		"k6/x/jwt",
		(&module{}),
	)
}

type module struct{}

func (m *module) NewHS256(secret string, claims map[string]any) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims(claims))
	return token.SignedString([]byte(secret))
}
