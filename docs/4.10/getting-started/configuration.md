# 配置文件

Lighthouse 默认的配置文件一切都刚刚好，您可以直接使用。如果您需要更改默认配置，则需要先生成配置文件。

```bash
php artisan vendor:publish --provider="Nuwave\Lighthouse\LighthouseServiceProvider" --tag=config
```

配置文件将被在 `config/lighthouse.php` 中。🍺
