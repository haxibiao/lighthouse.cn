# Tracing

Tracing 为 GraphQL 服务器提供了字段级的性能监视。

Lighthouse 遵循 [Apollo Tracing response 格式](https://github.com/apollographql/apollo-tracing#response-format)。

## 设置（Setup）

将服务提供者（Service Provider）添加到 `config/app.php` 中

```php
'providers' => [
    \Nuwave\Lighthouse\Tracing\TracingServiceProvider::class,
],
```
