bin/k6:
	xk6 build --output bin/k6 \
		--with github.com/grafana/xk6-dashboard@latest \
		--with github.com/kleijnweb/xk6-fs=$$PWD/extensions/xk6-fs \
		--with github.com/kleijnweb/xk6-jwt=$$PWD/extensions/xk6-jwt \
		--with github.com/kleijnweb/xk6-jsonschema=$$PWD/extensions/xk6-jsonschema
