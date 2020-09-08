# 验证（Validation）

## 验证参数（Validating Arguments）

Lighthouse 允许您对查询和突变使用 [Laravel 的验证](https://laravel.com/docs/validation) 。
利用内置验证规则的最简单方法是使用 [@rules](../api-reference/directives.md#rules) 指令。

```graphql
type Mutation {
  createUser(
    name: String @rules(apply: ["required", "min:4"])
    email: String @rules(apply: ["email"])
  ): User
}
```
在验证错误的情况下，Lighthouse 将中止执行，并将验证消息作为响应的一部分返回。

```graphql
mutation {
  createUser(email: "hans@peter.xyz"){
    id
  }
}
```

```json
{
  "data": {
    "foo": null
  },
  "errors": [
    {
      "message": "validation",
      "locations": [
        {
          "line": 2,
          "column": 13
        }
      ],
      "extensions": {
        "validation": [
          "The name field is required."
        ]
      }
    }
  ]
}
```

### 自定义错误信息（Custom Error Messages）

您可以针对特定参数定制错误消息。

```graphql
@rules(apply: ["max:140"], messages: { max: "Tweets have a limit of 140 characters"})
```

### 自定义验证规则（Custom Validation Rules）

根据完全限定的类名引用自定义验证规则。

```graphql
@rules(apply: ["App\\Rules\\MyCustomRule"])
```

## 验证输入对象（Validating Input Objects）

可以根据输入对象值定义规则。

```graphql
input CreatePostInput {
    title: String @rules(apply: ["required"])
    content: String @rules(apply: ["min:50", "max:150"])
}
```

使用 [`unique`](https://laravel.com/docs/5.8/validation#rule-unique) 验证规则可能有点棘手。

如果参数嵌套在输入对象中，则参数路径将与列名不匹配，因此必须显式指定列名。

```graphql
input CreateUserInput {
  email: String @rules(apply: ["unique:users,email_address"])
}
```

## 验证数组（Validating Arrays）

当您将数组作为参数传递给字段时，您可能需要使用 [@rulesForArray](../api-reference/directives.md#rules) 对数组本身应用一些验证。

```graphql
type Mutation {
  makeIcecream(topping: [Topping!]! @rulesForArray(apply: ["max:3"])): Icecream
}
```

您还可以将其与 [@rules](../api-reference/directives.md#rules) 结合使用，以验证参数数组的大小和内容。例如，您可能需要传递一个包含至少 3 封有效电子邮件的列表。

```graphql
type Mutation {
  attachEmails(
    email: [String!]!
      @rules(apply: ["email"])
      @rulesForArray(apply: ["min:3"])
   ): File
}
```

## 验证字段（Validate Fields）

在某些情况下，验证规则更加复杂，需要使用完全自定义的逻辑或考虑多个参数。

要创建一个可应用于字段的可重用验证器，扩展基本验证指令 `\Nuwave\Lighthouse\Schema\Directives\ValidationDirective` 。你的自定义指令类应该位于一个配置的默认指令名称空间中，例如 `App\GraphQL\Directives` 。

```php
<?php

namespace App\GraphQL\Directives;

use Illuminate\Validation\Rule;
use Nuwave\Lighthouse\Schema\Directives\ValidationDirective;

class UpdateUserValidationDirective extends ValidationDirective
{
    /**
     * @return mixed[]
     */
    public function rules(): array
    {
        return [
            'id' => ['required'],
            'name' => ['sometimes', Rule::unique('users', 'name')->ignore($this->args['id'], 'id')],
        ];
    }
}
```

在要验证的字段的模式中使用它。

```graphql
type Mutation {
  updateUser(id: ID, name: String): User @update @updateUserValidation
}
```

您可以通过实现 `messages` 函数来定制给定规则的消息。

```php
    /**
     * @return string[]
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'The chosen username is not available',
        ];
    }
```
