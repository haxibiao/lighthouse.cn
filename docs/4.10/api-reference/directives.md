# 指令（Directives）

## @all

提取所有 Eloquent 模型，并返回集合作为字段的结果。

```graphql
type Query {
    users: [User!]! @all
}
```

这假定您的模型与要返回的类型具有相同的名称，并且在默认模型名称空间 App 中定义。[您可以更改此配置](../getting-started/configuration.md)。

### 定义（Definition）

```graphql
directive @all(
    """
    Specify the class name of the model to use.
    This is only needed when the default model detection does not work.
    """
    model: String

    """
    Apply scopes to the underlying query.
    """
    scopes: [String!]
) on FIELD_DEFINITION
```

### 例子（Examples）

如果需要为单个字段使用其他模型，则可以将类名称作为 `model` 参数传递。

```graphql
type Query {
    posts: [Post!]! @all(model: "App\\Blog\\BlogEntry")
}
```

## @auth

返回当前经过身份验证的用户作为查询的结果。

```graphql
type Query {
    me: User @auth
}
```

### 定义（Definition）

```graphql
"""
Return the currently authenticated user as the result of a query.
"""
directive @auth(
    """
    Use a particular guard to retreive the user.
    """
    guard: String
) on FIELD_DEFINITION
```

### 例子（Examples）

如果您需要使用默认值以外的其他保护措施来解析经过身份验证的用户，则可以将保护名作为 `guard` 参数传递

```graphql
type Query {
    me: User @auth(guard: "api")
}
```

## @belongsTo

通过 Eloquent `BelongsTo` 关系解析字段。

```graphql
type Post {
    author: User @belongsTo
}
```

它假设字段和关系方法都具有相同的名称。

```php
<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

### 定义（Definition）

```graphql
"""
Resolves a field through the Eloquent `BelongsTo` relationship.
"""
directive @belongsTo(
    """
    Specify the relationship method name in the model class,
    if it is named different from the field in the schema.
    """
    relation: String

    """
    Apply scopes to the underlying query.
    """
    scopes: [String!]
) on FIELD_DEFINITION
```

### 例子（Examples）

如果您的关系方法的名称与字段的名称不同，则该伪指令接受可选的 `relation` 参数。

```graphql
type Post {
    user: User @belongsTo(relation: "author")
}
```

## @belongsToMany

通过 Eloquent `BelongsToMany` 关系解析字段。

```graphql
type User {
    roles: [Role!]! @belongsToMany
}
```

它假定字段和关系方法都具有相同的名称。

```php
<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }
}
```

### 定义（Definition）

```graphql
"""
Resolves a field through the Eloquent `BelongsToMany` relationship.
"""
directive @belongsToMany(
    """
    Specify the relationship method name in the model class,
    if it is named different from the field in the schema.
    """
    relation: String

    """
    Apply scopes to the underlying query.
    """
    scopes: [String!]

    """
    ALlows to resolve the relation as a paginated list.
    Allowed values: `paginator`, `connection`.
    """
    type: String

    """
    Specify the default quantity of elements to be returned.
    Only applies when using pagination.
    """
    defaultCount: Int

    """
    Specify the maximum quantity of elements to be returned.
    Only applies when using pagination.
    """
    maxCount: Int

    """
    Specify a custom type that implements the Edge interface
    to extend edge object.
    Only applies when using Relay style "connection" pagination.
    """
    edgeType: String
) on FIELD_DEFINITION
```

### 例子（Examples）

如果您的关系方法的名称与字段的名称不同，则该伪指令接受可选的 `relation` 参数。

```graphql
type User {
    jobs: [Role!]! @belongsToMany(relation: "roles")
}
```

使用连接 `type` 参数时，您可以创建自己的 [Edge 类型](https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types) ，该类型可能具有可从模型数据 [pivot](https://laravel.com/docs/5.8/eloquent-relationships#many-to-many) 解析的字段。您还可以为要自行解决的字段添加自定义字段解析器。

您可以使用 `edgetype` 参数指定边，或者它会自动查找要定义的 {type}Edge 类型。
在这种情况下，它将是 `RoleEdge` 。

```graphql
type User {
    roles: [Role!]!
        @belongsToMany(type: "connection", edgeType: "CustomRoleEdge")
}

type CustomRoleEdge implements Edge {
    cursor: String!
    node: Node
    meta: String
}
```

## @bcrypt

```graphql
"""
Run the `bcrypt` function on the argument it is defined on.

@deprecated(reason: "Use @hash instead. This directive will be removed in v5.")
"""
directive @bcrypt on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

不赞成使用 [`@hash`](#hash).

## @broadcast

向订阅的客户广播 mutation 的结果。
[阅读有关订阅的更多信息](../subscriptions/getting-started.md)

```graphql
type Mutation {
    createPost(input: CreatePostInput!): Post
        @broadcast(subscription: "postCreated")
}
```

`subscription` 参数必须引用订阅字段的名称。

### 定义（Definition）

```graphql
"""
Broadcast the results of a mutation to subscribed clients.
"""
directive @broadcast(
    """
    Name of the subscription that should be retriggered as a result of this operation..
    """
    subscription: String!

    """
    Specify whether or not the job should be queued.
    This defaults to the global config option `lighthouse.subscriptions.queue_broadcasts`.
    """
    shouldQueue: Boolean
) on FIELD_DEFINITION
```

### 例子（Examples）

您可以通过传递 `shouldQueue` 参数来覆盖配置中的默认列队行为。

```graphql
type Mutation {
    updatePost(input: UpdatePostInput!): Post
        @broadcast(subscription: "postUpdated", shouldQueue: false)
}
```

## @builder

使用参数来修改字段的 query 构建器。

```graphql
type Query {
    users(
        limit: Int @builder(method: "App\MyClass@limit")
    ): [User!]! @all
}
```

您必须指向一种 `method` ，该方法将接收构建器实例和参数值，并且可以将其他约束应用于查询。

```php
namespace App;

class MyClass
{

     * Add a limit constrained upon the query.
     *
     * @param  \Illuminate\Database\Query\Builder|\Illuminate\Database\Eloquent\Builder  $builder
     * @param  mixed  $value
     * @return \Illuminate\Database\Query\Builder|\Illuminate\Database\Eloquent\Builder
     */
    public function limit($builder, int $value)
    {
        return $builder->limit($value);
    }
}
```

### 定义（Definition）

```graphql
"""
Use an argument to modify the query builder for a field.
"""
directive @builder(
    """
    Reference a method that is passed the query builder.
    Consists of two parts: a class name and a method name, separated by an `@` symbol.
    If you pass only a class name, the method name defaults to `__invoke`.
    """
    method: String!
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

## @cache

缓存解析器的结果。

缓存是在第一个请求上创建的，默认情况下将永远缓存。
将此值用于很少更改且 获取/计算（fetch/compute）需要很长时间的值。

```graphql
type Query {
    highestKnownPrimeNumber: Int! @cache
}
```

### 定义（Definition）

```graphql
"""
Cache the result of a resolver.
"""
directive @cache(
    """
    Set the duration it takes for the cache to expire in seconds.
    If not given, the result will be stored forever.
    """
    maxAge: Int

    """
    Limit access to cached data to the currently authenticated user.
    When the field is accessible by guest users, this will not have
    any effect, they will access a shared cache.
    """
    private: Boolean = false
) on FIELD_DEFINITION
```

### 例子（Examples）

如果要在一段时间后使缓存无效，可以设置以秒为单位的到期时间。

```graphql
type Query {
    temperature: Int! @cache(maxAge: 300)
}
```

您可以通过将缓存标记为私有来将缓存限制为发出请求的登录用户。
这对于特定于特定用户的数据是有意义的。

```graphql
type Query {
    todos: [ToDo!]! @cache(private: true)
}
```

## @cacheKey

指定在创建缓存时用作键的字段。

```graphql
type GithubProfile {
    username: String @cacheKey
    repos: [Repository] @cache
}
```

为解析器生成缓存的结果时，Lighthouse 为每种类型生成唯一的密钥。
默认情况下，Lighthouse 将查找具有 `ID` 类型的字段以生成密钥。
如果您想使用其他字段（即外部 API ID），则可以使用 `@cacheKey` 指令标记该字段。

### 定义（Definition）

```graphql
"""
Specify the field to use as a key when creating a cache.
"""
directive @cacheKey on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

## @can

```graphql
"""
Check a Laravel Policy to ensure the current user is authorized to access a field.

When `injectArgs` and `args` are used together, the client given
arguments will be passed before the static args.
"""
directive @can(
    """
    The ability to check permissions for.
    """
    ability: String!

    """
    The name of the argument that is used to find a specific model
    instance against which the permissions should be checked.
    """
    find: String

    """
    Specify the class name of the model to use.
    This is only needed when the default model detection does not work.
    """
    model: String

    """
    Pass along the client given input data as arguments to `Gate::check`.
    """
    injectArgs: Boolean = false

    """
    Statically defined arguments that are passed to `Gate::check`.

    You may pass pass arbitrary GraphQL literals,
    e.g.: [1, 2, 3] or { foo: "bar" }
    """
    args: Mixed
) on FIELD_DEFINITION
```

返回的 Type `Post` 的名称用作 Model 类，但是您可以通过传递 `model` 参数来覆盖它。

```graphql
type Mutation {
    createBlogPost(input: PostInput): BlogPost
        @can(ability: "create", model: "App\\Post")
}
```

您可以在 [授权文档](../security/authorization.md#restrict-fields-through-policies) 中找到此指令的用法示例。

## @complexity

在执行之前执行字段复杂度分数的计算。

```graphql
type Query {
    posts: [Post!]! @complexity
}
```

[阅读有关查询复杂性分析的更多信息](http://webonyx.github.io/graphql-php/security/#query-complexity-analysis)

### 定义（Definition）

```graphql
"""
Customize the calculation of a fields complexity score before execution.
"""
directive @complexity(
    """
    Reference a function to customize the complexity score calculation.
    Consists of two parts: a class name and a method name, seperated by an `@` symbol.
    If you pass only a class name, the method name defaults to `__invoke`.
    """
    resolver: String
) on FIELD_DEFINITION
```

### 例子（Examples）

您可以提供自己的函数来计算复杂度。

```graphql
type Query {
    posts: [Post!]!
        @complexity(resolver: "App\\Security\\ComplexityAnalyzer@userPosts")
}
```

自定义复杂度函数可能如下所示，请参考 [复杂度函数签名](resolvers.md#complexity-function-signature) 。

```php
namespace App\Security;

class ComplexityAnalyzer {

    public function userPosts(int $childrenComplexity, array $args): int
    {
        $postComplexity = $args['includeFullText'])
            ? 3
            : 2;

        return $childrenComplexity * $postComplexity;
    }
```

## @count

返回给定关系或模型的计数。

```graphql
type User {
    id: ID!
    likes: Int! @count(relation: "likes")
}
```

```graphql
type Query {
    categories: Int! @count(model: "Category")
}
```

### 定义（Definition）

```graphql
"""
Returns the count of a given relationship or model.
"""
directive @count(
    """
    The relationship which you want to run the count on.
    """
    relation: String

    """
    The model to run the count on.
    """
    model: String
) on FIELD_DEFINITION
```

## @create

```graphql
"""
Create a new Eloquent model with the given arguments.
"""
directive @create(
    """
    Specify the class name of the model to use.
    This is only needed when the default model detection does not work.
    """
    model: String

    """
    Specify the name of the relation on the parent model.
    This is only needed when using this directive as a nested arg
    resolver and if the name of the relation is not the arg name.
    """
    relation: String
) on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

在返回模型实例的 root mutation 字段上使用它。

```graphql
type Mutation {
    createPost(title: String!): Post @create
}
```

如果使用单个输入对象作为参数，则必须告诉 Lighthouse 将嵌套的值展开（spread）之后再将其应用于解析程序。

```graphql
type Mutation {
    createPost(input: CreatePostInput! @spread): Post @create
}

input CreatePostInput {
    title: String!
}
```

如果 Eloquent 模型的名称与字段的返回类型不匹配，或者位于非默认名称空间中，请使用 `model` 参数进行设置。

```graphql
type Mutation {
    createPost(title: String!): Post @create(model: "Foo\\Bar\\MyPost")
}
```

该指令也可以用作嵌套的 [参数解析器](../concepts/arg-resolvers.md)。

## @delete

```graphql
"""
Delete one or more models by their ID.
The field must have a single non-null argument that may be a list.
"""
directive @delete(
    """
    Set to `true` to use global ids for finding the model.
    If set to `false`, regular non-global ids are used.
    """
    globalId: Boolean = false

    """
    Specify the class name of the model to use.
    This is only needed when the default model detection does not work.
    """
    model: String

    """
    Specify the name of the relation on the parent model.
    This is only needed when using this directive as a nested arg
    resolver and if the name of the relation is not the arg name.
    """
    relation: String
) on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

在返回模型实例的 root mutation 字段上使用它。

```graphql
type Mutation {
    deletePost(id: ID!): Post @delete
}
```

如果使用 global ids，则可以将 `globalId` 参数设置为 `true` 。
Lighthouse 将自动为您解析 ID。

```graphql
type Mutation {
    deletePost(id: ID!): Post @delete(globalId: true)
}
```

您也可以一次删除多个模型。
定义一个字段，该字段采用 ID 列表并返回已删除模型的集合。

_与 Laravel 大量更新相反，这确实会触发模型事件。_

```graphql
type Mutation {
    deletePosts(id: [ID!]!): [Post!]! @delete
}
```

如果 Eloquent 模型的名称与字段的返回类型不匹配，或者位于非默认名称空间中，请使用 `model` 参数进行设置。

```graphql
type Mutation {
    deletePost(id: ID!): Post @delete(model: "Bar\\Baz\\MyPost")
}
```

该指令也可以作用到 [嵌套的参数解析器](../concepts/arg-resolvers.md)。

```graphql
type Mutation {
    updateUser(id: Int, deleteTasks: [Int!]! @delete(relation: "tasks")): User
        @update
}
```

如果该模型通过 `HasOne` ， `MorphOne` ， `BelongsTo` 或 `MorphTo` 关系与其他单个模型相关，则可以只传递一个布尔值而不是一个 ID ，因为只能删除一个可能的模型。

```graphql
type Mutation {
    updateTask(id: Int, deleteUser: Boolean @delete(relation: "user")): Task
        @update
}
```

## @deprecated

您可以通过添加 `@deprecated` 指令并提供 `reason` 来将字段标记为已弃用。
除非提出要求，否则自检（introspection）查询中不 ​​ 包括不建议使用的字段，客户端仍然可以查询它们。

```graphql
type Query {
    users: [User] @deprecated(reason: "Use the `allUsers` field")
    allUsers: [User]
}
```

### 定义（Definition）

```graphql
"""
Marks an element of a GraphQL schema as no longer supported.
"""
directive @deprecated(
    """
    Explains why this element was deprecated, usually also including a
    suggestion for how to access supported similar data. Formatted
    in [Markdown](https://daringfireball.net/projects/markdown/).
    """
    reason: String = "No longer supported"
) on FIELD_DEFINITION
```

## @field

将解析器功能分配给一个字段。

将类和方法传递给 `resolver` 参数，并用 `@` 符号将它们分开。
如果仅传递类名，则方法名称默认为 `__invoke` 。

```graphql
type Mutation {
    createPost(title: String!): Post
        @field(resolver: "App\\GraphQL\\Mutations\\PostMutator@create")
}
```

### 定义（Definition）

```graphql
"""
Assign a resolver function to a field.
"""
directive @field(
    """
    A reference to the resolver function to be used.
    Consists of two parts: a class name and a method name, seperated by an `@` symbol.
    If you pass only a class name, the method name defaults to `__invoke`.
    """
    resolver: String!

    """
    Supply additional data to the resolver.
    """
    args: [String!]
) on FIELD_DEFINITION
```

### 例子（Examples）

如果您的字段是在根类型 `Query` 或 `Mutation` 上定义的，则可以利用 [配置](../getting-started/configuration.md) 中定义的默认名称空间。
下面将默认在 `App\GraphQL\Queries` 中查找一个类。

```graphql
type Query {
    usersTotal: Int @field(resolver: "Statistics@usersTotal")
}
```

请注意，解析程序不限于 root fields 。
解析器（resolver）可用于基本任务，例如转换标量字段的值，例如重新格式化日期。

```graphql
type User {
    created_at: String!
        @field(resolver: "App\\GraphQL\\Types\\UserType@created_at")
}
```

## @find

根据所提供的参数找到一个模型。

```graphql
type Query {
    userById(id: ID! @eq): User @find
}
```

### 定义（Definition）

```graphql
"""
Find a model based on the arguments provided.
"""
directive @find(
    """
    Specify the class name of the model to use.
    This is only needed when the default model detection does not work.
    """
    model: String

    """
    Apply scopes to the underlying query.
    """
    scopes: [String!]
) on FIELD_DEFINITION
```

### 例子（Examples）

当返回多个结果时抛出。如果不能确保，请使用 [@first](#first)。

如果您的模型不在默认名称空间中，您可以覆盖它。

```graphql
type Query {
    userById(id: ID! @eq): User @find(model: "App\\Authentication\\User")
}
```

## @first

从一个 Eloquent 模型集合中获得第一个查询结果。

```graphql
type Query {
    userByFirstName(first_name: String! @eq): User @first
}
```

### 定义（Definition）

```graphql
"""
Get the first query result from a collection of Eloquent models.
"""
directive @first(
    """
    Specify the class name of the model to use.
    This is only needed when the default model detection does not work.
    """
    model: String

    """
    Apply scopes to the underlying query.
    """
    scopes: [String!]
) on FIELD_DEFINITION
```

### 例子（Examples）

除了 [@find](#find) 之外，如果集合中有多个项目，则不会抛出错误。

如果您的模型不在默认名称空间中，您可以覆盖它。

```graphql
type Query {
    userByFirstName(first_name: String! @eq): User
        @first(model: "App\\Authentication\\User")
}
```

## @forceDelete

```graphql
"""
Permanently remove one or more soft deleted models by their ID.
The field must have a single non-null argument that may be a list.
"""
directive @forceDelete(
    """
    Set to `true` to use global ids for finding the model.
    If set to `false`, regular non-global ids are used.
    """
    globalId: Boolean = false

    """
    Specify the class name of the model to use.
    This is only needed when the default model detection does not work.
    """
    model: String
) on FIELD_DEFINITION
```

在返回模型实例的 root mutation 字段上使用它。

```graphql
type Mutation {
    forceDeletePost(id: ID!): Post @forceDelete
}
```

工作原理与 [`@delete`](#delete) 指令非常相似。

## @enum

```graphql
"""
Assign an internal value to an enum key.
When dealing with the Enum type in your code,
you will receive the defined value instead of the string key.
"""
directive @enum(
    """
    The internal value of the enum key.
    You can use any constant literal value: https://graphql.github.io/graphql-spec/draft/#sec-Input-Values
    """
    value: Mixed
) on ENUM_VALUE
```

```graphql
enum Role {
    ADMIN @enum(value: 1)
    EMPLOYEE @enum(value: 2)
}
```

如果每个 enum 键的内部值是相同的字符串，则不需要此指令。[阅读更多关于枚举类型的信息](../the-basics/types.md#enum)

## @eq

在一个 Eloquent 查询上放置一个 equal 操作符。

```graphql
type User {
    posts(category: String @eq): [Post!]! @hasMany
}
```

### 定义（Definition）

```graphql
directive @eq(
    """
        Specify the database column to compare.
    Specify the database column to compare.
        Specify the database column to compare.
      Specify the database column to compare.
        Specify the database column to compare.
      Specify the database column to compare.
        Specify the database column to compare.
        Only required if database column has a different name than the attribute in your schema.
    """
    key: String
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

### 例子（Examples）

如果参数的名称与数据库列不匹配，则传递实际的列名作为 `key`。

```graphql
type User {
    posts(category: String @eq(key: "cat")): [Post!]! @hasMany
}
```

## @event

触发 mutation 后发生的事件。它需要 `dispatch` 参数，该参数应该是您想要触发的事件的类名。

```graphql
type Mutation {
    createPost(title: String!, content: String!): Post
        @event(dispatch: "App\\Events\\PostCreated")
}
```

### 定义（Definition）

```graphql
"""
Fire an event after a mutation has taken place.
It requires the `dispatch` argument that should be
the class name of the event you want to fire.
"""
directive @event(
    """
    Specify the fully qualified class name (FQCN) of the event to dispatch.
    """
    dispatch: String!
) on FIELD_DEFINITION
```

## @globalId

在 IDs/types 和 global IDs 之间进行转换。

```graphql
type User {
    id: ID! @globalId
    name: String
}
```

`id` 字段现在将返回一个 base64 编码的字符串，用于全局标识用户，并可用于查询 `node` 端点，而不是原始 ID

### 定义（Definition）

```graphql
"""
Converts between IDs/types and global IDs.
When used upon a field, it encodes,
when used upon an argument, it decodes.
"""
directive @globalId(
    """
    By default, an array of `[$type, $id]` is returned when decoding.
    You may limit this to returning just one of both.
    Allowed values: "ARRAY", "TYPE", "ID"
    """
    decode: String = "ARRAY"
) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
```

### 例子（Examples）

```graphql
type Mutation {
    deleteNode(id: ID @globalId): Node
}
```

字段解析器将接收传递的 `id` 的解码版本，分为类型和 ID 。

您可以重新绑定 `\Nuwave\Lighthouse\Support\Contracts\GlobalId` 接口，以添加您自己的 编码/解码 global ids 的机制。

## @guard

```graphql
"""
Run authentication through one or more guards.
This is run per field and may allow unauthenticated
users to still receive partial results.
"""
directive @guard(
    """
    Specify which guards to use, e.g. "api".
    When not defined, the default driver is used.
    """
    with: [String!]
) on FIELD_DEFINITION | OBJECT
```

## @hash

```graphql
"""
Use Laravel hashing to transform an argument value.

Useful for hashing passwords before inserting them into the database.
This uses the default hashing driver defined in `config/hashing.php`.
"""
directive @hash on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

最常见的用例是在处理密码：

```graphql
type Mutation {
    createUser(name: String!, password: String! @hash): User!
}
```

## @hasMany

对应的 [Eloquent 关系有很多。](https://laravel.com/docs/eloquent-relationships#one-to-many)

```graphql
type User {
    posts: [Post!]! @hasMany
}
```

### 定义（Definition）

```graphql
"""
Corresponds to [the Eloquent relationship HasMany](https://laravel.com/docs/eloquent-relationships#one-to-many).
"""
directive @hasMany(
    """
    Specify the relationship method name in the model class,
    if it is named different from the field in the schema.
    """
    relation: String

    """
    Apply scopes to the underlying query.
    """
    scopes: [String!]

    """
    ALlows to resolve the relation as a paginated list.
    Allowed values: `paginator`, `connection`.
    """
    type: String

    """
    Specify the default quantity of elements to be returned.
    Only applies when using pagination.
    """
    defaultCount: Int

    """
    Specify the maximum quantity of elements to be returned.
    Only applies when using pagination.
    """
    maxCount: Int
) on FIELD_DEFINITION
```

### 例子（Examples）

您可以通过设置 `type` 返回分页的相关模型。

```graphql
type User {
    postsPaginated: [Post!]! @hasMany(type: "paginator")
    postsRelayConnection: [Post!]! @hasMany(type: "connection")
}
```

如果 Eloquent 模型上的关系名称与字段名称不同，您可以通过设置 `relation` 来覆盖它。

```graphql
type User {
    posts: [Post!]! @hasMany(relation: "articles")
}
```

## @hasOne

对应于 [Eloquent's 的拥有关系](https://laravel.com/docs/eloquent-relationships#one-to-one)。

```graphql
type User {
    phone: Phone @hasOne
}
```

### 定义（Definition）

```graphql
"""
Corresponds to [the Eloquent relationship HasOne](https://laravel.com/docs/eloquent-relationships#one-to-one).
"""
directive @hasOne(
    """
    Specify the relationship method name in the model class,
    if it is named different from the field in the schema.
    """
    relation: String

    """
    Apply scopes to the underlying query.
    """
    scopes: [String!]
) on FIELD_DEFINITION
```

### 例子（Examples）

如果 Eloquent 模型上的关系名称与字段名称不同，您可以通过设置 `relation` 来覆盖它。

```graphql
type User {
    phone: Phone @hasOne(relation: "telephone")
}
```

## @in

使用 `whereIn` 子句按数组过滤列。

```graphql
type Query {
    posts(includeIds: [Int!] @in(key: "id")): [Post!]! @paginate
}
```

### 定义（Definition）

```graphql
directive @in(
    """
        Specify the database column to compare.
    Specify the database column to compare.
        Specify the database column to compare.
      Specify the database column to compare.
        Specify the database column to compare.
      Specify the database column to compare.
        Specify the database column to compare.
        Only required if database column has a different name than the attribute in your schema.
    """
    key: String
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

## @include

该指令是 [GraphQL 规范](https://graphql.github.io/graphql-spec/June2018/#sec--include)的一部分，应注意，该指令是客户端，不应包含在您的架构中。

如果传递给该指令的值为 true ，则仅在响应中包含一个字段。
该指令是 GraphQL 规范中的核心指令之一。

```graphql
directive @include(
    """
    If the "if" value is true the field this is connected with will be included in the query response.
    Otherwise it will not.
    """
    if: Boolean
) on FIELD | FRAGMENT_SPREAD | INLINE_FRAGMENT
```

### 例子（Examples）

可以为字段，片段扩展和内联片段提供 `@include` 指令，并允许在执行过程中按条件包含（如 if 参数所述）。

在此示例中，仅当变量 \$someTest 的值为 true 时，才会查询 experimentalField

```graphql
query myQuery($someTest: Boolean) {
    experimentalField @include(if: $someTest)
}
```

## @inject

将上下文对象中的值注入到参数中。

```graphql
type Mutation {
    createPost(title: String!, content: String!): Post
        @create
        @inject(context: "user.id", name: "user_id")
}
```

这对于确保自动将经过身份验证的用户的 `id` 用于创建新模型并且不会对其进行操作非常有用。

### 定义（Definition）

```graphql
directive @inject(
    """
    A path to the property of the context that will be injected.
    If the value is nested within the context, you may use dot notation
    to get it, e.g. "user.id".
    """
    context: String!

    """
    The target name of the argument into which the value is injected.
    You can use dot notation to set the value at arbitrary depth
    within the incoming argument.
    """
    name: String!
) on FIELD_DEFINITION
```

### 例子（Examples）

如果将输入对象用作参数，则可以使用点表示法设置嵌套参数。

```graphql
type Mutation {
    createTask(input: CreateTaskInput!): Task
        @create
        @inject(context: "user.id", name: "input.user_id")
}
```

## @interface

使用自定义解析器确定接口的具体类型。

在决定使用此指令之前，请确保已阅读 [有关接口的基础知识](../the-basics/types.md#interface) ，您可能不需要它。

将 `resolveType` 参数设置为一个返回实现对象类型的函数。

```graphql
interface Commentable
    @interface(
        resolveType: "App\\GraphQL\\Interfaces\\Commentable@resolveType"
    ) {
    id: ID!
}
```

该函数将父字段的值作为其单个参数接收，并且必须返回对象类型。
您可以从 Lighthouse 的类型注册表中获取适当的对象类型。

```php
<?php

namespace App\GraphQL\Interfaces;

use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Schema\TypeRegistry;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

class Commentable
{
    /**
     * @var \Nuwave\Lighthouse\Schema\TypeRegistry
     */
    protected $typeRegistry;

    /**
     * @param  \Nuwave\Lighthouse\Schema\TypeRegistry  $typeRegistry
     * @return void
     */
    public function __construct(TypeRegistry $typeRegistry)
    {
        $this->typeRegistry = $typeRegistry;
    }

    /**
     * Decide which GraphQL type a resolved value has.
     *
     * @param  mixed  $rootValue  The value that was resolved by the field. Usually an Eloquent model.
     * @param  \Nuwave\Lighthouse\Support\Contracts\GraphQLContext  $context
     * @param  \GraphQL\Type\Definition\ResolveInfo  $resolveInfo
     * @return \GraphQL\Type\Definition\Type
     */
    public function resolveType($rootValue, GraphQLContext $context, ResolveInfo $resolveInfo): Type
    {
        // Default to getting a type with the same name as the passed in root value
        // TODO implement your own resolver logic - if the default is fine, just delete this class
        return $this->typeRegistry->get(class_basename($rootValue));
    }
}
```

### 定义（Definition）

```graphql
"""
Use a custom resolver to determine the concrete type of an interface.
"""
directive @interface(
    """
    Reference to a custom type-resolver function.
    Consists of two parts: a class name and a method name, seperated by an `@` symbol.
    If you pass only a class name, the method name defaults to `__invoke`.
    """
    resolveType: String!
) on INTERFACE
```

## @lazyLoad

```graphql
"""
Perform a [lazy eager load](https://laravel.com/docs/eloquent-relationships#lazy-eager-loading)
on the relations of a list of models.
"""
directive @lazyLoad(
    """
    The names of the relationship methods to load.
    """
    relations: [String!]!
) on FIELD_DEFINITION
```

当使用 [`@hasMany`](#hasmany) 指令加载关系时，这通常很有用。

```graphql
type Post {
    comments: [Comment!]! @hasMany @lazyLoad(relations: ["replies"])
}
```

## @method

```graphql
"""
Resolve a field by calling a method on the parent object.

Use this if the data is not accessible through simple property access or if you
want to pass argument to the method.
"""
directive @method(
    """
    Specify the method of which to fetch the data from.
    Defaults to the name of the field if not given.
    """
    name: String

    """
    Pass the field arguments to the method, using the argument definition
    order from the schema to sort them before passing them along.

    @deprecated This behaviour will default to true in v5 and this setting will be removed.
    """
    passOrdered: Boolean = false
) on FIELD_DEFINITION
```

这对于具有 getter 的模型或其他类可能很有用：

```graphql
type User {
    mySpecialData: String! @method(name: "getMySpecialData")
}
```

这将使用 [典型的解析程序参数](resolvers.md#resolver-function-signature) 调用方法 `App\User::getMySpecialData` 。
如果只想按顺序传递参数，请使用 `passOrdered` 选项：

```graphql
type User {
    purchasedItemsCount(year: Int!, includeReturns: Boolean): Int
        @method(passOrdered: true)
}
```

这将调用带有客户端传递给该字段的参数的方法。
确保参数定义的顺序与您的方法的参数匹配。

```php
public function purchasedItemsCount(int $year, ?bool $includeReturns)
```

Lighthouse 将始终传递相同数量的参数，如果客户端未传递任何参数，则默认为 `null` 。

```graphql
{
    user(id: 3) {
        purchasedItemsCount(year: 2017)
    }
}
```

该方法将像这样被调用：

```php
$user->purchasedItemsCount(2017, null)
```

## @middleware

**DEPRECATED**
用 [`@guard`](#guard) 或自定义 [`FieldMiddleware`](../custom-directives/field-directives.md#fieldmiddleware) 代替。

```graphql
"""
Run Laravel middleware for a specific field or group of fields.
This can be handy to reuse existing HTTP middleware.
"""
directive @middleware(
    """
        Specify which middleware to run.
    Specify which middleware to run.
        Specify which middleware to run.
      Specify which middleware to run.
        Specify which middleware to run.
      Specify which middleware to run.
        Specify which middleware to run.
        Pass in either a fully qualified class name, an alias or
        a middleware group - or any combination of them.
    """
    checks: [String!]
) on FIELD_DEFINITION | OBJECT
```

您可以像在 Laravel 中一样定义中间件。
传递完全限定的类名，别名或中间件组-或它们的任意组合。

```graphql
type Query {
    users: [User!]!
        @middleware(
            checks: ["auth:api", "App\\Http\\Middleware\\MyCustomAuth", "api"]
        )
        @all
}
```

如果需要将中间件应用于一组字段，则可以将 [@middleware](../api-reference/directives.md#middleware) 放在对象类型上。
中间件仅适用于类型定义的直接子字段。

```graphql
type Query @middleware(checks: ["auth:api"]) {
    # This field will use the "auth:api" middleware
    users: [User!]! @all
}

extend type Query {
    # This field will not use any middleware
    posts: [Post!]! @all
}
```

除了在 [配置](../getting-started/configuration.md) 中定义的全局中间件以外，字段中间件仅适用于在其上定义的特定字段。
这样的好处是将错误限制在特定字段上，并且如果中间件发生故障，则不会使整个请求失败。

但是，对现场中间件有一些警告：

-   请求对象在字段之间共享。
    如果一个字段的中间件修改了请求，则这确实会影响其他字段。
-   当调用 `$next($request)` 时，它们没有收到完整的 Response 对象，而是特定字段返回的数据片段。
-   不调用字段中间件的 `terminate` 方法。

如果中间件需要了解 GraphQL 的详细信息（例如，解析器参数），
通常更适合定义自定义字段指令。

## @model

```graphql
"""
Enable fetching an Eloquent model by its global id through the `node` query.

@deprecated(reason: "Use @node instead. This directive will be repurposed and do what @modelClass does now in v5.")
"""
directive @model on OBJECT
```

**Deprecated** 用 [`@node`](#node) 作为中继全局对象标识。

## @modelClass

```graphql
"""
Map a model class to an object type.
This can be used when the name of the model differs from the name of the type.

**This directive will be renamed to @model in v5.**
"""
directive @modelClass(
    """
    The class name of the corresponding model.
    """
    class: String!
) on OBJECT
```

**Attention** 该指令将在 v5 中重命名为 `@model` 。

Lighthouse 将在其指令中遵守被覆盖的模型名称。

```graphql
type Post @modelClass(class: "\\App\\BlogPost") {
    title: String!
}
```

## @morphMany

对应于 [Eloquent 的 MorphMany 关系](https://laravel.com/docs/5.8/eloquent-relationships#one-to-many-polymorphic-relations)。

```graphql
type Post {
    images: [Image!] @morphMany
}

type Image {
    imagable: Imageable! @morphTo
}

union Imageable = Post | User
```

### 定义（Definition）

```graphql
"""
Corresponds to [Eloquent's MorphMany-Relationship](https://laravel.com/docs/5.8/eloquent-relationships#one-to-one-polymorphic-relations).
"""
directive @morphMany(
    """
    Specify the relationship method name in the model class,
    if it is named different from the field in the schema.
    """
    relation: String

    """
    Apply scopes to the underlying query.
    """
    scopes: [String!]

    """
    ALlows to resolve the relation as a paginated list.
    Allowed values: `paginator`, `connection`.
    """
    type: String

    """
    Specify the default quantity of elements to be returned.
    Only applies when using pagination.
    """
    defaultCount: Int

    """
    Specify the maximum quantity of elements to be returned.
    Only applies when using pagination.
    """
    maxCount: Int

    """
    Specify a custom type that implements the Edge interface
    to extend edge object.
    Only applies when using Relay style "connection" pagination.
    """
    edgeType: String
) on FIELD_DEFINITION
```

## @morphOne

对应于 [Eloquent 的 MorphMany 关系](https://laravel.com/docs/5.8/eloquent-relationships#one-to-many-polymorphic-relations)。

```graphql
type Post {
    image: Image! @morphOne
}

type Image {
    imagable: Imageable! @morphTo
}

union Imageable = Post | User
```

### 定义（Definition）

```graphql
"""
Corresponds to [Eloquent's MorphOne-Relationship](https://laravel.com/docs/5.8/eloquent-relationships#one-to-one-polymorphic-relations).
"""
directive @morphOne(
    """
    Specify the relationship method name in the model class,
    if it is named different from the field in the schema.
    """
    relation: String

    """
    Apply scopes to the underlying query.
    """
    scopes: [String!]
) on FIELD_DEFINITION
```

## @morphTo

对应于 [Eloquent 的 MorphMany 关系](https://laravel.com/docs/5.8/eloquent-relationships#one-to-many-polymorphic-relations)。

```graphql
type Image {
    imagable: Imageable! @morphTo
}

union Imageable = Post | User
```

### 定义（Definition）

```graphql
"""
Corresponds to [Eloquent's MorphTo-Relationship](https://laravel.com/docs/5.8/eloquent-relationships#one-to-one-polymorphic-relations).
"""
directive @morphTo(
    """
    Specify the relationship method name in the model class,
    if it is named different from the field in the schema.
    """
    relation: String

    """
    Apply scopes to the underlying query.
    """
    scopes: [String!]
) on FIELD_DEFINITION
```

## @namespace

重新定义其他指令中使用的默认名称空间。

以下示例将名称空间 `App\Blog` 应用于 `posts` 字段上使用的 `@field` 指令。

```graphql
type Query {
    posts: [Post!]!
        @field(resolver: "Post@resolveAll")
        @namespace(field: "App\\Blog")
}
```

### 定义（Definition）

```graphql
"""
Redefine the default namespaces used in other directives.
The arguments are a map from directive names to namespaces.
"""
directive @namespace on FIELD_DEFINITION | OBJECT
```

### 例子（Examples）

当在对象类型或对象类型扩展上使用时，名称空间也适用于该类型的字段。
这使您可以为一组字段指定通用名称空间。

```graphql
extend type Query @namespace(field: "App\\Blog") {
    posts: [Post!]! @field(resolver: "Post@resolveAll")
}
```

如果发生冲突，则在字段指令上定义的 `@namespace` 指令将获胜。

## @neq

在 Eloquent 的查询上放置一个不等于运算符 `!=` 。

```graphql
type User {
    posts(excludeCategory: String @neq(key: "category")): [Post!]! @hasMany
}
```

### 定义（Definition）

```graphql
"""
Place a not equals operator `!=` on an Eloquent query.
"""
directive @neq(
    """
        Specify the database column to compare.
    Specify the database column to compare.
        Specify the database column to compare.
      Specify the database column to compare.
        Specify the database column to compare.
      Specify the database column to compare.
        Specify the database column to compare.
        Only required if database column has a different name than the attribute in your schema.
      Only required if database column has a different name than the attribute in your schema.
        Only required if database column has a different name than the attribute in your schema.
      Only required if database column has a different name than the attribute in your schema.
        Only required if database column has a different name than the attribute in your schema.
    Only required if database column has a different name than the attribute in your schema.
        Only required if database column has a different name than the attribute in your schema.
    """
    key: String
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

## @nest

```graphql
"""
A no-op nested arg resolver that delegates all calls
to the ArgResolver directives attached to the children.
"""
directive @nest on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

这在逻辑上将参数解析程序分组可能很有用。

```graphql
type Mutation {
    createUser(name: String, tasks: UserTasksOperations @nest): User @create
}

input UserTasksOperations {
    newTask: CreateTaskInput @create(relation: "tasks")
}

input CreateTaskInput {
    name: String
}

type Task {
    name: String!
}

type User {
    name: String
    tasks: [Task!]! @hasMany
}
```

## @node

```graphql
"""
Register a type for Relay's global object identification.
When used without any arguments, Lighthouse will attempt
to resolve the type through a model with the same name.
"""
directive @node(
    """
    Reference to a function that receives the decoded `id` and returns a result.
    Consists of two parts: a class name and a method name, seperated by an `@` symbol.
    If you pass only a class name, the method name defaults to `__invoke`.
    """
    resolver: String

    """
    Specify the class name of the model to use.
    This is only needed when the default model detection does not work.
    """
    model: String
) on FIELD_DEFINITION
```

Lighthouse 默认通过基础模型来解析类型，例如，通过调用 `User::find($id)` 。

```graphql
type User @node {
    id: ID! @globalId
}
```

您还可以使用自定义解析器功能来解析任何类型的数据。

```graphql
type Country @node(resolver: "App\\Countries@byId") {
    name: String!
}
```

`resolver` 参数必须指定一个函数，该函数将传递经过解码的 `id` 并解析为结果。

```php
public function byId($id): array {
    return [
        'DE' => ['name' => 'Germany'],
        'MY' => ['name' => 'Malaysia'],
    ][$id];
}
```

[阅读更多](../digging-deeper/relay.md#global-object-identification).

### 定义（Definition）

在后台，Lighthouse 将解码客户端发送的 global id 通过数据库中的主要 ID 查找模型。

## @notIn

使用 `whereNotIn` 子句按数组过滤列。

```graphql
type Query {
    posts(excludeIds: [Int!] @notIn(key: "id")): [Post!]! @paginate
}
```

### 定义（Definition）

```graphql
"""
Filter a column by an array using a `whereNotIn` clause.
"""
directive @notIn(
    """
    Specify the name of the column.
    Only required if it differs from the name of the argument.
    """
    key: String
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

## @orderBy

```graphql
"""
Sort a result list by one or more given columns.
"""
directive @orderBy(
    """
    Restrict the allowed column names to a well-defined list.
    This improves introspection capabilities and security.
    If not given, the column names can be passed as a String by clients.
    Mutually exclusive with the `columnsEnum` argument.
    """
    columns: [String!]

    """
    Use an existing enumeration type to restrict the allowed columns to a predefined list.
    This allowes you to re-use the same enum for multiple fields.
    Mutually exclusive with the `columns` argument.
    """
    columnsEnum: String
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

在口才查询的字段参数上使用它。
参数的类型可以保留为 `_` ，因为它将自动生成。

```graphql
type Query {
    posts(orderBy: _ @orderBy(columns: ["posted_at", "title"])): [Post!]! @all
}
```

Lighthouse 将自动生成一个包含枚举列名和 `SortOrder` 枚举的输入，并将其添加到您的模式中。
外观如下：

```graphql
"Allows ordering a list of records."
input PostsOrderByOrderByClause {
    "The column that is used for ordering."
    column: PostsOrderByColumn!

    "The direction that is used for ordering."
    order: SortOrder!
}

"Order by clause for the `orderBy` argument on the query `posts`."
enum PostsOrderByColumn {
    POSTED_AT @enum(value: "posted_at")
    TITLE @enum(value: "title")
}

"The available directions for ordering a list of records."
enum SortOrder {
    "Sort records in ascending order."
    ASC

    "Sort records in descending order."
    DESC
}
```

如果要重新使用允许的列的列表，则可以定义自己的枚举类型，并使用 `columnsEnum` 参数而不是 `columns` 。
这是如何在架构中定义它的示例：

```graphql
type Query {
    allPosts(orderBy: _ @orderBy(columnsEnum: "PostColumn")): [Post!]! @all
    paginatedPosts(orderBy: _ @orderBy(columnsEnum: "PostColumn")): [Post!]!
        @paginate
}

"A custom description for this custom enum."
enum PostColumn {
    # Another reason why you might want to have a custom enum is to
    # correct typos or bad naming in column names.
    POSTED_AT @enum(value: "postd_timestamp")
    TITLE @enum(value: "title")
}
```

Lighthouse 将仍然自动生成必要的输入类型和 `SortOrder` 枚举。
但是，与其为允许的列生成枚举，不如使用现有的 `PostColumn` 枚举。

查询具有 `orderBy` 参数的字段如下所示：

```graphql
{
    posts(orderBy: [{ column: POSTED_AT, order: ASC }]) {
        title
    }
}
```

您可以传递多个排序选项来添加次级排序。

### 输入定义示例

当与[`@spread`](#spread) 指令结合使用时， `@orderBy` 指令也可以在输入字段定义中应用。
参见以下示例：

```graphql
type Query {
    posts(filter: PostFilterInput @spread): Posts
}

input PostFilterInput {
    orderBy: [OrderByClause!] @orderBy
}
```

和用法示例：

```graphql
{
    posts(filter: { orderBy: [{ field: "postedAt", order: ASC }] }) {
        title
    }
}
```

## @paginate

```graphql
"""
Query multiple model entries as a paginated list.
"""
directive @paginate(
    """
    Which pagination style to use.
    Allowed values: `paginator`, `connection`.
    """
    type: String = "paginator"

    """
    Specify the class name of the model to use.
    This is only needed when the default model detection does not work.
    """
    model: String

    """
    Point to a function that provides a Query Builder instance.
    This replaces the use of a model.
    """
    builder: String

    """
    Apply scopes to the underlying query.
    """
    scopes: [String!]

    """
    Overwrite the paginate_max_count setting value to limit the
    amount of items that a user can request per page.
    """
    maxCount: Int

    """
    Use a default value for the amount of returned items
    in case the client does not request it explicitly
    """
    defaultCount: Int
) on FIELD_DEFINITION
```

### 基本用法

该指令旨在用于 root query 字段：

```graphql
type Query {
    posts: [Post!]! @paginate
}
```

> 当您想分页关系时，请使用多对多关系指令，
> 例如 [`@hasMany`](directives.md#hasmany) 。

模式定义将自动转换为以下形式：

```graphql
type Query {
    posts(first: Int!, page: Int): PostPaginator
}

"A paginated list of Post items."
type PostPaginator {
    "A list of Post items."
    data: [Post!]!

    "Pagination information about the list of items."
    paginatorInfo: PaginatorInfo!
}
```

可以这样查询：

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

### 分页类型

分页 `type` 默认为 `paginator` ，但也可以设置为中继兼容 `connection` 。

> 到目前为止，Lighthouse 不支持实际的基于光标的分页，有关详细信息，请参见 https://github.com/nuwave/lighthouse/issues/311 。
> 在下面， "cursor" 被解码为页面偏移量

```graphql
type Query {
    posts: [Post!]! @paginate(type: "connection")
}
```

最终的模式将转换为此：

```graphql
type Query {
    posts(first: Int!, page: Int): PostConnection
}

"A paginated list of Post edges."
type PostConnection {
    "Pagination information about the list of edges."
    pageInfo: PageInfo!

    "A list of Post edges."
    edges: [PostEdge]
}

"An edge that contains a node of type Post and a cursor."
type PostEdge {
    "The Post node."
    node: Post

    "A unique cursor that can be used for pagination."
    cursor: String!
}
```

### 默认计数

您可以提供 `defaultCount` 来设置任何类型的分页器的默认计数。

```graphql
type Query {
    posts: [Post!]! @paginate(type: "connection", defaultCount: 25)
}
```

这让您在查询时省略 `count` 参数：

```graphql
query {
    posts {
        id
        name
    }
}
```

### 限制最大数量

Lighthouse 允许您为用户可以通过配置分页请求的项目总数指定全局最大值。
您还可以使用 `maxCount` 参数覆盖每个字段的内容：

```graphql
type Query {
    posts: [Post!]! @paginate(maxCount: 10)
}
```

### 覆盖模型

默认情况下，Lighthouse 在已配置的默认名称空间中查找与返回类型同名的 Eloquent 模型。
您可以通过设置 `model` 参数来覆盖它。

```graphql
type Query {
    posts: [Post!]! @paginate(model: "App\\Blog\\BlogPost")
}
```

### 自定义 builder

如果仅查询 Eloquent 不适合您的用例，则可以指定一个自定义 `builder`。

```graphql
type Query {
    posts: [Post!]! @paginate(builder: "App\\Blog@visiblePosts")
}
```

您的方法收到典型的解析程序参数，并且必须返回的实例 `Illuminate\Database\Query\Builder`。

```php
<?php

namespace App;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Query\Builder;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

class Blog
{
    public function visiblePosts($root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo): Builder
    {
        return DB::table('posts')
            ->where('visible', true)
            ->where('posted_at', '>', $args['after']);
    }
}
```

## @rename

```graphql
"""
Change the internally used name of a field or argument.
This does not change the schema from a client perspective.
"""
directive @rename(
    """
    The internal name of an attribute/property/key.
    """
    attribute: String!
) on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

这通常可用于确保架构的命名一致，而不必更改基础模型。

```graphql
type User {
    createdAt: String! @rename(attribute: "created_at")
}

input UserInput {
    firstName: String! @rename(attribute: "first_name")
}
```

## @restore

```graphql
"""
Un-delete one or more soft deleted models by their ID.
The field must have a single non-null argument that may be a list.
"""
directive @restore(
    """
    Set to `true` to use global ids for finding the model.
    If set to `false`, regular non-global ids are used.
    """
    globalId: Boolean = false

    """
    Specify the class name of the model to use.
    This is only needed when the default model detection does not work.
    """
    model: String
) on FIELD_DEFINITION
```

在返回模型实例的 root mutation 字段上使用它。

```graphql
type Mutation {
    restorePost(id: ID!): Post @restore
}
```

工作原理与 [`@delete`](#delete) 指令非常相似。

## @rules

```graphql
"""
Validate an argument using [Laravel validation](https://laravel.com/docs/validation).
"""
directive @rules(
    """
    Specify the validation rules to apply to the field.
    This can either be a reference to [Laravel's built-in validation rules](https://laravel.com/docs/validation#available-validation-rules),
    or the fully qualified class name of a custom validation rule.

    Rules that mutate the incoming arguments, such as `exclude_if`, are not supported
    by Lighthouse. Use ArgTransformerDirectives or FieldMiddlewareDirectives instead.
    """
    apply: [String!]!

    """
    Specify the messages to return if the validators fail.
    Specified as an input object that maps rules to messages,
    e.g. { email: "Must be a valid email", max: "The input was too long" }
    """
    messages: [RulesMessageMap!]
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

例如，此规则确保用户传递有效的 2 个字符的 国家/地区 代码：

```graphql
type Query {
    users(countryCode: String @rules(apply: ["string", "size:2"])): [User!]!
        @all
}
```

在 [validation 文档](../security/validation.md#validating-arrays) 中了解更多信息。

## @rulesForArray

使用 [Laravel 内置验证](https://laravel.com/docs/validation) 对数组本身运行验证。

```graphql
type Mutation {
    saveIcecream(
        flavors: [IcecreamFlavor!]! @rulesForArray(apply: ["min:3"])
    ): Icecream
}
```

在 [validation 文档](../security/validation.md#validating-arrays) 中了解更多信息。

### 定义（Definition）

```graphql
"""
Run validation on an array itself, using [Laravel built-in validation](https://laravel.com/docs/validation).
"""
directive @rulesForArray(
    """
    Specify the validation rules to apply to the field.
    This can either be a reference to any of Laravel's built-in validation rules: https://laravel.com/docs/validation#available-validation-rules,
    or the fully qualified class name of a custom validation rule.
    """
    apply: [String!]!

    """
    Specify the messages to return if the validators fail.
    Specified as an input object that maps rules to messages,
    e.g. { email: "Must be a valid email", max: "The input was too long" }
    """
    messages: [RulesMessageMap!]
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

## @scalar

引用实现标量定义的类。
[了解如何实现自己的标量](http://webonyx.github.io/graphql-php/type-system/scalar-types/)。

```graphql
scalar DateTime @scalar(class: "DateTimeScalar")
```

如果遵循命名空间约定，则不需要此指令。
Lighthouse 将在您配置的标量名称空间中查找具有相同名称的类。

### 定义（Definition）

```graphql
"""
Reference a class implementing a scalar definition.
"""
directive @scalar(
    """
    Reference to a class that extends `\GraphQL\Type\Definition\ScalarType`.
    """
    class: String!
) on SCALAR
```

### 例子（Examples）

如果您的类不在默认名称空间中，请传递完全限定的类名称。

```graphql
scalar DateTime
    @scalar(class: "Nuwave\\Lighthouse\\Schema\\Types\\Scalars\\DateTime")
```

## @scope

```graphql
"""
Adds a scope to the query builder.
The scope method will receive the client-given value of the argument as the second parameter.
"""
directive @scope(
    """
    The name of the scope.
    """
    name: String
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

您可以将其与 [`@all`](#all) 等字段指令结合使用。

```graphql
type Query {
    posts(trending: Boolean @scope(name: "trending")): [Post!]! @all
}
```

## @search

根据给定的输入值执行全文。

```graphql
type Query {
    posts(search: String @search): [Post!]! @paginate
}
```

使用为 [Laravel Scout](https://laravel.com/docs/master/scout) 配置的驱动程序，使用参数的值调用模型的 `search()` 方法。

将 `@search` 指令与其他会影响数据库查询的指令结合使用时，请务必小心。
常用的查询生成器 `Eloquent\Builder` 将被 `Scout\Builder` 替换，后者不支持相同的方法和操作。
常规过滤器（例如， [`@eq`](#eq) 或 [`@in`](#in) ）仍然有效，但作用域无效。

### 定义（Definition）

```graphql
"""
Perform a full-text by the given input value.
"""
directive @search(
    """
    Specify a custom index to use for search.
    """
    within: String
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

### 例子（Examples）

通常，将使用模型的 `searchableAs` 方法指定的索引来执行搜索。
但是，在某些情况下，可能需要自定义索引，这可以通过使用 `within` 参数来实现。

```graphql
type Query {
    posts(search: String @search(within: "my.index")): [Post!]! @paginate
}
```

## @skip

该指令是 [GraphQL 规范](https://graphql.github.io/graphql-spec/June2018/#sec--include)的一部分，应注意，该指令是客户端指令，不应包含在您的架构中。

### 定义（Definition）

```graphql
directive @skip(
    """
    If the value passed into the if field is true the field this
    is decorating will not be included in the query response.
    """
    if: Boolean!
) on FIELD | FRAGMENT_SPREAD | INLINE_FRAGMENT
```

### 例子（Examples）

可以为字段，片段扩展和内联片段提供 `@skip` 指令，并允许在执行过程中进行条件排除，如 if 参数所述。

在此示例中，仅当变量 \$someTest 的值为 false 时，才会查询 ExperimentField 。

```graphql
query myQuery($someTest: Boolean) {
    experimentalField @skip(if: $someTest)
}
```

## @softDeletes

```graphql
"""
Allows to filter if trashed elements should be fetched.
This manipulates the schema by adding the argument
`trashed: Trashed @trashed` to the field.
"""
directive @softDeletes on FIELD_DEFINITION
```

`.graphql` 文件中的以下架构定义：

```graphql
type Query {
    tasks: [Tasks!]! @all @softDeletes
}
```

将产生一个如下所示的架构：

```graphql
type Query {
    tasks(trashed: Trashed @trashed): [Tasks!]! @all
}
```

了解添加的过滤器的工作原理：[`@trashed`](#trashed)

## @spread

```graphql
"""
Merge the fields of a nested input object into the arguments of its parent
when processing the field arguments given by a client.
"""
directive @spread on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

您可以在字段参数或输入对象字段上使用 `@spread` ：

```graphql
type Mutation {
    updatePost(id: ID!, input: PostInput! @spread): Post @update
}

input PostInput {
    title: String!
    content: PostContent @spread
}

input PostContent {
    imageUrl: String
}
```

模式不会更改，客户端使用情况就像 `@spread` 不在一样：

```graphql
mutation {
    updatePost(
        id: 12
        input: {
            title: "My awesome title"
            content: { imageUrl: "http://some.site/image.jpg" }
        }
    ) {
        id
    }
}
```

在内部，参数将在传递给解析器之前转换为平面结构：

```php
[
    'id' => 12,
    'title' => 'My awesome title',
    'imageUrl' = 'http://some.site/image.jpg',
]
```

请注意，在应用了所有其他 [ArgDirectives](../custom-directives/argument-directives.md) **之后** Lighthouse 会扩展参数，例如
验证，转换。

## @subscription

引用一个类来处理向客户端广播订阅。
给定的类必须扩展 `\Nuwave\Lighthouse\Schema\Types\GraphQLSubscription` 。

如果遵循用于 [定义订阅字段](../subscriptions/defining-fields.md) 的默认命名约定，则不需要此伪指令。
仅在需要覆盖默认名称空间时才有用。

```graphql
type Subscription {
    postUpdated(author: ID!): Post
        @subscription(class: "App\\GraphQL\\Blog\\PostUpdatedSubscription")
}
```

### 定义（Definition）

```graphql
"""
Reference a class to handle the broadcasting of a subscription to clients.
The given class must extend `\Nuwave\Lighthouse\Schema\Types\GraphQLSubscription`.
"""
directive @subscription(
    """
    A reference to a subclass of `\Nuwave\Lighthouse\Schema\Types\GraphQLSubscription`.
    """
    class: String!
) on FIELD_DEFINITION
```

## @trashed

```graphql
"""
Allows to filter if trashed elements should be fetched.
"""
directive @trashed on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

使用此指令的最方便方法是通过 [`@softDeletes`](#softdeletes) 。

如果要手动添加，请确保该参数的枚举类型为 `Trashed` ：

```graphql
type Query {
    flights(trashed: Trashed @trashed): [Flight!]! @all
}
```

## @trim

对输入值运行 `trim` 功能。

```graphql
type Mutation {
    createUser(name: String @trim): User
}
```

### 定义（Definition）

```graphql
"""
Run the `trim` function on an input value.
"""
directive @trim on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

## @union

使用自定义函数来确定联合的具体类型。

在决定使用此指令之前，请确保已阅读 [有关 union 的基础知识](../the-basics/types.md#union)，您可能不需要它。

```graphql
type User {
    id: ID!
}

type Employee {
    employeeId: ID!
}

union Person @union(resolveType: "App\\GraphQL\\Unions\\Person@resolveType") =
      User
    | Employee
```

该函数接收父字段的值作为其单个参数，并且必须从 Lighthouse 的 `TypeRegistry` 中解析对象类型。

```php
<?php

namespace App\GraphQL\Unions;

use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Schema\TypeRegistry;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

class Person
{
    /**
     * @var \Nuwave\Lighthouse\Schema\TypeRegistry
     */
    protected $typeRegistry;

    /**
     * @param  \Nuwave\Lighthouse\Schema\TypeRegistry  $typeRegistry
     * @return void
     */
    public function __construct(TypeRegistry $typeRegistry)
    {
        $this->typeRegistry = $typeRegistry;
    }

    /**
     * Decide which GraphQL type a resolved value has.
     *
     * @param  mixed  $rootValue The value that was resolved by the field. Usually an Eloquent model.
     * @param  \Nuwave\Lighthouse\Support\Contracts\GraphQLContext  $context
     * @param  \GraphQL\Type\Definition\ResolveInfo  $resolveInfo
     * @return \GraphQL\Type\Definition\Type
     */
    public function resolveType($rootValue, GraphQLContext $context, ResolveInfo $resolveInfo): Type
    {
        // Default to getting a type with the same name as the passed in root value
        // TODO implement your own resolver logic - if the default is fine, just delete this class
        return $this->typeRegistry->get(class_basename($rootValue));
    }
}
```

### 定义（Definition）

```graphql
"""
Use a custom function to determine the concrete type of unions.
"""
directive @union(
    """
    Reference a function that returns the implementing Object Type.
    Consists of two parts: a class name and a method name, seperated by an `@` symbol.
    If you pass only a class name, the method name defaults to `__invoke`.
    """
    resolveType: String!
) on UNION
```

## @update

```graphql
"""
Update an Eloquent model with the input values of the field.
"""
directive @update(
    """
    Specify the class name of the model to use.
    This is only needed when the default model detection does not work.
    """
    model: String

    """
    Set to `true` to use global ids for finding the model.
    If set to `false`, regular non-global ids are used.
    """
    globalId: Boolean = false

    """
    Specify the name of the relation on the parent model.
    This is only needed when using this directive as a nested arg
    resolver and if the name of the relation is not the arg name.
    """
    relation: String
) on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

在返回模型实例的 root mutation 字段上使用它。

```graphql
type Mutation {
    updatePost(id: ID!, content: String): Post @update
}
```

Lighthouse 使用参数 `id` 通过其主键获取模型。
即使您的模型具有不同名称的主键，这也将起作用，因此您可以使模式保持简单且独立于数据库结构。

如果希望您的架构直接反映您的数据库架构，则还可以使用基础主键的名称。
不建议这样做，因为它会使客户端缓存更加困难，并将您的架构耦合到基础实现。

```graphql
type Mutation {
    updatePost(post_id: ID!, content: String): Post @update
}
```

如果 Eloquent 模型的名称与字段的返回类型不匹配，或者位于非默认名称空间中，请使用 `model` 参数进行设置。

```graphql
type Mutation {
    updateAuthor(id: ID!, name: String): Author @update(model: "App\\User")
}
```

该指令也可以作用到 [嵌套的参数解析器](../concepts/arg-resolvers.md)。

## @upsert

```graphql
"""
Create or update an Eloquent model with the input values of the field.
"""
directive @upsert(
    """
    Specify the class name of the model to use.
    This is only needed when the default model detection does not work.
    """
    model: String

    """
    Set to `true` to use global ids for finding the model.
    If set to `false`, regular non-global ids are used.
    """
    globalId: Boolean = false

    """
    Specify the name of the relation on the parent model.
    This is only needed when using this directive as a nested arg
    resolver and if the name of the relation is not the arg name.
    """
    relation: String
) on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

Lighthouse 将尝试通过其主键来获取模型，就像 [`@update`](#update) 一样。
如果该模型不存在，它将使用给定的 `id` 重新创建。
如果未指定 `id` ，则将使用自动生成新的 ID 。

```graphql
type Mutation {
    upsertPost(post_id: ID!, content: String): Post @upsert
}
```

该指令也可以作用到 [嵌套的参数解析器](../concepts/arg-resolvers.md)。

## @where

使用输入值作为 [where 过滤器](https://laravel.com/docs/queries#where-clauses)。

您可以指定简单的运算符：

```graphql
type Query {
    postsSearchTitle(title: String! @where(operator: "like")): [Post!]! @all
}
```

或使用 Laravel 提供的其他条款：

```graphql
type Query {
    postsByYear(created_at: Int! @where(clause: "whereYear")): [Post!]! @all
}
```

### 定义（Definition）

```graphql
"""
Use an input value as a [where filter](https://laravel.com/docs/queries#where-clauses).
"""
directive @where(
    """
    Specify the operator to use within the WHERE condition.
    """
    operator: String = "="

    """
        Specify the database column to compare.
    Specify the database column to compare.
        Specify the database column to compare.
      Specify the database column to compare.
        Specify the database column to compare.
      Specify the database column to compare.
        Specify the database column to compare.
        Only required if database column has a different name than the attribute in your schema.
    """
    key: String

    """
    Use Laravel's where clauses upon the query builder.
    """
    clause: String
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

## @whereBetween

```graphql
"""
Verify that a column's value is between two values.
The type of the input value this is defined upon should be
an `input` object with two fields.
"""
directive @whereBetween(
    """
    Specify the database column to compare.
    Only required if database column has a different name than the attribute in your schema.
    """
    key: String
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

本示例定义一个 `input` 以过滤值在两个日期之间的值。

```graphql
type Query {
    posts(created_at: DateRange @whereBetween): [Post!]! @all
}

input DateRange {
    from: Date!
    to: Date!
}
```

您可以为参数使用任何自定义 `input` 类型。
确保它具有两个必填字段，以确保查询有效。

## @whereConditions

该指令的文档位于 [`Complex Where Conditions`](../eloquent/complex-where-conditions.md#whereconditions) 中。

## @whereHasConditions

该指令的文档位于 [`Complex Where Conditions`](../eloquent/complex-where-conditions.md#whereconditions) 中。

## @whereJsonContains

使用输入值作为 [whereJsonContains filter](https://laravel.com/docs/queries#json-where-clauses) 过滤器。

```graphql
type Query {
    posts(tags: [String]! @whereJsonContains): [Post!]! @all
}
```

您可以使用 `key` 参数查看 JSON 内容：

```graphql
type Query {
    posts(tags: [String]! @whereJsonContains(key: "tags->recent")): [Post!]!
        @all
}
```

### 定义（Definition）

```graphql
"""
Use an input value as a [whereJsonContains filter](https://laravel.com/docs/queries#json-where-clauses).
"""
directive @whereJsonContains(
    """
        Specify the database column and path inside the JSON to compare.
    Specify the database column and path inside the JSON to compare.
        Specify the database column and path inside the JSON to compare.
      Specify the database column and path inside the JSON to compare.
        Specify the database column and path inside the JSON to compare.
      Specify the database column and path inside the JSON to compare.
        Specify the database column and path inside the JSON to compare.
        Only required if database column has a different name than the attribute in your schema.
    """
    key: String
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

## @whereNotBetween

验证列的值是否位于两个值之外。
定义此输入值的类型应该是具有两个字段的 `input` 对象。

```graphql
type Query {
    posts(
        notCreatedDuring: DateRange @whereNotBetween(key: "created_at")
    ): [Post!]! @all
}

input DateRange {
    from: Date!
    to: Date!
}
```

### 定义（Definition）

```graphql
"""
Verify that a column's value lies outside of two values.
The type of the input value this is defined upon should be
an `input` object with two fields.
"""
directive @whereNotBetween(
    """
        Specify the database column to compare.
    Specify the database column to compare.
        Specify the database column to compare.
      Specify the database column to compare.
        Specify the database column to compare.
      Specify the database column to compare.
        Specify the database column to compare.
        Only required if database column has a different name than the attribute in your schema.
    """
    key: String
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

## @with

Eager-load Eloquent 的关系。

```graphql
type User {
    taskSummary: String!
        @with(relation: "tasks")
        @method(name: "getTaskSummary")
}
```

### 定义（Definition）

```graphql
"""
Eager-load an Eloquent relation.
"""
directive @with(
    """
    Specify the relationship method name in the model class,
    if it is named different from the field in the schema.
    """
    relation: String

    """
    Apply scopes to the underlying query.
    """
    scopes: [String!]
) on FIELD_DEFINITION
```

这对于不直接返回而是用于解析其他字段的字段可能是有用的优化。

如果您只想按原样返回关系本身，请考虑 [处理 Eloquent 的关系](../eloquent/relationships.md)。
