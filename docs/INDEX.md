---
home: true
heroImage: /logo.svg
actionText: 开始使用  →
actionLink: /docs/latest
features:
- title: 📜 SDL First
  details: 使用 GraphQL 模式定义语言来描述数据并通过服务器端指令添加功能。
- title: ❤ Laravel Friendly
  details: 在现有 Laravel 应用程序的基础上构建一个 GraphQL 服务器，最大化代码重用并使用您已经知道的概念。
- title: ⚡ Optimized for Eloquent
  details: Lighthouse 利用您现有的模型，并开箱即用地创建优化的数据库查询。
footer: Made with ❤ by people ，哈希坊提供中文网技术支持.
---

### 完全可自定义请求模式

通过使用 GraphQL 模式定义语言，在没有任何样板文件的情况下定义模式。

```graphql
type User {
  name: String!
  posts: [Post!]! @hasMany
}

type Post {
  title: String!
  author: User @belongsTo
}

type Query {
  me: User @auth
  posts: [Post!]! @paginate
}

type Mutation {
  createPost(
    title: String @rules(apply: ["required", "min:2"])
    content: String @rules(apply: ["required", "min:12"])
  ): Post @create
}
```

### 客户端可以自由获取需要的数据

在 GraphQL 查询中，客户端可以非常自由的获得他们需要的所有数据，一个请求即可高效完成

```graphql
query PostsWithAuthor {
  posts {
    title
    author {
      name
    }
  }
}
```

### 客户端可获取准确的数据结构

GraphQL 服务器可以将其架构告知客户端，因此他们将始终确切地知道自己将获得什么。


```json
{
  "data": {
    "posts": [
      {
        "title": "Lighthouse rocks",
        "author": {
          "name": "Albert Einstein"
        }
      },
      {
        "title": "World peace achieved through GraphQL",
        "author": {
          "name": "New York Times"
        }
      }
    ]
  }
}
```
