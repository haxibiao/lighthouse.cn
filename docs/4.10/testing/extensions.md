# 测试 Lighthouse 扩展程序

使用自定义扩展 Lighthouse 时，最好进行测试。
您的自定义扩展与其他应用程序隔离。

## schema 相关

当您增强与 schema 定义相关的功能时，例如添加一个 [custom directive](../custom-directives)，您同时需要添加一个可以使用它的测试用例。
将`UsesTestSchema`添加到您的测试类中，调用`setUpTestSchema（）`定义您的测试用例 ：

```php
<?php

namespace Tests;

use Nuwave\Lighthouse\Testing\UsesTestSchema;

class MyCustomDirectiveTest extends TestCase
{
    use UsesTestSchema;

    // You may set the schema once and use it in many test methods
    protected $schema = /** @lang GraphQL */ '
    type Query {
        foo: Int @myCustom
    }
    ';

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpTestSchema();;
    }

    public function testSpecificScenario(): void
    {
        // You can overwrite the schema for testing specific cases
        $this->schema = /** @lang GraphQL */ '
        type Query {
            foo(bar: String @myCustom): Int
        }
        ';

        // ...
    }
}
```

## resolvers 相关

通过模拟正式场景，测试自定义功能时，您仍然需要一种解决字段的方法。
将`MocksResolvers`特性添加到测试类中：

```php
<?php

namespace Tests;

use Nuwave\Lighthouse\Testing\MocksResolvers;

class ReverseDirectiveTest extends TestCase
{
    use MocksResolvers;
}
```

在此示例中，我们将模拟测试此自定义指令：

```graphql
"""
Reverts a string, e.g. 'foo' => 'oof'.
"""
directive @revert on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
```

模拟 resolver 的最简单方法是让其返回静态数据：

```php
public function testReverseField(): void
{
    $this->mockResolver('foo');

    $this->schema = /** @lang GraphQL */ '
    type Query {
        foo: String @reverse @mock
    }
    ';

    $this->graphQL(/** @lang GraphQL */ '
    {
        foo
    }
    ')->assertExactJson([
        'data' => [
            'foo' => 'oof',
        ],
    ]);
}
```

由于我们取回了 PHPUnit 的 InvocationMocker 实例，因此我们还可以 assert 用某些值调用我们的解析器。
请注意，在这里我们没有通过 explicit resolver 功能。 默认的 resolver 将简单地返回 “null” 。

```php
public function testReverseInput(): void
{
    $this->mockResolver()
        ->with(null, ['bar' => 'rab']);

    $this->schema = /** @lang GraphQL */ '
    type Query {
        foo(bar: String @reverse): String @mock
    }
    ';

    $this->graphQL(/** @lang GraphQL */ '
    {
        foo(bar: "bar")
    }
    ')->assertExactJson([
        'data' => [
            'foo' => null,
        ],
    ]);
}
```

如果必须动态处理传入的 resolver 参数，那您还可以传递一个函数：

```php
public function testReverseInput(): void
{
    $this->mockResolver(function($root, array $args): string {
        return $args['bar'];
    });

    $this->schema = /** @lang GraphQL */ '
    type Query {
        foo(bar: String @reverse): String @mock
    }
    ';

    $this->graphQL(/** @lang GraphQL */ '
    {
        foo(bar: "bar")
    }
    ')->assertExactJson([
        'data' => [
            'foo' => 'rab',
        ],
    ]);
}
```

您可能需要将多个 reslover 添加到 single schema。
这样的话，您需要为模拟 resolver 指定唯一的 “键”（这个键默认为 “default” ）：

```php
public function testMultipleResolvers(): void
{
    $this->mockResolver(..., 'first');
    $this->mockResolver(..., 'second');

    $this->schema = /** @lang GraphQL */ '
    type Query {
        foo: Int @mock(key: "first")
        bar: ID @mock(key: "second")
    }
    ';
}
```

默认情况下，`mockResolver` 的 resolver 至少被调用一次。
如果要设置其他期望，可以使用`mockResolverExpects`：

```php
public function testAbortsBeforeResolver(): void
{
    $this->mockResolverExpects(
        $this->never()
    );

    $this->schema = /** @lang GraphQL */ '
    type Query {
        foo: Int @someValidationThatFails @mock
    }
    ';

    $this->graphQL(/** @lang GraphQL */ '
    {
        foo
    }
    ');
}
```
