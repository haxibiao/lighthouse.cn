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

The easiest way to create data on your server is to use the [@create](../api-reference/directives.md#create) directive.

```graphql
type Mutation {
    createUser(name: String!): User! @create
}
```

This will take the arguments that the `createUser` field receives and use them to create a new model instance.

```graphql
mutation {
    createUser(name: "Donald") {
        id
        name
    }
}
```

The newly created user is returned as a result:

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

**Note**: Due to Laravel's protections against mass assignment, any arguments used in `@create` or `@update` must be added to the `$fillable` property in your Model. For the above example, we would need the following in `\App\Models\User`:

```php
class User extends Model
{
  // ...
  protected $fillable = ["name"];
}
```

For more information, see the [laravel docs](https://laravel.com/docs/eloquent#mass-assignment).

## Update

You can update a model with the [@update](../api-reference/directives.md#update) directive.

```graphql
type Mutation {
    updateUser(id: ID!, name: String): User @update
}
```

Since GraphQL allows you to update just parts of your data, it is best to have all arguments except `id` as optional.

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

Be aware that while a create operation will always return a result, provided you pass valid data, the update
may fail to find the model you provided and return `null`:

```json
{
    "data": {
        "updateUser": null
    }
}
```

## Upsert

Use the [@upsert](../api-reference/directives.md#upsert) directive to update a model with
a given `id` or create it if it does not exist.

```graphql
type Mutation {
    upsertUser(id: ID!, name: String!, email: String): User @upsert
}
```

Since upsert can create or update your data you must have all the minimum fields for a creation as required.
The `id` is always required and must be marked as fillable in the model.

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

## Delete

Deleting models is a breeze using the [@delete](../api-reference/directives.md#delete) directive. Dangerously easy.

```graphql
type Mutation {
    deleteUser(id: ID!): User @delete
}
```

Simply call it with the ID of the user you want to delete.

```graphql
mutation {
    deleteUser(id: "123") {
        secret
    }
}
```

This mutation will return the deleted object, so you will have a last chance to look at the data. Use it wisely.

```json
{
    "data": {
        "deleteUser": {
            "secret": "Pink is my favorite color!"
        }
    }
}
```
