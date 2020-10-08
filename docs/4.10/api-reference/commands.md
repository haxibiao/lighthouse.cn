# Artisan 指令（Artisan Commands）

Lighthouse 提供了一些方便的 Artisan 指令。所有这些都在 `lighthouse` 开始命名。

## clear-cache

清除 GraphQL AST 的缓存。

    php artisan lighthouse:clear-cache

## ide-helper

创建一个包含所有服务器端指令的模式。这将允许一些 IDEs 在您的 GraphQL-schema 中完成代码。

    php artisan lighthouse:ide-helper

## interface

为 GraphQL 接口类型创建一个类。

    php artisan lighthouse:interface <name>

## mutation

为 root Mutation 类型上的单个字段创建一个类。

    php artisan lighthouse:mutation <name>

## print-schema

编译最后的 GraphQL 模式并打印结果。

    php artisan lighthouse:print-schema

这可能是非常有用的，因为 root `.graphql` 文件不一定包含整个模式。模式导入、原生 PHP 类型和模式操作可能会影响最终的模式。

使用 `-W` / `--write` 选项默认文件存储 `lighthouse-schema.graphql`(`storage/app`)。

## query

为 root Query 类型的单个字段创建一个类。

    php artisan lighthouse:query <name>

## scalar

为 GraphQL scalar 类型创建一个类。

    php artisan lighthouse:scalar <name>

## subscription

为 root Subscription 类型上的单个字段创建类。

    php artisan lighthouse:subscription <name>

## union

为 GraphQL union 类型创建一个类。

    php artisan lighthouse:union <name>

## validate-schema

验证 GraphQL schema 定义。

    php artisan lighthouse:validate-schema
