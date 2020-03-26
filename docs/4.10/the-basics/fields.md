# 字段 (Fields)

指向任何 GraphQL API 的入口是 root 类型 `Query`, `Mutation` 和 `Subscription` 的字段

每个字段 (field) 都有一个与之关联的函数，当该字段 (field) 作为查询 (query) 的一部分被请求时，将调用该函数。这个函数称为解释器 (**resolver**).

## Hello World

按照不成文的规定，我们将开始利用 Lighthouse 实现一个 "hello world!"。

By：标题我就不翻译了，我觉得没有翻译的必要，要是你说你不懂啥意思？来来来，你加群我们好好聊聊人生？PHP 技术 QQ 交流群：1094858223

我们从定义最简单的模式开始：Root `Query` 类型，带有一个名为hello的字段，该字段返回一个字符串。
带有一个叫 `hello` 的字段，该字段返回一个 `String` 。

```graphql
type Query {
  hello: String! 
}
```

这定义了我们数据的模型，并告诉客户端他们可以获得什么。接下来需要实现一个对应的解析器 (resolver)。


默认情况下，Lighthouse 在 `App\GraphQL\Queries` 或 `App\GraphQL\Mutations` 中查找字段 (field) 名称大写的类，并使用相同的 [解析器 (resolver) 参数](../api-reference/resolvers.md#resolver-function-signature) 调用它的 `__invoke` 函数。

在这种情况下，我们的字段应该是一个查询 (query)，名为 `hello` ，所以我们需要定义我们的类如下:

```php
<?php

namespace App\GraphQL\Queries;

class Hello
{
    public function __invoke(): string
    {
        return 'world!';
    }
}
```
创建这样一个类的最简单方法是使用内建的 `artisan` 命令 `lighthouse:query` 和  `lighthouse:mutation` ，它们都有一个参数：要生成的字段 (field) 的名称。

例如，这是你如何为字段 (field) 生成一个类 `hello` ：

```shell
php artisan lighthouse:query Hello
```

现在可以查询您的模式了

```graphql
{
  hello
}
```

此查询将返回以下响应：

```json
{
  "data": {
    "hello": "world!"
  }
}
```

## 字段参数 (Fields with arguments)

正如我们所知，*每个*字段 (field) 都有一个与之相关联的解析器函数。与函数一样，字段 (field) 可以使用参数来控制它们的行为。

让我们构造一个向用户问候的查询 (query) 。我们添加了一个必需的参数 `name` ，用于构造问候语。

```graphql
type Query {
  greet(name: String!): String
}
```

实现字段 (field) 最简单的方法。这个类的框架可以使用 `php artisan lighthouse:query Greet` 来创建

解析器 (resolver) 函数的第二个参数是传递给查询 (query) 的参数的关联数组。

```php
<?php

namespace App\GraphQL\Queries;

class Greet
{
    public function __invoke($rootValue, array $args): string
    {
        return "Hello, {$args['name']}!";
    }
}
```

我们可以调用这个查询 (query) ，传递一个我们选择的 `name` 。

```graphql
{
  greet(name: "Foo")
}
```

此查询将接受并带上 `name` 的值后返回以下响应：

```json
{
  "data": {
    "greet": "Hello, Foo!"
  }
}
```

如果我们不想要求用户传递参数，我们可以修改模式 (schema) ，将 `name` 设为可选，并提供一个默认值。

```graphql
type Query {
    greet(name: String = "you"): String
}
```

现在我们可以这样使用查询 (query) ：

```graphql
{
  greet
}
```

```json
{
  "data": {
    "greet": "Hello, you!"
  }
}
```

## 解决非根域 (Resolving non-root fields)

正如前面提到的，模式 (schema) 中的每个字段 (field) 都有一个解析器 (resolver) 但是，如果字段 (field) 不在某个 root 类型上，情况又会如何呢?

```graphql
type Query {
  user: User!
}

type User {
  id: ID!
  name: String!
  email: String
}
```

让我们来看看当客户端发送以下查询 (query) 时会发生什么：

```graphql
{
  user {
    id
    name
  }
}
```

首先，将调用 `user` 的解析器 (resolver) 。让我们假设它返回一个 `App\Model\User` 实例。

接下来，将解析子字段 (field sub) 的选择 — 请求的两个字段是 `id` 和 `name` 。
因为我们已经解析了父字段 (parent field) 中的用户，所以我们不想再次通过获取它才能来获取它的属性。

为了方便起见，每个解析器的第一个参数是父字段的返回值，在本例中将会是用户模型 (User model)。

一个简单的 `id` 解析器 (resolver) 实现可能是这样的：

```php
<?php

use App\Models\User;

function resolveUserId(User $user): string
{
    return $user->id;
}
```

写出每个这样的解析器 (resolver) 是相当重复的。我们可以利用第四个也是最后一个解析器 (resolver) 参数 `ResolveInfo` 来动态地访问匹配的属性，它将为我们提供对所请求的字段名 (field name) 的访问权。

```php
<?php

use App\Models\User;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

function resolveUserAttribute(User $user, array $args, GraphQLContext $context, ResolveInfo $resolveInfo)
{
    return $user->{$resolveInfo->fieldName};
}
```

幸运的是，底层的 GraphQL 实现已经提供了[一个合理的默认解析器 (default resolver) ](http://webonyx.github.io/graphql-php/data-fetching/#default-field-resolver)，它可以很好地处理通常从最高层解析器 (root resolver) 返回的数据，例如 `Eloquent` 模型 (models) 或关联数组 (associative arrays)。

这意味着在大多数情况下，您只需为最高层字段 (root fields) 提供解析器 (resolvers)，并确保它们以正确的形式返回数据。

如果需要为不在最高层类型 (root types) `Query` 或 `Mutation` 上的字段实现自定义解析器 (resolvers)，可以使用 [@field](../api-reference/directives.md#field) 或者 [@method](../api-reference/directives.md#method) 指令。

如果需要，您还可以 [更改默认的解析器 (default resolver)](../digging-deeper/extending-lighthouse.md#changing-the-default-resolver) 。
