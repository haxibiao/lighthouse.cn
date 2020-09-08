# 认证方式（Authentication）

您可以使用 [标准的 Laravel 机制](https://laravel.com/docs/authentication) 来验证 GraphQL API 的用户。
在大多数情况下，建议使用无状态防护。

## 全局（Global）

只需通过 `lighthouse.php` 配置添加中间件。
由于所有 GraphQL 请求都在单个 HTTP 端点上提供，因此可以保护整个 API 免受未经身份验证的用户的侵害。

## 保护选定的字段（Guard selected fields）

如果只想保护选定的字段，则可以使用 [`@guard`](../api-reference/directives.md#guard) 指令要求进行身份验证才能访问它们。

```graphql
type Query {
  profile: User! @guard
}
```

如果需要保护多个字段，只需对 `type` 或者 `extend type` 定义使用 [`@guard`](../api-reference/directives.md#guard) 。
它将应用于该类型内的所有字段。

```graphql
extend type Query @guard(with: ["api:admin"]){
  adminInfo: Secrets
  nukeCodes: [NukeCode!]!
}
```

## 获取当前用户（Get the current user）

Lighthouse 提供了一种非常简单的方法来获取当前已认证用户的信息。
只需添加一个返回 `User` 类型的字段，并使用 [`@auth`](../api-reference/directives.md#auth) 指令对其进行修饰即可。

```graphql
type Query {
  me: User @auth
}
```
发送以下查询将返回经过身份验证的用户的信息；如果请求未经身份验证，则返回 `null` 。

```graphql
{
  me {
    name
    email
  }
}
```
