# 字段指令（Field Directives）

字段指令可以应用于任何 [字段定义](https://graphql.github.io/graphql-spec/June2018/#FieldDefinition)

## 字段解析器（FieldResolver）

也许是最重要的指令接口，这个 [`\Nuwave\Lighthouse\Support\Contracts\FieldResolver`](https://github.com/nuwave/lighthouse/tree/master/src/Support/Contracts/FieldResolver.php)
让你通过指令为字段添加一个解析器。

它是在模式中重用解析器逻辑的好方法。

## 字段中间件（FieldMiddleware）

这个 [`\Nuwave\Lighthouse\Support\Contracts\FieldMiddleware`](https://github.com/nuwave/lighthouse/tree/master/src/Support/Contracts/FieldMiddleware.php) 指令允许您环绕字段解析器，就像[Laravel 中间件（Middleware）](https://laravel.com/docs/middleware) 一样。

您可以使用它来处理到达最终解析器之前的传入值，以及解析字段时的传出结果。

## 字段操纵器（FieldManipulator）

这个 [`\Nuwave\Lighthouse\Support\Contracts\FieldManipulator`](https://github.com/nuwave/lighthouse/tree/master/src/Support/Contracts/FieldManipulator.php)
字段操纵器指令可用于操作模式 AST 。

## 验证指令（ValidationDirective）

这个指令类型被实现为一个抽象类而不是一个纯粹的接口，它允许您轻松地为字段定义复杂的验证规则。

[在验证（Validation）部分了解更多信息](../security/validation.md#validate-fields).
