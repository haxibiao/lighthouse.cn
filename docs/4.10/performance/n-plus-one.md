# N+1 查询问题（The N+1 Query Problem）

GraphQL 查询的嵌套特性带来的一个常见的性能缺陷是所谓的 N+1 查询问题。

假设我们想要获取一个 post 列表，并且对于每个 post ，我们想要添加关联 author name：

```graphql
{
  posts {
    title
    author {
      name
    }
  }
}
```

遵循一种简单的执行策略，Lighthouse 将首先查询一个 post list ，然后遍历该 list 并解析各个字段。每个帖子的关联 author 将被延迟加载，因为每个 post 都需要查询一次数据库。

## 立即加载关系（Eager Loading Relationships）

在处理 Laravel 关系时，通常使用 [快速加载（eager loading）](https://laravel.com/docs/eloquent-relationships#eager-loading)来缓解 N+1 查询问题。

通过使用 [`@belongsTo`](../api-reference/directives.md#belongsto) 和 [`@hasMany`](../api-reference/directives.md#hasmany) 等指令，将模型之间的关系告知 Lighthouse ，您可以利用即时加载。

```graphql
type Post {
  title: String!
  author: User! @belongsTo
}

type User {
  name: String!
  posts: [Post!]! @hasMany
}
```

在幕后，Lighthouse 将把关系查询批处理在一个数据库查询中。

如果您需要为某些字段加载一个关系，但不希望返回关系本身，您可以使用 [`@with`](../api-reference/directives.md#with) 指令。

## 数据加载器（Data Loader）

`webonyx/graphql-php` 允许延迟字段的实际解析，直到真正需要时才进行解析。
更多信息请 [参阅文档](http://webonyx.github.io/graphql-php/data-fetching/#solving-n1-problem)。

如果您需要自定义批量加载，您可以扩展 `\Nuwave\Lighthouse\Execution\DataLoader\BatchLoader` 批量加载程序。
