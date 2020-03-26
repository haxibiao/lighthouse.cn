# 使用 PHPUnit 测试

Lighthouse 好不一样，它让 PHPUnit 测试也变得更容易。

## 设置 (Setup)

Lighthouse 提供了一些有用的测试助手，可以轻松地在 PHPUnit 测试中调用您的 API。 只需将“MakesGraphQLRequests”特征添加到测试类即可。

```diff
<?php

namespace Tests;

+use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;
+   use MakesGraphQLRequests;
}
```

## 开启您的测试之旅 (Running Queries)

测试 GraphQL API 的最简单的方法是运行实际的 GraphQL 查询。

Lighthourse 中的一员，`graphQL` 测试助手在您的 GraphQL 端点上运行查询并返回`TestResponse`。

```php
public function testQueriesPosts(): void
{
    $response = $this->graphQL(/** @lang GraphQL */ '
    {
        posts {
            id
            title
        }
    }
    ');
}
```

如果要在查询中使用变量，请传递关联数组作为第二个参数：

```php
public function testCreatePost(): void
{
    $response = $this->graphQL(/** @lang GraphQL */ '
        mutation CreatePost($title: String!) {
            createPost(title: $title) {
                id
            }
        }
    ', [
        'title' => 'Automatic testing proven to reduce stress levels in developers'
    ]);
}
```

## 断言 (Assertions)

现在我们知道了如何在测试中对服务器进行查询的操作，不过我们需要确保返回的结果符合我们的期望。

返回的`TestResponse`可以方便地提供我们期望 GraphQL 返回的 JSON 数据。

`assertJson` 方法响应的是返回 JSON 的父级。

```php
public function testQueriesPosts(): void
{
    $post = factory(Post::class)->create();

    $this->graphQL(/** @lang GraphQL */ '
    {
        posts {
            id
            title
        }
    }
    ')->assertJson([
        'data' => [
            'posts' => [
                [
                    'id' => $post->id,
                    'title' => $post->title,
                ]
            ]
        ]
    ]);
}
```

您还可以从响应中提取数据，并在任何断言中使用它

```php
public function testOrdersUsersByName(): void
{
    factory(User::class)->create(['name' => 'Oliver']);
    factory(User::class)->create(['name' => 'Chris']);
    factory(User::class)->create(['name' => 'Benedikt']);

    $response = $this->graphQL(/** @lang GraphQL */ '
    {
        users(orderBy: "name") {
            name
        }
    }
    ');

    $names = $response->json("data.*.name");

    $this->assertSame(
        [
            'Benedikt'
            'Chris',
            'Oliver',
        ],
        $names
    );
}
```

## 模拟文件上传 (Simulating File Uploads)

Lighthouse 允许您通过 GraphQL [文件上传](../digging-deeper/file-uploads.md)。

由于多部分表单请求很难构造，因此您可以使用`multipartGraphQL`辅助方法。

```php
$this->multipartGraphQL(
    [
        'operations' => /** @lang JSON */
            '
            {
                "query": "mutation Upload($file: Upload!) { upload(file: $file) }",
                "variables": {
                    "file": null
                }
            }
        ',
        'map' => /** @lang JSON */
            '
            {
                "0": ["variables.file"]
            }
        ',
    ],
    [
        '0' => UploadedFile::fake()->create('image.jpg', 500),
    ]
)
```

## 自省 (Introspection)

当您创建或操作后端的某些部分，想看到创建或操作之后的结果。 您可以使用自省 Introspection 来查询最终结果。

Lighthouse 使用来自 [`\GraphQL\Type\Introspection::getIntrospectionQuery()`](https://github.com/webonyx/graphql-php/blob/master/src/Type/Introspection.php) 来完成这个操作。

`introspect（）`方法针对您的后端某个部分进行完整的自省查询。

```php
$introspectionResult = $this->introspect();
```

很多时候，您希望查找特定的命名类型。

```php
$generatedType = $this->introspectType('Generated');
// Ensure the type is present and matches a certain definition
$this->assertSame(
    [], // Adjust accordingly
    $generatedType
);
```

您还可以使用 directives 指令。

```php
$customDirective = $this->introspectDirective('custom');
```

## Defer

当发送带有包含 @defer 的字段的请求时，请使用 streamGraphQL（）方法。它会自动捕获完整的流式响应，并为您提供返回的块。

```php
$chunks = $this->streamGraphQL(/** @lang GraphQL */ '
{
    now
    later @defer
}
');

$this->assertSame(
    [
        [
            'data' => [
                'now' => 'some value',
                'later' => null,
            ],
        ],
        [
            'later' => [
                'data' => 'another value',
            ],
        ],
    ],
    $chunks
);
```

您还可以手动设置内存中的流：

```php
$this->setUpDeferStream();
```

## Lumen

由于 Lumen 中不提供`TestResponse`类，因此您必须使用其他
测试特征：

```diff
<?php

namespace Tests;

+use Nuwave\Lighthouse\Testing\MakesGraphQLRequestsLumen;

abstract class TestCase extends Laravel\Lumen\Testing\TestCase
{
+   use MakesGraphQLRequestsLumen;
}
```

所有的测试助手都与“ MakesGraphQLRequest”中的调用相同
不同之处在于它们返回的是 \$this ，而不是 TestResponse。
Assertions 断言的结果不同：

```php
public function testHelloWorld(): void
{
    $this->graphQL(/** @lang GraphQL */ '
    {
        hello
    }
    ')->seeJson([
        'data' => [
            'hello' => 'world'
        ]
    ])->seeHeader('SomeHeader', 'value');
}
```
