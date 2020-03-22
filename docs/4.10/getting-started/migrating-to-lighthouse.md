# 添加 Lighthouse 到已有的项目

本节包含的内容是，如何将您现有的 API 迁移到 Lighthouse 的建议。

## Schema 定义

让您开始使用 Lighthouse 最重要的事情，就是先使用 GraphQL 定义您编写的接口。
如果您已经存在了一个项目，那您可以使用 introspection 来检索此项目。🔍
introspection 是一个简单的工具 [graphql-cli](https://github.com/graphql-cli/graphql-cli)。

    npm install -g graphql-cli
    graphql get-schema --endpoint=example.com/graphql --output=schema.graphql

在以前，您需要使用代码来定义一些 GraphQL 需要的基础类。这些基础类或许是 PHP 代码编写的？😊
而现在您有更好的[窍门](../the-basics/types.md)。

## Resolver 定义

如果您的项目来自 [Folkloreatelier/laravel-graphql](https://github.com/Folkloreatelier/laravel-graphql)，[rebing/laravel-graphql](https://github.com/rebing/graphql-laravel) 或者项目最初是基于 [webonyx/graphql-php](https://github.com/webonyx/graphql-php)，那您应该能够重用许多现有的代码。🎉

您还可以在 Lighthouse 的 Register 列表中注册现有的类型，因此无需用 SDL 重写它们。或许你想知道以前使用 [原生 PHP 如何实现](../digging-deeper/adding-types-programmatically.md#native-php-types)。

Resolver 与 Lighthourse 使用相同的 [signature](../api-reference/resolvers.md#resolver-function-signature)，因此您能够重用为 Queries/Mutations 所编写的任何逻辑。

Lighthouse 简化了许多常见的功能，例如 [增删改查](../the-basics/fields.md)、[加载 Eloquent 模型依赖关系](../eloquent/relationships.md#avoiding-the-n1-performance-problem)、[分页](../api-reference/directives.md#paginate)、[参数校验](../security/validation.md)。
