# 模式 (Schema)

Schema 定义了 GraphQL 服务器的功能。
与数据库 Schema 非常相似，它描述了 API 可以返回的结构和类型。

## 类型 (Types)

类型是 GraphQL Schema 的主要构建块。
它们定义了 API 的功能以及可以从中获得的数据类型。

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  created_at: String!
  updated_at: String
}
```

## Root 类型 (The Root Types)

在一个 GraphQL Schema 中最多可以有 3 种特殊的 Root 类型。它们定义查询可能具有的 Root 字段。尽管它们都是 [对象类型](types.md#object-type) 但是它们的作用都是不同的。

### 查询 (Query)

每个 GraphQL Schema 都必须有一个 `Query` 类型，该类型包含API提供的查询。
可以将查询看作是可以接受参数并返回固定结果的 REST 资源。

```graphql
type Query {
  me: User
  users: [User!]!
  userById(id: ID): User 
}
```

### 变更 (Mutation)

与 `Query` 类型不同，允许使用 `Mutation` 类型的字段更改服务器上的数据。

```graphql
type Mutation {
  createUser(name: String!, email: String!, password: String!): User
  updateUser(id: ID, email: String, password: String): User
  deleteUser(id: ID): User
}
```

### 订阅 (Subscription)

`Subscription` 类型的字段不是提供一个响应，而是返回一个响应流，并提供实时更新。

```graphql
type Subscription {
  newUser: User
}
```
