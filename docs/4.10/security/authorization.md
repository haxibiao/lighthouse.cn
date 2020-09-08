# 授权规则（Authorization）

并非您的应用程序中的每个用户都可以查看所有数据或执行任何操作。
您可以通过执行授权规则来控制他们可以做什么。

## 利用查看器模式（Utilize the Viewer pattern）

一种常见的模式是允许用户仅访问属于他们的条目。
例如，用户可能只能看到他们创建的注释。
您可以利用 GraphQL 查询的嵌套性质来自然地限制对此类字段的访问。

从代表当前经过身份验证的用户（通常称为 `me` 或 `viewer`）的字段开始。
您可以使用 [`@auth`](../api-reference/directives.md#auth) 指令轻松解决该字段。

```graphql
type Query {
  me: User! @auth
}

type User {
  name: String!
}
```

现在，将作为关系存在的相关实体添加到 `User` 类型上。

```graphql
type User {
  name: String!
  notes: [Note!]!
}

type Note {
  title: String!
  content: String!
}
```

现在，经过身份验证的用户可以查询属于他们的项目，并且自然只能看到这些项目。

```graphql
{
  me {
    name
    notes {
      title
      content
    }
  }
}
```

## 通过政策限制字段（Restrict fields through policies）

Lighthouse 允许你限制特定用户组的字段操作。
使用 [@can](../api-reference/directives.md#can) 指令来利用 [Laravel 策略（Policies）](https://laravel.com/docs/authorization) 进行授权。

从 Laravel 5.7开始，支持 [guest 用户授权](https://laravel.com/docs/authorization#guest-users) 。
因此，Lighthouse 在将用户传递给策略之前 **不会** 验证用户是否已通过身份验证。

### 保护 Mutation（Protect mutations）

例如，您可能希望只允许应用程序的 admin 用户创建 posts。
可以在你想要保护的 Mutation 上定义  `@can` ：

```graphql
type Mutation {
    createPost(input: PostInput): Post @can(ability: "create")
}
```

上面例子中引用的 `create` 能力是由 Laravel 策略支持的：

```php
class PostPolicy
{
    public function create(User $user): bool
    {
        return $user->is_admin;
    }
}
```

### 保护特定的模型实例（Protect specific model instances）

对于某些模型，您可能希望限制对模型的特定实例的访问。
使用 `find` 参数指定作为模型主键的输入参数的名称。
Lighthouse 会使用它来找到一个特定的模型实例，它的权限应该被检查：

```graphql
type Query {
    post(id: ID @eq): Post @can(ability: "view", find: "id")
}
```

```php
class PostPolicy
{
    public function view(User $user, Post $post): bool
    {
        return $user->id === $post->author_id;
    }
}
```

发现模型（model）和 [软删除（soft deleting）](../eloquent/soft-deleting.md) 结合得很好。
Lighthouse 将检测查询是否需要一个过滤器来过滤被丢弃的模型，并根据需要应用它。

### 通过附加参数（Passing additional arguments）

你可以通过指定 `args` 来传递额外的参数给策略检查：

```graphql
type Mutation {
    createPost(input: PostInput): Post
        @can(ability: "create", args: ["FROM_GRAPHQL"])
}
```

```php
class PostPolicy
{
    public function create(User $user, array $args): bool
    {
        // $args will be the PHP representation of what is in the schema: [0 => 'FROM_GRAPHQL']
    }
}
```

您可以通过 `injectArgs` 参数将客户端给定的输入数据作为参数传递给策略检查：

```graphql
type Mutation {
    createPost(title: String!): Post
        @can(ability: "create", injectArgs: "true")
}
```

```php
class PostPolicy
{
    public function create(User $user, array $injected): bool
    {
        // $injected will hold the args given by the client: ['title' => string(?)]
    }
}
```

当你把这两种传递参数的方式结合在一起时，策略将被 `injectArgs` 作为第二个参数传递，而静态 `args` 作为第三个参数传递：

```php
class PostPolicy
{
    public function create($user, array $injectedArgs, array $staticArgs): bool { ... }
}
```
