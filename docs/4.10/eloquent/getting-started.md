# Eloquent: 入门指南

Lighthouse 可以让您轻松方便对 Eloquent 模型执行查询和修改。

## 定义模型

通常 Eloquent 模型可以直接映射到您定义的 GraphQL types 中。

```graphql
type User {
    id: ID!
    name: String!
}
```

强烈建议您将主键 “id” 对应的字段命名为 “id”
如果您遵守命名的规定，那么流行的客户端库（Apollo）可以提供一些开箱即用的缓存。

## 检索模型

您有时甚至不需要手动去定义解析器，Lighthouse 将为您构造查询。

```graphql
type Query {
    users: [User!]! @all
}
```

The [@all](../api-reference/directives.md#all) 该指令将模型的名称与要解析的字段根据您定义的类型返回，并自动使用 Eloquent 来解析这些字段。

The following query:

```graphql
{
    users {
        id
        name
    }
}
```

这将会返回这些数据。

```json
{
    "data": {
        "users": [
            { "id": 1, "name": "James Bond" },
            { "id": 2, "name": "Madonna" }
        ]
    }
}
```

## 分页

您可以使用 [`@paginate`](../api-reference/directives.md#paginate) 指令去查询一个以分页结构的大模型数据列表。

```graphql
type Query {
    posts: [Post!]! @paginate
}
```

模式定义会自动转换为这样:

```graphql
type Query {
    posts(first: Int!, page: Int): PostPaginator
}

type PostPaginator {
    data: [Post!]!
    paginatorInfo: PaginatorInfo!
}
```

您也可以这样使用：

```graphql
{
    posts(first: 10) {
        data {
            id
            title
        }
        paginatorInfo {
            currentPage
            lastPage
        }
    }
}
```

## 添加查询约束

Lighthouse 内置了一些好用的指令来增加您的查询效率
向客户端提供一些额外的查询服务

下面的字段允许您通过 ID 获取单个用户实例。

```graphql
type Query {
    user(id: ID! @eq): User @find
}
```

您可以这样查询

```graphql
{
    user(id: 69) {
        name
    }
}
```

如果查询到了数据，它将这样返回。

```json
{
    "data": {
        "user": {
            "name": "Chuck Norris"
        }
    }
}
```

## 创建

在服务器上创建数据最简单的方法是使用 [@create](../api-reference/directives.md#create) 指令。

```graphql
type Mutation {
    createUser(name: String!): User! @create
}
```

这将接受 `createUser` 字段接收的参数，并使用它们创建一个新的模型实例。

```graphql
mutation {
    createUser(name: "Donald") {
        id
        name
    }
}
```

结果返回新创建的用户：

```json
{
    "data": {
        "createUser": {
            "id": "123",
            "name": "Donald"
        }
    }
}
```

**注意**：由于 Laravel 对大规模分配的保护，在 `@create` 或 `@update` 中使用的任何参数必须添加到模型中的 `$fillable` 属性。对于上面的例子，我们需要以下的 `\App\Models\User` ：

```php
class User extends Model
{
  // ...
  protected $fillable = ["name"];
}
```

有关更多信息，请参见 [laravel 文档](https://laravel.com/docs/eloquent#mass-assignment)。

## 更新

您可以使用 [@update](../api-reference/directives.md#update) 指令更新模型。

```graphql
type Mutation {
    updateUser(id: ID!, name: String): User @update
}
```

由于 GraphQL 允许您只更新数据的一部分，所以最好将 `id` 以外的所有参数都作为可选参数。

```graphql
mutation {
    updateUser(id: "123", name: "Hillary") {
        id
        name
    }
}
```

```json
{
    "data": {
        "updateUser": {
            "id": "123",
            "name": "Hillary"
        }
    }
}
```

请注意，虽然创建操作将始终返回结果，但如果您传递有效数据，更新可能无法找到您提供的模型，并返回 `null`：

```json
{
    "data": {
        "updateUser": null
    }
}
```

## 插入

使用 [@upsert](../api-reference/directives.md#upsert) 指令用给定的 `id` 更新模型，或者在模型不存在时创建它。

```graphql
type Mutation {
    upsertUser(id: ID!, name: String!, email: String): User @upsert
}
```

由于插入可以创建或更新数据，因此必须拥有创建所需的所有最小字段。
`id` 总是必需的，并且必须在模型中标记为可填充的。

```graphql
mutation {
    upsertUser(id: "123", name: "Hillary") {
        id
        name
        email
    }
}
```

```json
{
    "data": {
        "upsertUser": {
            "id": "123",
            "name": "Hillary",
            "email": null
        }
    }
}
```

## 删除

使用 [@delete](../api-reference/directives.md#delete) 指令删除模型轻而易举。
虽然容易但是危险。

```graphql
type Mutation {
    deleteUser(id: ID!): User @delete
}
```

只需使用想要删除的用户的 ID 调用它。

```graphql
mutation {
    deleteUser(id: "123") {
        secret
    }
}
```

此 mutation 将返回已删除的对象，因此您将有最后一次机会查看数据。
合理地使用它。

```json
{
    "data": {
        "deleteUser": {
            "secret": "Pink is my favorite color!"
        }
    }
}
```
