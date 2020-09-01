# 参数指令（Argument Directives）

参数指令可以应用于 [输入值的定义（InputValueDefinition）](https://graphql.github.io/graphql-spec/June2018/#InputValueDefinition).

由于参数可能包含在模式定义中的列表中，因此除了其函数外，您必须指定您的参数应该应用于什么。

-   如果它适用于列表中的单个项，实现 [`\Nuwave\Lighthouse\Support\Contracts\ArgDirective`](https://github.com/nuwave/lighthouse/tree/master/src/Support/Contracts/ArgDirective.php) 接口。
-   否则，如果它应该适用于整个列表，实现 [`\Nuwave\Lighthouse\Support\Contracts\ArgDirectiveForArray`](https://github.com/nuwave/lighthouse/tree/master/src/Support/Contracts/ArgDirectiveForArray.php) 接口。

要使参数指令工作，必须恰好实现这两个接口中的一个。

## 参数可变指令（ArgTransformerDirective）

这个 [`\Nuwave\Lighthouse\Support\Contracts\ArgTransformerDirective`](https://github.com/nuwave/lighthouse/blob/master/src/Support/Contracts/ArgTransformerDirective.php) 接受一个传入值并返回一个新值。

让我们看看内置的 `@trim` 指令。

```php
<?php

namespace Nuwave\Lighthouse\Schema\Directives;

use Nuwave\Lighthouse\Support\Contracts\ArgTransformerDirective;
use Nuwave\Lighthouse\Support\Contracts\DefinedDirective;

class TrimDirective extends BaseDirective implements ArgTransformerDirective, DefinedDirective
{
    public static function definition(): string
    {
        return /** @lang GraphQL */ <<<'SDL'
"""
Run the `trim` function on an input value.
"""
directive @trim on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
SDL;
    }

    /**
     * Remove whitespace from the beginning and end of a given input.
     *
     * @param  string  $argumentValue
     * @return string
     */
    public function transform($argumentValue): string
    {
        return trim($argumentValue);
    }
}
```

`transform` 方法接受一个参数，该参数表示查询中给定给参数的实际传入值，并期望转换该值并返回该值。

例如，如果我们有以下模式（Schema）。

```graphql
type Mutation {
    createUser(name: String @trim): User
}
```

解析字段时，参数将保存 "transformed" 的 value。

```php
<?php

namespace App\GraphQL\Mutations;

use App\User;

class CreateUser
{
    public function __invoke($root, array $args): User
    {
        return User::create([
            // This will be the trimmed value of the `name` argument
            'name' => $args['name']
        ]);
    }
}
```

### 评估顺序（Evaluation Order）

参数指令按照它们在模式中定义的顺序计算。

```graphql
type Mutation {
    createUser(
        password: String @trim @rules(apply: ["min:10,max:20"]) @hash
    ): User
}
```

在给出的例子中，Lighthouse 将取 `password` 参数的值并:

1. 去除全部空格
1. 效验数据格式
1. 通过 `bcrypt` 加密密码

## 参数构造器指令（ArgBuilderDirective）

这个 [`\Nuwave\Lighthouse\Support\Contracts\ArgBuilderDirective`](https://github.com/nuwave/lighthouse/blob/master/src/Support/Contracts/ArgBuilderDirective.php) 指令允许使用客户端传递的参数来动态修改 Lighthouse 为一个字段创建的数据库查询。

目前，以下指令使用定义的过滤器来解决查询:

-   `@all`
-   `@paginate`
-   `@find`
-   `@first`
-   `@hasMany` `@hasOne` `@belongsTo` `@belongsToMany`

以下面的模式（schema）为例:

```graphql
type User {
    posts(category: String @eq): [Post!]! @hasMany
}
```

传递 `category` 参数将只选择类别列等于 `category` 参数值的用户的文章。

所以，让我们看看内置的 `@eq` 指令。

```php
<?php

namespace Nuwave\Lighthouse\Schema\Directives;

use Nuwave\Lighthouse\Support\Contracts\ArgBuilderDirective;
use Nuwave\Lighthouse\Support\Contracts\DefinedDirective;

class EqDirective extends BaseDirective implements ArgBuilderDirective, DefinedDirective
{
    public static function definition(): string
    {
        return /** @lang GraphQL */ <<<'SDL'
directive @eq(
  """
  Specify the database column to compare.
  Only required if database column has a different name than the attribute in your schema.
  """
  key: String
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
SDL;
    }

    /**
     * Apply a "WHERE = $value" clause.
     *
     * @param  \Illuminate\Database\Query\Builder|\Illuminate\Database\Eloquent\Builder  $builder
     * @param  mixed  $value
     * @return \Illuminate\Database\Query\Builder|\Illuminate\Database\Eloquent\Builder
     */
    public function handleBuilder($builder, $value)
    {
        return $builder->where(
            $this->directiveArgValue('key', $this->nodeName()),
            $value
        );
    }
}
```

`handleBuilder` 方法有两个参数:

-   `$builder`
    用于应用附加查询的查询生成器。
-   `$value`
    应用 `@eq` 的参数值的值。

如果希望使用更复杂的值来操作查询，可以构建一个 `ArgBuilderDirective` 来处理列表或嵌套输入对象。
Lighthouse 的 [`@whereBetween`](../api-reference/directives.md#wherebetween) 就是一个例子。

```graphql
type Query {
    users(createdBetween: DateRange @whereBetween(key: "created_at")): [User!]!
        @paginate
}

input DateRange {
    from: Date!
    to: Date!
}
```

## 参数解析器（ArgResolver）

这个 [`\Nuwave\Lighthouse\Support\Contracts\ArgResolver`](https://github.com/nuwave/lighthouse/tree/master/src/Support/Contracts/ArgResolver.php)
指令允许你为复杂的嵌套输入组合解析器，类似于组合字段解析器的方式。

要深入了解组成参数解析器的概念，请阅读 [参数解析器（ArgResolver）的说明](../concepts/arg-resolvers.md) 。

## 参数操纵器（ArgManipulator）

这个 [`\Nuwave\Lighthouse\Support\Contracts\ArgManipulator`](https://github.com/nuwave/lighthouse/tree/master/src/Support/Contracts/ArgManipulator.php) 
指令可用于操作模式 AST。

例如，您可能想添加一个自动派生的参数指令
用于基于对象类型的字段，这个指令的骨架可能看起来像这样:

```php
<?php

namespace App\GraphQL\Directives;

use GraphQL\Language\AST\FieldDefinitionNode;
use GraphQL\Language\AST\InputObjectTypeDefinitionNode;
use GraphQL\Language\AST\InputValueDefinitionNode;
use GraphQL\Language\AST\ObjectTypeDefinitionNode;
use Nuwave\Lighthouse\Schema\AST\DocumentAST;
use Nuwave\Lighthouse\Schema\Directives\BaseDirective;
use Nuwave\Lighthouse\Support\Contracts\ArgManipulator;
use Nuwave\Lighthouse\Support\Contracts\DefinedDirective;

class ModelArgsDirective extends BaseDirective implements ArgManipulator, DefinedDirective
{
    /**
     * SDL definition of the directive.
     *
     * @return string
     */
    public static function definition(): string
    {
        return /** @lang GraphQL */ <<<'SDL'
"""
Automatically generates an input argument based on a type.
"""
directive @typeToInput(
    """
    The name of the type to use as the basis for the input type.
    """
    name: String!
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
SDL;
    }

    /**
     * Manipulate the AST.
     *
     * @param  \Nuwave\Lighthouse\Schema\AST\DocumentAST  $documentAST
     * @param  \GraphQL\Language\AST\InputValueDefinitionNode  $argDefinition
     * @param  \GraphQL\Language\AST\FieldDefinitionNode  $parentField
     * @param  \GraphQL\Language\AST\ObjectTypeDefinitionNode  $parentType
     * @return void
     */
    public function manipulateArgDefinition(
        DocumentAST &$documentAST,
        InputValueDefinitionNode &$argDefinition,
        FieldDefinitionNode &$parentField,
        ObjectTypeDefinitionNode &$parentType
    ): void {
        $typeName = $this->directiveArgValue('name');
        $type = $documentAST->types[$typeName];

        $input = $this->generateInputFromType($type);
        $argDefinition->name->value = $input->value->name;

        $documentAST->setTypeDefinition($input);
    }

    protected function generateInputFromType(ObjectTypeDefinitionNode $type): InputObjectTypeDefinitionNode
    {
        // TODO generate this type based on rules and conventions that work for you
    }
}
```
