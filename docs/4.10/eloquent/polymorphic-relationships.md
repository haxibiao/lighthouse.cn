# 多态关系（Polymorphic Relationships）

就像在 Laravel 中一样，您可以在模式中定义 [多态关系](https://laravel.com/docs/eloquent-relationships#polymorphic-relationships) 。

## 一对一

假设您已经定义了一个模型结构，就像Laravel示例文档那样。您有两个模型， `Post` 和 `User` ，它们可能都有一个指定的 `Image` 。

让我们从没有任何关系的普通类型定义开始。

```graphql
type Post {
    id: ID!
    name: String!
}

type User {
    id: ID!
    name: String!
}

type Image {
    id: ID!
    url: String!
}
```

首先，让我们继续向 `Image` 添加关系，因为它们很简单。
字段名应该与您的关系方法名匹配，并使用 [`@morphOne`](../api-reference/directives.md#morphone) 指令进行注释。

```graphql
type Post {
    id: ID!
    name: String!
    image: Image! @morphOne
}

type User {
    id: ID!
    name: String!
    image: Image @morphOne
}
```

根据应用程序的规则，您可能在某些情况下要求存在关系，而在其他情况下允许不存在关系。在本例中， `Post` 必须始终有一个 `Image` ，而 `User` 不需要。

对于相反的情况，您将需要定义一个 [联合类型](../the-basics/types.md#union) 来表示一个 `Image` 可能链接到不同的模型。

```graphql
union Imageable = Post | User
```

现在，从 `Image` 类型的字段中引用联合类型。您可以使用 [`@morphTo`](../api-reference/directives.md#morphto) 指令进行性能优化。

```graphql
type Image {
    id: ID!
    url: String!
    imageable: Imageable! @morphTo
}
```

在处理 Eloquent 模型时，默认的类型解析器将能够确定返回的具体对象类型，因此您的定义应该能够正常工作。

## 一对多

基于上面的示例，您可以修改应用程序，允许一个 `Post` 有许多图片附加到它上面。 `images` 字段现在返回一个 `Image` 对象列表，并使用 [`@morphMany`](../api-reference/directives.md#morphmany) 指令进行注释。

```graphql
type Post {
    id: ID!
    name: String!
    images: [Image]! @morphMany
}

type Image {
    id: ID!
    url: String!
    imageable: Imageable! @morphTo
}

union Imageable = Post | User
```
