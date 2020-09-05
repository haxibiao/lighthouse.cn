# 模式缓存（Schema caching）

随着模式越来越大，从原始 `.graphql` 文件构造模式的成本也越来越高。

请确保在将 Lighthouse 发送到生产环境时启用模式缓存。

```php
    /*
    |--------------------------------------------------------------------------
    | Schema Cache
    |--------------------------------------------------------------------------
    |
    | A large part of schema generation is parsing the schema into an AST.
    | This operation is pretty expensive so it is recommended to enable
    | caching in production mode, especially for large schemas.
    |
    */

    'cache' => [
        'enable' => env('LIGHTHOUSE_CACHE_ENABLE', true),
        'key' => env('LIGHTHOUSE_CACHE_KEY', 'lighthouse-schema'),
    ],
```

您可以使用 artisan 命令中的 [clear-cache](../api-reference/commands.md#clear-cache) 来清除模式缓存：

    php artisan lighthouse:clear-cache
