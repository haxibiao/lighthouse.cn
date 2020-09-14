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
除非提出要求，否则自检（introspection）查询中不​​包括不建议使用的字段，客户端仍然可以查询它们。

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

Find a model based on the arguments provided.

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

This throws when more then one result is returned.
Use [@first](#first) if you can not ensure that.

If your model does not sit in the default namespace, you can overwrite it.

```graphql
type Query {
    userById(id: ID! @eq): User @find(model: "App\\Authentication\\User")
}
```

## @first

Get the first query result from a collection of Eloquent models.

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

Other then [@find](#find), this will not throw an error if more then one items are in the collection.

If your model does not sit in the default namespace, you can overwrite it.

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

Works very similar to the [`@delete`](#delete) directive.

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

You do not need this directive if the internal value of each enum key
is an identical string. [Read more about enum types](../the-basics/types.md#enum)

## @eq

Place an equal operator on an Eloquent query.

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

If the name of the argument does not match the database column,
pass the actual column name as the `key`.

```graphql
type User {
    posts(category: String @eq(key: "cat")): [Post!]! @hasMany
}
```

## @event

Fire an event after a mutation has taken place.
It requires the `dispatch` argument that should be
the class name of the event you want to fire.

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

Converts between IDs/types and global IDs.

```graphql
type User {
    id: ID! @globalId
    name: String
}
```

Instead of the original ID, the `id` field will now return a base64-encoded String
that globally identifies the User and can be used for querying the `node` endpoint.

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

The field resolver will receive the decoded version of the passed `id`,
split into type and ID.

You may rebind the `\Nuwave\Lighthouse\Support\Contracts\GlobalId` interface to add your
own mechanism of encoding/decoding global ids.

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

The most common use case for this is when dealing with passwords:

```graphql
type Mutation {
    createUser(name: String!, password: String! @hash): User!
}
```

## @hasMany

Corresponds to [the Eloquent relationship HasMany](https://laravel.com/docs/eloquent-relationships#one-to-many).

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

You can return the related models paginated by setting the `type`.

```graphql
type User {
    postsPaginated: [Post!]! @hasMany(type: "paginator")
    postsRelayConnection: [Post!]! @hasMany(type: "connection")
}
```

If the name of the relationship on the Eloquent model is different than the field name,
you can override it by setting `relation`.

```graphql
type User {
    posts: [Post!]! @hasMany(relation: "articles")
}
```

## @hasOne

Corresponds to [Eloquent's HasOne-Relationship](https://laravel.com/docs/eloquent-relationships#one-to-one).

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

If the name of the relationship on the Eloquent model is different than the field name,
you can override it by setting `relation`.

```graphql
type User {
    phone: Phone @hasOne(relation: "telephone")
}
```

## @in

Filter a column by an array using a `whereIn` clause.

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

This directive is part of the [GraphQL spec](https://graphql.github.io/graphql-spec/June2018/#sec--include)
and it should be noted this directive is a client side and should not be included in your schema.

Only includes a field in response if the value passed into this directive is true. This directive is one of the core
directives in the GraphQL spec.

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

The `@include` directive may be provided for fields, fragment spreads, and inline fragments,
and allows for conditional inclusion during execution as described by the `if` argument.

In this example experimentalField will only be queried if the variable \$someTest has the value true

```graphql
query myQuery($someTest: Boolean) {
    experimentalField @include(if: $someTest)
}
```

## @inject

Inject a value from the context object into the arguments.

```graphql
type Mutation {
    createPost(title: String!, content: String!): Post
        @create
        @inject(context: "user.id", name: "user_id")
}
```

This is useful to ensure that the authenticated user's `id` is
automatically used for creating new models and can not be manipulated.

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

If you are using an Input Object as an argument, you can use dot notation to
set a nested argument.

```graphql
type Mutation {
    createTask(input: CreateTaskInput!): Task
        @create
        @inject(context: "user.id", name: "input.user_id")
}
```

## @interface

Use a custom resolver to determine the concrete type of an interface.

Make sure you read the [basics about Interfaces](../the-basics/types.md#interface) before deciding
to use this directive, you probably don't need it.

Set the `resolveType` argument to a function that returns the implementing Object Type.

```graphql
interface Commentable
    @interface(
        resolveType: "App\\GraphQL\\Interfaces\\Commentable@resolveType"
    ) {
    id: ID!
}
```

The function receives the value of the parent field as its single argument and must
return an Object Type. You can get the appropriate Object Type from Lighthouse's type registry.

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

This is often useful when loading relationships with the [`@hasMany`](#hasmany) directive.

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

This can be useful on models or other classes that have getters:

```graphql
type User {
    mySpecialData: String! @method(name: "getMySpecialData")
}
```

This calls a method `App\User::getMySpecialData` with [the typical resolver arguments](resolvers.md#resolver-function-signature).
If you want to pass down only the arguments in sequence, use the `passOrdered` option:

```graphql
type User {
    purchasedItemsCount(year: Int!, includeReturns: Boolean): Int
        @method(passOrdered: true)
}
```

This will call the method with the arguments a client passes to the field.
Ensure the order of the argument definition matches the parameters of your method.

```php
public function purchasedItemsCount(int $year, ?bool $includeReturns)
```

Lighthouse will always pass down the same number of arguments and default to `null`
if the client passes nothing.

```graphql
{
    user(id: 3) {
        purchasedItemsCount(year: 2017)
    }
}
```

The method will get called like this:

```php
$user->purchasedItemsCount(2017, null)
```

## @middleware

**DEPRECATED**
Use [`@guard`](#guard) or custom [`FieldMiddleware`](../custom-directives/field-directives.md#fieldmiddleware) instead.

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

You can define middleware just like you would in Laravel. Pass in either a fully qualified
class name, an alias or a middleware group - or any combination of them.

```graphql
type Query {
    users: [User!]!
        @middleware(
            checks: ["auth:api", "App\\Http\\Middleware\\MyCustomAuth", "api"]
        )
        @all
}
```

If you need to apply middleware to a group of fields, you can put [@middleware](../api-reference/directives.md#middleware) on an Object type.
The middleware will apply only to direct child fields of the type definition.

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

Other then global middleware defined in the [configuration](../getting-started/configuration.md), field middleware
only applies to the specific field it is defined on. This has the benefit of limiting errors
to particular fields and not failing an entire request if a middleware fails.

There are a few caveats to field middleware though:

-   The Request object is shared between fields.
    If the middleware of one field modifies the Request, this does influence other fields.
-   They not receive the complete Response object when calling `$next($request)`,
    but rather the slice of data that the particular field returned.
-   The `terminate` method of field middleware is not called.

If the middleware needs to be aware of GraphQL specifics, such as the resolver arguments,
it is often more suitable to define a custom field directive.

## @model

```graphql
"""
Enable fetching an Eloquent model by its global id through the `node` query.

@deprecated(reason: "Use @node instead. This directive will be repurposed and do what @modelClass does now in v5.")
"""
directive @model on OBJECT
```

**Deprecated** Use [`@node`](#node) for Relay global object identification.

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

**Attention** This directive will be renamed to `@model` in v5.

Lighthouse will respect the overwritten model name in it's directives.

```graphql
type Post @modelClass(class: "\\App\\BlogPost") {
    title: String!
}
```

## @morphMany

Corresponds to [Eloquent's MorphMany-Relationship](https://laravel.com/docs/5.8/eloquent-relationships#one-to-many-polymorphic-relations).

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

Corresponds to [Eloquent's MorphOne-Relationship](https://laravel.com/docs/5.8/eloquent-relationships#one-to-one-polymorphic-relations).

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

Corresponds to [Eloquent's MorphTo-Relationship](https://laravel.com/docs/5.8/eloquent-relationships#one-to-one-polymorphic-relations).

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

Redefine the default namespaces used in other directives.

The following example applies the namespace `App\Blog`
to the `@field` directive used on the `posts` field.

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

When used upon an object type or an object type extension, the namespace
applies to fields of the type as well. This allows you to specify
a common namespace for a group of fields.

```graphql
extend type Query @namespace(field: "App\\Blog") {
    posts: [Post!]! @field(resolver: "Post@resolveAll")
}
```

A `@namespace` directive defined on a field directive wins in case of a conflict.

## @neq

Place a not equals operator `!=` on an Eloquent query.

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

This may be useful to logically group arg resolvers.

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

Lighthouse defaults to resolving types through the underlying model,
for example by calling `User::find($id)`.

```graphql
type User @node {
    id: ID! @globalId
}
```

You can also use a custom resolver function to resolve any kind of data.

```graphql
type Country @node(resolver: "App\\Countries@byId") {
    name: String!
}
```

The `resolver` argument has to specify a function which will be passed the
decoded `id` and resolves to a result.

```php
public function byId($id): array {
    return [
        'DE' => ['name' => 'Germany'],
        'MY' => ['name' => 'Malaysia'],
    ][$id];
}
```

[Read more](../digging-deeper/relay.md#global-object-identification).

### 定义（Definition）

Behind the scenes, Lighthouse will decode the global id sent from the client
to find the model by it's primary id in the database.

## @notIn

Filter a column by an array using a `whereNotIn` clause.

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

Use it on a field argument of an Eloquent query. The type of the argument
can be left blank as `_` , as it will be automatically generated.

```graphql
type Query {
    posts(orderBy: _ @orderBy(columns: ["posted_at", "title"])): [Post!]! @all
}
```

Lighthouse will automatically generate an input that takes enumerated column names,
together with the `SortOrder` enum, and add that to your schema. Here is how it looks:

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

If you want to re-use a list of allowed columns, you can define your own enumeration type and use the `columnsEnum` argument instead of `columns`.
Here's an example of how you could define it in your schema:

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

Lighthouse will still automatically generate the necessary input types and the `SortOrder` enum.
But instead of generating enums for the allowed columns, it will simply use the existing `PostColumn` enum.

Querying a field that has an `orderBy` argument looks like this:

```graphql
{
    posts(orderBy: [{ column: POSTED_AT, order: ASC }]) {
        title
    }
}
```

You may pass more than one sorting option to add a secondary ordering.

### Input Definition Example

The `@orderBy` directive can also be applied inside an input field definition when used in conjunction with the [`@spread`](#spread) directive. See below for example:

```graphql
type Query {
    posts(filter: PostFilterInput @spread): Posts
}

input PostFilterInput {
    orderBy: [OrderByClause!] @orderBy
}
```

And usage example:

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

### Basic usage

This directive is meant to be used on root query fields:

```graphql
type Query {
    posts: [Post!]! @paginate
}
```

> When you want to paginate a relationship, use the to-many relationship
> directives such as [`@hasMany`](directives.md#hasmany) instead.

The schema definition is automatically transformed to this:

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

And can be queried like this:

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

### Pagination type

The `type` of pagination defaults to `paginator`, but may also be set to a Relay
compliant `connection`.

> Lighthouse does not support actual cursor-based pagination as of now, see https://github.com/nuwave/lighthouse/issues/311 for details.
> Under the hood, the "cursor" is decoded into a page offset.

```graphql
type Query {
    posts: [Post!]! @paginate(type: "connection")
}
```

The final schema will be transformed to this:

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

### Default count

You can supply a `defaultCount` to set a default count for any kind of paginator.

```graphql
type Query {
    posts: [Post!]! @paginate(type: "connection", defaultCount: 25)
}
```

This let's you omit the `count` argument when querying:

```graphql
query {
    posts {
        id
        name
    }
}
```

### Limit maximum count

Lighthouse allows you to specify a global maximum for the number of items a user
can request through pagination through the config. You may also overwrite this
per field with the `maxCount` argument:

```graphql
type Query {
    posts: [Post!]! @paginate(maxCount: 10)
}
```

### Overwrite model

By default, Lighthouse looks for an Eloquent model in the configured default namespace, with the same
name as the returned type. You can overwrite this by setting the `model` argument.

```graphql
type Query {
    posts: [Post!]! @paginate(model: "App\\Blog\\BlogPost")
}
```

### Custom builder

If simply querying Eloquent does not fit your use-case, you can specify a custom `builder`.

```graphql
type Query {
    posts: [Post!]! @paginate(builder: "App\\Blog@visiblePosts")
}
```

Your method receives the typical resolver arguments and has to return an instance of `Illuminate\Database\Query\Builder`.

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

This can often be useful to ensure consistent naming of your schema
without having to change the underlying models.

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

Works very similar to the [`@delete`](#delete) directive.

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

For example, this rule ensures that users pass a valid 2 character country code:

```graphql
type Query {
    users(countryCode: String @rules(apply: ["string", "size:2"])): [User!]!
        @all
}
```

Read more in the [validation docs](../security/validation.md#validating-arguments).

## @rulesForArray

Run validation on an array itself, using [Laravel built-in validation](https://laravel.com/docs/validation).

```graphql
type Mutation {
    saveIcecream(
        flavors: [IcecreamFlavor!]! @rulesForArray(apply: ["min:3"])
    ): Icecream
}
```

Read more in the [validation docs](../security/validation.md#validating-arrays).

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

Reference a class implementing a scalar definition.
[Learn how to implement your own scalar.](http://webonyx.github.io/graphql-php/type-system/scalar-types/)

```graphql
scalar DateTime @scalar(class: "DateTimeScalar")
```

If you follow the namespace convention, you do not need this directive.
Lighthouse looks into your configured scalar namespace for a class with the same name.

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

If your class is not in the default namespace, pass a fully qualified class name.

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

You may use this in combination with field directives such as [`@all`](#all).

```graphql
type Query {
    posts(trending: Boolean @scope(name: "trending")): [Post!]! @all
}
```

## @search

Perform a full-text by the given input value.

```graphql
type Query {
    posts(search: String @search): [Post!]! @paginate
}
```

The `search()` method of the model is called with the value of the argument,
using the driver you configured for [Laravel Scout](https://laravel.com/docs/master/scout).

Take care when using the `@search` directive in combination with other directives
that influence the database query. The usual query builder `Eloquent\Builder`
will be replaced by a `Scout\Builder`, which does not support the same methods and operations.
Regular filters such as [`@eq`](#eq) or [`@in`](#in) still work, but scopes do not.

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

Normally the search will be performed using the index specified by the model's `searchableAs` method.
However, in some situation a custom index might be needed, this can be achieved by using the argument `within`.

```graphql
type Query {
    posts(search: String @search(within: "my.index")): [Post!]! @paginate
}
```

## @skip

This directive is part of the [GraphQL spec](https://graphql.github.io/graphql-spec/June2018/#sec--include)
and it should be noted this directive is a client side directive and should not be included in your schema.

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

The `@skip` directive may be provided for fields, fragment spreads, and inline fragments, and allows for conditional
exclusion during execution as described by the if argument.

In this example experimentalField will only be queried if the variable \$someTest has the value `false`.

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

The following schema definition from a `.graphql` file:

```graphql
type Query {
    tasks: [Tasks!]! @all @softDeletes
}
```

Will result in a schema that looks like this:

```graphql
type Query {
    tasks(trashed: Trashed @trashed): [Tasks!]! @all
}
```

Find out how the added filter works: [`@trashed`](#trashed)

## @spread

```graphql
"""
Merge the fields of a nested input object into the arguments of its parent
when processing the field arguments given by a client.
"""
directive @spread on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

You may use `@spread` on field arguments or on input object fields:

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

The schema does not change, client side usage works as if `@spread` was not there:

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

Internally, the arguments will be transformed into a flat structure before
they are passed along to the resolver:

```php
[
    'id' => 12,
    'title' => 'My awesome title',
    'imageUrl' = 'http://some.site/image.jpg',
]
```

Note that Lighthouse spreads out the arguments **after** all other [ArgDirectives](../custom-directives/argument-directives.md)
have been applied, e.g. validation, transformation.

## @subscription

Reference a class to handle the broadcasting of a subscription to clients.
The given class must extend `\Nuwave\Lighthouse\Schema\Types\GraphQLSubscription`.

If you follow the default naming conventions for [defining subscription fields](../subscriptions/defining-fields.md)
you do not need this directive. It is only useful if you need to override the default namespace.

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

The most convenient way to use this directive is through [`@softDeletes`](#softdeletes).

If you want to add it manually, make sure the argument is of the
enum type `Trashed`:

```graphql
type Query {
    flights(trashed: Trashed @trashed): [Flight!]! @all
}
```

## @trim

Run the `trim` function on an input value.

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

Use a custom function to determine the concrete type of unions.

Make sure you read the [basics about Unions](../the-basics/types.md#union) before deciding
to use this directive, you probably don't need it.

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

The function receives the value of the parent field as its single argument and must
resolve an Object Type from Lighthouse's `TypeRegistry`.

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

Lighthouse uses the argument `id` to fetch the model by its primary key.
This will work even if your model has a differently named primary key,
so you can keep your schema simple and independent of your database structure.

If you want your schema to directly reflect your database schema,
you can also use the name of the underlying primary key.
This is not recommended as it makes client-side caching more difficult
and couples your schema to the underlying implementation.

```graphql
type Mutation {
    updatePost(post_id: ID!, content: String): Post @update
}
```

If the name of the Eloquent model does not match the return type of the field,
or is located in a non-default namespace, set it with the `model` argument.

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

Lighthouse will try to to fetch the model by its primary key, just like [`@update`](#update).
If the model doesn't exist, it will be newly created with a given `id`.
In case no `id` is specified, an auto-generated fresh ID will be used instead.

```graphql
type Mutation {
    upsertPost(post_id: ID!, content: String): Post @upsert
}
```

该指令也可以作用到 [嵌套的参数解析器](../concepts/arg-resolvers.md)。

## @where

Use an input value as a [where filter](https://laravel.com/docs/queries#where-clauses).

You can specify simple operators:

```graphql
type Query {
    postsSearchTitle(title: String! @where(operator: "like")): [Post!]! @all
}
```

Or use the additional clauses that Laravel provides:

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

This example defines an `input` to filter that a value is between two dates.

```graphql
type Query {
    posts(created_at: DateRange @whereBetween): [Post!]! @all
}

input DateRange {
    from: Date!
    to: Date!
}
```

You may use any custom `input` type for the argument. Make sure it has
exactly two required fields to ensure the query is valid.

## @whereConditions

The documentation for this directive is found in [`Complex Where Conditions`](../eloquent/complex-where-conditions.md#whereconditions).

## @whereHasConditions

The documentation for this directive is found in [`Complex Where Conditions`](../eloquent/complex-where-conditions.md#wherehasconditions).

## @whereJsonContains

Use an input value as a [whereJsonContains filter](https://laravel.com/docs/queries#json-where-clauses).

```graphql
type Query {
    posts(tags: [String]! @whereJsonContains): [Post!]! @all
}
```

You may use the `key` argument to look into the JSON content:

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

Verify that a column's value lies outside of two values.
The type of the input value this is defined upon should be
an `input` object with two fields.

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

Eager-load an Eloquent relation.

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

This can be a useful optimization for fields that are not returned directly
but rather used for resolving other fields.

If you just want to return the relation itself as-is,
look into [handling Eloquent relationships](../eloquent/relationships.md).
