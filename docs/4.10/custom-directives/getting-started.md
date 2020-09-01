# 实现您自己的指令（Implementing Your Own Directives）

随着 GraphQL 模式（schema）的增长，您可能会发现需要更专门的功能。
了解如何通过使用自定义指令（Directive）以可组合和可重用的方式抽象逻辑。

## 命名约定（Naming Conventions）

指令（Directive）被实现为 PHP 类，每个指令（Directive）都可用对应于一个类。

指令（Directive）名称本身通常在 **camelCase** 中定义。指令（Directive）的类名必须遵循以下模式:

    <DirectiveName>Directive

作为本文介绍的一部分，让我们实现一个简单的 `@upperCase` 指令。我们将把它放在一个叫做 `UpperCaseDirective` 的类中，并扩展抽象类 `\Nuwave\Lighthouse\Schema\Directives\BaseDirective`

```php
<?php

use Nuwave\Lighthouse\Schema\Directives\BaseDirective;

class UpperCaseDirective extends BaseDirective {}
```

## 指令接口（Directive Interfaces）

此时，指令（Directive）不执行任何操作。取决于您的指令（Directive）应该做什么，您可以选择一个或多个提供的指令（Directive）接口来添加功能。他们是到 Lighthouse 的联系的关键。

在这种情况下，我们的指令需要在实际的解析器之后运行。就像 [Laravel 中间件（Middleware）](https://laravel.com/docs/middleware) 一样，我们可以使用 `FieldMiddleware` 指令对其进行包装。

```php
<?php

namespace App\GraphQL\Directives;

use Closure;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Schema\Directives\BaseDirective;
use Nuwave\Lighthouse\Schema\Values\FieldValue;
use Nuwave\Lighthouse\Support\Contracts\FieldMiddleware;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

class UpperCaseDirective extends BaseDirective implements FieldMiddleware
{
    /**
     * Wrap around the final field resolver.
     *
     * @param \Nuwave\Lighthouse\Schema\Values\FieldValue $fieldValue
     * @param \Closure $next
     * @return \Nuwave\Lighthouse\Schema\Values\FieldValue
     */
    public function handleField(FieldValue $fieldValue, Closure $next): FieldValue
    {
        // Retrieve the existing resolver function
        /** @var Closure $previousResolver */
        $previousResolver = $fieldValue->getResolver();

        // Wrap around the resolver
        $wrappedResolver = function ($root, array $args, GraphQLContext $context, ResolveInfo $info) use ($previousResolver): string {
            // Call the resolver, passing along the resolver arguments
            /** @var string $result */
            $result = $previousResolver($root, $args, $context, $info);

            return strtoupper($result);
        };

        // Place the wrapped resolver back upon the FieldValue
        // It is not resolved right now - we just prepare it
        $fieldValue->setResolver($wrappedResolver);

        // Keep the middleware chain going
        return $next($fieldValue);
    }
}
```

## 注册指令（Register Directives）

现在我们已经定义并实现了指令（Directive），那么 Lighthouse 如何找到它呢?

当 Lighthouse 在模式（Schema）中遇到一个指令（Directive）时，它按照下面的顺序开始寻找匹配的类:

1. 在 `config/lighthouse.php` 中配置的用户定义名称空间 默认为 `App\GraphQL\Directives`
1. [RegisterDirectiveNamespaces](../api-reference/events.md#registerdirectivenamespaces) 事件被分配来收集由插件、扩展或其他侦听器定义的名称空间
1. Lighthouse 的内置指令（Directive）名称空间

这意味着我们的指令（Directive）已经注册了，只是通过在默认名称空间中定义它，并且将优先于可能具有相同名称的其他指令（Directive）。
