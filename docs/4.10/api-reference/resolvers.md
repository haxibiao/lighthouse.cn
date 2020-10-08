# 解析器（Resolvers）

## 解析器功能签名（Resolver function signature）

解析器始终使用相同的 4 个参数调用：

```php
<?php

use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

function ($rootValue, array $args, GraphQLContext $context, ResolveInfo $resolveInfo)
```

1. `$rootValue` ：从父字段返回的结果，解析位于 root types 之一（`Query`， `Mutation`）上的字段时，此字段为 `null` 。
2. `array $args` ：传递给该字段的参数，例如，对于像 `user(name: "Bob")` 这样的字段调用，它将是 `['name' => 'Bob']`
3. `GraphQLContext $context` ：在单个查询的所有字段之间共享的任意数据，默认情况下，Lighthouse 会传入 `Nuwave\Lighthouse\Schema\Context` 的实例。
4. `ResolveInfo $resolveInfo` ：有关 query 本身的信息，例如执行状态（execution state），字段名称（field name），从 root 到字段（field）的路径等。

此方法的返回值必须适合为模式中的相应字段定义的返回类型。

## 复杂度函数签名（Complexity function signature）

复杂度函数用于计算字段的查询复杂度得分。
您可以使用 [@complexity](../api-reference/directives.md#complexity) 指令定义自己的复杂度函数。

```php
function (int $childrenComplexity, array $args): int
```

1. `$childrenComplexity` ：子领域的复杂性，如果您希望返回多个 children ，那么对此做一些数学运算可能会很有用。
2. `array $args` ：传递到字段中的参数，例如，对于像 `user(name: "Bob")` 这样的字段调用，应该是 `['name' => 'Bob']`

在 [webonyx/graphql-php 文档](http://webonyx.github.io/graphql-php/security/#query-complexity-analysis) 中了解更多关于查询复杂性的信息。
