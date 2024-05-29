package jsonschema

import (
	"fmt"
	"path/filepath"
	"sync"

	"github.com/santhosh-tekuri/jsonschema/v5"
	"go.k6.io/k6/js/modules"
)

func init() {
	modules.Register(
		"k6/x/jsonschema",
		(&loader{schemas: make(map[string]*Schema)}).Load,
	)
}

type loader struct {
	schemas map[string]*Schema
	mu      sync.Mutex
}

func (l *loader) Load(path string) (*Schema, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if path == "" {
		return nil, fmt.Errorf("schema path is required")
	}

	if schema, ok := l.schemas[path]; ok {
		return schema, nil
	}

	absPath, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("failed to get absolute path: %w", err)
	}

	sch, err := jsonschema.Compile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to compile schema: %w", err)
	}

	schema := &Schema{Schema: sch}

	l.schemas[absPath] = schema

	return schema, nil
}

type scalar interface {
	string | int | float64 | bool
}

func fixMap[T scalar](v map[string]T) map[string]any {
	fixedMap := make(map[string]any)
	for key, value := range v {
		fixedMap[key] = value
	}

	return fixedMap
}

func fixData(input any) any {
	switch v := input.(type) {
	case map[string]any:
		fixedMap := make(map[string]any)
		for key, value := range v {
			fixedMap[key] = fixData(value)
		}
		return fixedMap
	case []any:
		fixedSlice := make([]any, len(v))
		for i, value := range v {
			fixedSlice[i] = fixData(value)
		}
		return fixedSlice
	// goji does some stuff that jsonschema doesn't like
	case map[string]string:
		return fixMap(v)
	case map[string]int:
		return fixMap(v)
	case map[string]float64:
		return fixMap(v)
	case map[string]bool:
		return fixMap(v)
	default:
		return v
	}
}

type Schema struct {
	Schema *jsonschema.Schema
}

func (s *Schema) Validate(data any) *ValidationError {
	data = fixData(data)
	err := s.Schema.Validate(data)
	if err == nil {
		return nil
	}

	wrapper := newValidationError(err.(*jsonschema.ValidationError))

	return &wrapper
}

// ValidationError is a wrapper for jsonschema.ValidationError
// to prevent goji throwing errors. Also get some nicer field names
// than the default snake cake.
type ValidationError struct {
	err                     *jsonschema.ValidationError
	KeywordLocation         string            `js:"keywordLocation"`
	AbsoluteKeywordLocation string            `js:"absoluteKeywordLocation"`
	InstanceLocation        string            `js:"instanceLocation"`
	Message                 string            `js:"message"`
	Causes                  []ValidationError `js:"causes"`
}

func (ve ValidationError) ToString() string {
	return ve.err.GoString()
}

func newValidationError(err *jsonschema.ValidationError) ValidationError {
	ve := ValidationError{
		err:                     err,
		KeywordLocation:         err.KeywordLocation,
		AbsoluteKeywordLocation: err.AbsoluteKeywordLocation,
		InstanceLocation:        err.InstanceLocation,
		Message:                 err.Message,
	}

	for _, cause := range err.Causes {
		ve.Causes = append(ve.Causes, newValidationError(cause))
	}

	return ve
}
