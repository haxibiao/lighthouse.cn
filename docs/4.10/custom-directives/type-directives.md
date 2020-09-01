# 类型指令（Type Directives）

这些指令通常可以应用于架构中的 [类型定义](../the-basics/types.md)。

> 这不仅限于 `type` ，还包括 `input` ，`enum` ，`union` ，`interface` 和 `scalar` 类型。

## 类型操纵器（TypeManipulator）

[`\Nuwave\Lighthouse\Support\Contracts\TypeManipulator`](https://github.com/nuwave/lighthouse/tree/master/src/Support/Contracts/TypeManipulator.php)
接口可用于从类型定义节点操作 AST 。

## 类型中间件（TypeMiddleware）

[`\Nuwave\Lighthouse\Support\Contracts\TypeMiddleware`](https://github.com/nuwave/lighthouse/tree/master/src/Support/Contracts/TypeMiddleware.php)
接口允许访问 AST 节点，因为它已转换为可执行类型。

## 类型解析器（TypeResolver）

[`\Nuwave\Lighthouse\Support\Contracts\TypeResolver`](https://github.com/nuwave/lighthouse/tree/master/src/Support/Contracts/TypeResolver.php)
接口可用于从 AST 值到可执行类型的自定义转换。

## 类型扩展指令（Type Extension Directives）

这些指令通常可以应用于模式中的
[类型扩展](https://graphql.github.io/graphql-spec/June2018/#sec-Type-Extensions)。

## 类型扩展操纵器（TypeExtensionManipulator）

[`\Nuwave\Lighthouse\Support\Contracts\TypeExtensionManipulator`](https://github.com/nuwave/lighthouse/tree/master/src/Support/Contracts/TypeExtensionManipulator.php)
接口可以用于从类型扩展节点操纵 AST 。
