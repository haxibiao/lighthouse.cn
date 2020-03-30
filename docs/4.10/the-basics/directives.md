# 指令 (Directives)

假设您已经通读了前面的章节，那么现在您应该已经熟悉了模式 (schema) 定义的基础知识。

你可能已经在模式 (schema) 定义中看到一些陌生的注解，比如 `@paginate`，`@rules` 或者 `@hasMany`。这些被称为指令 (directives) ，是向 GraphQL 模式 (schema) 添加功能的主要方式。

## 定义 (Definition)

指令 (directives) 总是以 `@` 符号开始接上唯一的名称。它们可以在 GraphQL 模式 (schema) 的指定部分使用。

这个示例指令 (example directive) `@upperCase` 可以用于需要返回大写结果的字段上。

```graphql
directive @upperCase on FIELD_DEFINITION

type Query {
  hello: String @upperCase
}
```

指令 (directives) 也可以定义参数来支持更灵活的使用，它们可以在多个地方使用，具体取决于[指定的指令 (directives) 位置](https://facebook.github.io/graphql/June2018/#DirectiveLocation)。

```graphql
directive @append(text: String) on FIELD_DEFINITION | ARGUMENT_DEFINITION

type Query {
  sayFriendly: String @append(text: ", please.")
  shout(phrase: String @append(text: "!")): String
}
```

## 用法 (Usage)

Lighthouse 提供了大量可以使用的内置模式指令 (built-in schema directives)，并且可以在模式 (schema) 中非常简单地使用它们。

下面的示例相当复杂，但它应该能让您了解指令 (directives) 的功能。

```graphql
type Query {
  "Return a list of posts"
  posts(
    "Place an exact match filter (=) on the data" 
    postedAt: Date @eq
    "Show only posts that match one of the given topics"
    topics: [String!] @in(key: "topic")
    "Search by title"
    title: String @where(operator: "%LIKE%")
  ): [Post!]!
    # Resolve as a paginated list
    @paginate
    # Require authentication
    @guard(with: "api")
}
```

请浏览文档以获得更多信息，或者查看[指令 (directives) API参考文档](../api-reference/directives.md)以获得所有可用指令 (directives) 的完整列表。

实现自己的指令 (directives) 是向模式 (schema) 添加可重用功能的好方法，了解[如何实现自己的指令](../custom-directives/getting-started.md)。
