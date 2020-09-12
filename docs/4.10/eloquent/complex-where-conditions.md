# 复杂环境（Complex Where Conditions）

当您需要许多不同的方式来筛选查询结果时，添加特别的查询条件可能会很麻烦并且有限制。
Lighthouse 的 `WhereConditions` 扩展可以为客户端提供高级的查询功能，并允许他们将复杂的、动态的 WHERE 条件应用于查询。

## 设置（Setup）

**这是一个实验性的特性，默认不包含在 Lighthouse 中。**

将服务提供者（Service Provider）添加到您的 `config/app.php`

```php
'providers' => [
    \Nuwave\Lighthouse\WhereConditions\WhereConditionsServiceProvider::class,
],
```

安装依赖 [mll-lab/graphql-php-scalars](https://github.com/mll-lab/graphql-php-scalars):

    composer require mll-lab/graphql-php-scalars

## 使用（Usage）

您可以通过一组增强字段的模式指令来使用此特性具有先进的过滤功能。

### @whereConditions

```graphql
"""
Add a dynamically client-controlled WHERE condition to a fields query.
"""
directive @whereConditions(
    """
    Restrict the allowed column names to a well-defined list.
    This improves introspection capabilities and security.
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

您可以将此指令应用于执行 Eloquent 查询的任何字段：

```graphql
type Query {
    people(
        where: _ @whereConditions(columns: ["age", "type", "haircolour", "height"])
    ): [Person!]! @all
}

type Person {
    id: ID!
    age: Int!
    height: Int!
    type: String!
    hair_colour: String!
}
```
Lighthouse自动生成 `Enum` 类型和 `Input` 类型的定义，这些定义被限制在已定义的列中，因此您不必手动指定它们。
名为 `_` 的空白类型将被更改为实际类型。下面是将包含在编译模式中的类型:

```graphql
"Dynamic WHERE conditions for the `where` argument on the query `people`."
input PeopleWhereWhereConditions {
    "The column that is used for the condition."
    column: PeopleWhereColumn

    "The operator that is used for the condition."
    operator: SQLOperator = EQ

    "The value that is used for the condition."
    value: Mixed

    "A set of conditions that requires all conditions to match."
    AND: [PeopleWhereWhereConditions!]

    "A set of conditions that requires at least one condition to match."
    OR: [PeopleWhereWhereConditions!]
}

"Allowed column names for the `where` argument on the query `people`."
enum PeopleWhereColumn {
    AGE @enum(value: "age")
    TYPE @enum(value: "type")
    HAIRCOLOUR @enum(value: "haircolour")
    HEIGHT @enum(value: "height")
}
```

除了 `columns` 参数之外，您还可以使用 `columnsEnum` ，以便重用允许的 column 列表。
你的 schema 应该是这样的：

```graphql
type Query {
    allPeople(
        where: _ @whereConditions(columnsEnum: "PersonColumn")
    ): [Person!]! @all

    paginatedPeople(
        where: _ @whereConditions(columnsEnum: "PersonColumn")
    ): [Person!]! @paginated
}

"A custom description for this custom enum."
enum PersonColumn {
  AGE @enum(value: "age")
  TYPE @enum(value: "type")
  HAIRCOLOUR @enum(value: "haircolour")
  HEIGHT @enum(value: "height")
}
```

Lighthouse 仍然会自动生成必要的输入类型。但是它不会为允许的列创建枚举，而是简单地使用现有的 `PersonColumn` 枚举。

建议使用 `columns` 或 `columnsEnum` 参数。当您没有定义任何允许的 column 时，客户机可以将任意 column 名指定为 `String` 。
应该小心使用这种方法，因为它会带来潜在的性能和安全风险，并且很少提供类型安全性。

对于一个正好 42 years 的人，一个简单的 query 看起来像这样：

```graphql
{
  people(
    where: { column: AGE, operator: EQ, value: 42 }
  ) {
    name
  }
}
```

注意，如果没有给出操作符，则默认为 `EQ` (`=`) ，因此您也可以在前面的示例中省略它，并得到相同的结果。

以下查询获取 age 37 以上 red hair 或至少 150cm 的 Actor：

```graphql
{
  people(
    where: {
      AND: [
        { column: AGE, operator: GT, value: 37 }
        { column: TYPE, value: "Actor" }
        {
          OR: [
            { column: HAIRCOLOUR, value: "red" }
            { column: HEIGHT, operator: GTE, value: 150 }
          ]
        }
      ]
    }
  ) {
    name
  }
}
```

一些操作符需要传递值列表 - 或者根本不传递值。
以下 query 得到的人 no hair 和 blue-ish eyes ：

```graphql
{
  people(
    where: {
      AND: [
        { column: HAIRCOLOUR, operator: IS_NULL }
        { column: EYES, operator: IN, value: ["blue", "aqua", "turquoise"] }
      ]
    }
  ) {
    name
  }
}
```

使用 `null` 作为参数值对查询没有任何影响。
此查询将检索所有人员，没有任何条件：

```graphql
{
  people(
    where: null
  ) {
    name
  }
}
```

### @whereHasConditions

```graphql
"""
Allows clients to filter a query based on the existence of a related model, using
a dynamically controlled `WHERE` condition that applies to the relationship.
"""
directive @whereHasConditions(
    """
    The Eloquent relationship that the conditions will be applied to.

    This argument can be omitted if the argument name follows the naming
    convention `has{$RELATION}`. For example, if the Eloquent relationship
    is named `posts`, the argument name must be `hasPosts`.
    """
    relation: String

    """
    Restrict the allowed column names to a well-defined list.
    This improves introspection capabilities and security.
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

这个指令的工作原理与 [`@whereConditions`](#whereconditions) 非常相似，除了条件是应用于一个关系子查询:

```graphql
type Query {
    people(
        hasRole: _ @whereHasConditions(columns: ["name", "access_level"])
    ): [Person!]! @all
}

type Role {
    name: String!
    access_level: Int
}
```

同样，Lighthouse 会为你的 query 自动生成 `input` 和 `enum` 定义:

```graphql
"Dynamic WHERE conditions for the `hasRole` argument on the query `people`."
input PeopleHasRoleWhereConditions {
    "The column that is used for the condition."
    column: PeopleHasRoleColumn

    "The operator that is used for the condition."
    operator: SQLOperator = EQ

    "The value that is used for the condition."
    value: Mixed

    "A set of conditions that requires all conditions to match."
    AND: [PeopleHasRoleWhereConditions!]

    "A set of conditions that requires at least one condition to match."
    OR: [PeopleHasRoleWhereConditions!]
}

"Allowed column names for the `hasRole` argument on the query `people`."
enum PeopleHasRoleColumn {
    NAME @enum(value: "name")
    ACCESS_LEVEL @enum(value: "access_level")
}
```

通过一个 person 对 access level 至少为 5 的人员进行简单查询，如下所示:

```graphql
{
  people(
    hasRole: { column: ACCESS_LEVEL, operator: GTE, value: 5 }
  ) {
    name
  }
}
```

您也可以查询关系存在没有任何条件；只需使用一个空对象作为参数值。
该查询将检索具有以下角色的所有人员：

```graphql
{
  people(
    hasRole: {}
  ) {
    name
  }
}
```

就像 `@whereCondition` 指令一样，使用 `null` 作为参数值对查询没有任何影响。
这个查询将检索所有人员，不管他们是否有角色:

```graphql
{
  people(
    hasRole: null
  ) {
    name
  }
}
```


## 自定义操作符（Custom operator）

如果 Lighthouse 的默认 `SQLOperator` 不适合您的用例，您可以注册一个自定义操作符类。
如果你的数据库使用不同的 SQL 操作符然后 Lighthouse 的默认值，或者你想 扩展/限制（extend/restrict）允许的操作符，这可能是必要的。

首先创建一个实现 `\Nuwave\Lighthouse\WhereConditions\Operator` 的类。
例如：

```php
namespace App\GraphQL;

use Nuwave\Lighthouse\WhereConditions\Operator;

class CustomSQLOperator implements Operator { ... }
```

 `Operator` 有两项职责：
- 提供将在整个模式中使用的 `enum` 定义
- 处理客户端输入并将操作符应用到查询生成器

要让 Lighthouse 使用你的自定义操作符类，你必须将它绑定到一个服务提供者（Service Provider）中:

```php
namespace App\GraphQL;

use App\GraphQL\CustomSQLOperator;
use Illuminate\Support\ServiceProvider;
use Nuwave\Lighthouse\WhereConditions\Operator;

class GraphQLServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(Operator::class, CustomSQLOperator::class);
    }
}
```

不要忘记在 `config/app.php` 中注册新的服务提供程序（Service Provider）。
确保添加它后 Lighthouse 的`\Nuwave\Lighthouse\WhereConditions\WhereConditionsServiceProvider::class`：

```diff
'providers' => [
    /*
     * Package Service Providers...
     */
    \Nuwave\Lighthouse\WhereConditions\WhereConditionsServiceProvider::class,

    /*
     * Application Service Providers...
     */
+   \App\GraphQL\GraphQLServiceProvider::class,
],
```
