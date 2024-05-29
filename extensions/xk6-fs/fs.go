package xk6fs

import (
	"errors"
	"fmt"
	"io"
	"os"
	"sync"

	"go.k6.io/k6/js/modules"
)

var mod = &module{}

func init() {
	modules.Register(
		"k6/x/fs",
		mod,
	)
}

type module struct {
	mu sync.RWMutex
}

func (m *module) ReadBytes(path string) ([]byte, error) {
	return os.ReadFile(path)
}

func (m *module) Read(path string) (string, error) {
	data, err := m.ReadBytes(path)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func (m *module) Remove(path string) error {
	return os.Remove(path)
}

func (m *module) Rename(oldPath, newPath string) error {
	return os.Rename(oldPath, newPath)
}

func (m *module) Exists(path string) (bool, error) {
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		return false, nil
	}

	return true, err
}

func (m *module) Mkdir(path string) error {
	return os.MkdirAll(path, 0755)
}

func (m *module) Write(path, data string) error {
	return m.WriteBytes(path, []byte(data))
}

func (m *module) Append(path, data string) error {
	return m.AppendBytes(path, []byte(data))
}

func (m *module) Update(path string, fn func(data string) string) error {
	return m.UpdateBytes(path, func(data []byte) []byte {
		return []byte(fn(string(data)))
	})
}

func (m *module) UpdateBytes(path string, fn func(data []byte) []byte) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	f, err := m.open(path, 0)
	if err != nil {
		return err
	}

	data, err := io.ReadAll(f)
	if err != nil {
		cerr := m.close(f)
		if cerr != nil {
			return fmt.Errorf("failed to close file: %w", cerr)
		}

		return fmt.Errorf("failed to read file: %w", err)
	}

	if err := f.Truncate(0); err != nil {
		return fmt.Errorf("failed to truncate file: %w", err)
	}

	if _, err := f.Seek(0, io.SeekStart); err != nil {
		return fmt.Errorf("failed to seek file: %w", err)
	}

	return m.write(f, fn(data))
}

func (m *module) WriteBytes(path string, data []byte) error {
	f, err := m.open(path, os.O_TRUNC)
	if err != nil {
		return err
	}

	return m.write(f, data)
}

func (m *module) AppendBytes(path string, data []byte) error {
	f, err := m.open(path, os.O_APPEND)
	if err != nil {
		return err
	}

	return m.write(f, data)
}

func (m *module) write(f *os.File, data []byte) error {
	_, err := f.Write(data)
	if err1 := m.close(f); err1 != nil && err == nil {
		err = err1
	}

	return err
}

func (m *module) open(path string, extraBits int) (f *os.File, err error) {
	f, err = os.OpenFile(path, os.O_CREATE|os.O_RDWR|extraBits, 0644)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			if err = m.Mkdir(path); err != nil {
				return nil, err
			}

			f, err = os.OpenFile(path, os.O_CREATE|os.O_RDWR|extraBits, 0644)
			if err != nil {
				return nil, fmt.Errorf("failed to open file: %w", err)
			}

			return f, nil
		}

		return nil, fmt.Errorf("failed to open file: %w", err)
	}

	return f, nil
}

func (m *module) close(f *os.File) error {
	cerr := f.Close()
	if cerr != nil {
		return cerr
	}

	return nil
}
