# 类型 (Types)

GraphQL模式由类型组成。本节描述了不同类型的集合，以及如何定义它们来使用 Lighthouse。有关类型的更深入的参考资料，请参阅 [GraphQL 文档](https://graphql.org/learn/schema/)

## 对象类型 (Object Type)

对象类型定义 API 的资源，并且与有说服力的模型密切相关。它们必须具有唯一的名称并包含一组字段。

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  created_at: String!
  updated_at: String
}

type Query {
  users: [User!]!
  user(id: ID!): User
}
```

## 标量类型 (Scalar)

标量类型是 GraphQL 模式最基本的元素。有几个内建的 Scalar ，例如 `String` 和 `Int`.

Lighthouse 提供了一些与 Laravel 一些变量类型相对应的 Scalar ，你可以在 [ Scalar 的 API 参考](../api-reference/scalars.md) 中了解它们。

通过运行定义您自己的 scalar 类型 `php artisan lighthouse:scalar <Scalar name>`
并把它包含在你的模式中，Lighthouse 将寻找可配置的标量类型默认名称空间。

```graphql
scalar ZipCode

type User {
  zipCode: ZipCode
}
```

您还可以使用第三方 scalar ，例如由 [mll-lab/graphql-php-scalars](https://github.com/mll-lab/graphql-php-scalars) 提供的 scalar。
只需要 `composer require` 您选择的包，并将 schema 定义添加到模式中。
使用 [@scalar](../api-reference/directives.md#scalar) 指令指向任何完全限定的类名:

```graphql
scalar Email @scalar(class: "MLL\\GraphQLScalars\\Email")
```

[了解如何实现自己的 scalar](https://webonyx.github.io/graphql-php/type-system/scalar-types/)

## 枚举 (Enum)

枚举类型具有一组受限制的值(类似于数据库迁移中发现的 `enum` )。它们被定义为 `UPPERCASE` 键的列表。

### 模式定义 (Schema definition)

您可以通过 [@enum](../api-reference/directives.md#enum) 指令定义实际的值。

```graphql
enum EmploymentStatus {
  INTERN @enum(value: 0)
  EMPLOYEE @enum(value: 1)
  TERMINATED @enum(value: 2)
}
```

现在我们可以使用 enum 作为模式的一部分。

```graphql
type Employee {
  id: ID!
  name: String
  status: EmploymentStatus!
}

type Query {
  employees: [Employee!]! @all
}
```

在本例中，底层值实际上是整数。从其中检索模型时数据库、映射被应用，整数被转换为定义的字符串键。

```php
return [
  ['name' => 'Hans', 'status' => 0],
  ['name' => 'Pamela', 'status' => 1],
  ['name' => 'Gerhard', 'status' => 2],
];
```

查询现在返回有意义的名称，而不是神奇的数字。

```graphql
{
  employees {
    name
    status
  }
}
```

```json
{
  "data": {
    "employees": [
      {"name": "Hans", "status": "INTERN"},
      {"name": "Pamela", "status": "EMPLOYEE"},
      {"name": "Gerhard", "status": "TERMINATED"}
    ]
  }
}
```

如果 enum 的内部值与字段名相同，则可以省略 `@enum` :

```graphql
enum Role {
  ADMIN
}
```

假如字段的PHP内部值 `ADMIN` 那么就是 `string('ADMIN')`.

### 原生 PHP 定义 (Native PHP definition)

如果希望重用 PHP 中的 enum 定义或常量，还可以 [通过 TypeRegistry](../digging-deeper/adding-types-programmatically.md#native-php-types) 来注册一个原生 PHP enum 类型。

只需定义一个[枚举类型 (EnumType)](http://webonyx.github.io/graphql-php/type-system/enum-types/) 并注册它: 

```php
use GraphQL\Type\Definition\EnumType;
use Nuwave\Lighthouse\Schema\TypeRegistry;

$episodeEnum = new EnumType([
    'name' => 'Episode',
    'description' => 'One of the films in the Star Wars Trilogy',
    'values' => [
        'NEWHOPE' => [
            'value' => 4,
            'description' => 'Released in 1977.'
        ],
        'EMPIRE' => [
            'value' => 5,
            'description' => 'Released in 1980.'
        ],
        'JEDI' => [
            'value' => 6,
            'description' => 'Released in 1983.'
        ],
    ]
]);

// Resolve this through the container, as it is a singleton
$typeRegistry = app(TypeRegistry::class);

$typeRegistry->register($episodeEnum);
```

如果你正在使用 [BenSampo/laravel-enum](https://github.com/BenSampo/laravel-enum)
您可以使用 `Nuwave\Lighthouse\Schema\Types\LaravelEnumType` 来构造一个 enum 类型。

构造出如下 enum 类:

```php
<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

final class UserType extends Enum
{
    const Administrator = 0;
    const Moderator = 1;
    const Subscriber = 2;
    const SuperAdministrator = 3;
}
```

这是您在 ServiceProvider 中注册它的方式，确保用 `LaravelEnumType` 包装它。

```php
<?php

declare(strict_types=1);

namespace App\GraphQL;

use App\Enums\UserType;
use Illuminate\Support\ServiceProvider;
use Nuwave\Lighthouse\Schema\TypeRegistry;
use Nuwave\Lighthouse\Schema\Types\LaravelEnumType;

class GraphQLServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @param  \Nuwave\Lighthouse\Schema\TypeRegistry  $typeRegistry
     * @return void
     */
    public function boot(TypeRegistry $typeRegistry): void
    {
        $typeRegistry->register(
             new LaravelEnumType(UserType::class)
        );
    }
}
```

默认情况下，生成的类型将与给定的类一样命名。

```php
$enum = new LaravelEnumType(UserType::class);
var_dump($enum->name); // UserType
```

如果默认名称不合适或存在名称冲突，您可以覆盖该名称。

```php
$enum = new LaravelEnumType(UserType::class, 'UserKind');
var_dump($enum->name); // UserKind
```

## 输入 (Input)

Input 类型可用于描述字段参数的复杂对象。注意，虽然它们看起来类似于对象类型（Object Type），但它们的行为却不同：Input 类型的字段被视为类似于参数。

```graphql
input CreateUserInput {
  name: String!
  email: String
}

type User {
  id: ID!
  name: String!
  email: String
}

type Mutation {
  createUser(input: CreateUserInput! @spread): User @create
} 
```

## 接口 (Interface)

GraphQL `interface` 类型类似于 PHP `Interface` 。它定义了一组所有实现类型都必须提供的公共字段。Laravel 项目接口的一个常见用例是多态关系。

```graphql
interface Named {
  name: String!
}
```

对象类型（Object Type）可以实现该接口，前提是它们提供了接口的所有字段。

```graphql
type User implements Named {
  id: ID!
  name: String!
}
```

下面的定义是无效的

```graphql
type User implements Named {
  id: ID!
}
```

接口需要一种方法来确定特定查询返回的具体对象类型。Lighthouse 提供了一个默认的类型解析器，它通过对解析器返回的值调用 `class_basename($value)` 来工作。

接口需要一种方法来确定特定查询返回的具体对象类型。Lighthouse 提供了一个默认的类型解析器，它通过调用解析器返回的值来工作。

您还可以提供自定义类型解析器。运行 `php artisan lighthouse:interface <Interface name>` 来创建一个自定义接口类。它被自动放到默认的名称空间中，Lighthouse 可以自己发现它

在 [GraphQL 参考资料](https://graphql.org/learn/schema/#interfaces) 和 [graphql-php 文档](http://webonyx.github.io/graphql-php/type-system/interfaces/) 中了解更多

## Union

Union 是一种抽象类型，它只是枚举其他对象类型。
它们与接口相似，因为它们可以返回不同的类型，但是它们不能定义字段。

```graphql
union Person
  = User
  | Employee

type User {
  id: ID!
}

type Employee {
  employeeId: ID!
}
```

就像接口一样，您需要一种基于已解析值来确定Union的具体对象类型的方法。如果默认类型解析器不适合您，那么使用 `php artisan lighthouse:union <Union name>` 定义自己的解析器。
它被自动放到默认的名称空间中，Lighthouse 可以自己发现它。

去 [GraphQL 参考资料](https://graphql.org/learn/schema/#interfaces) 和 [graphql-php 文档](http://webonyx.github.io/graphql-php/type-system/interfaces/) 中可以了解更多信息
