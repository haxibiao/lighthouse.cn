# 安全处理（Sanitization）

处理用户输入时，需要确保给定的数据有效。
虽然 [验证（validation）](validation) 是一道好的防线，但在某些情况下，修改给定输入以确保输入有效或安全是最实际的。

## 单参数（Single arguments）

处理单个值的一种好方法是使用 [`ArgTransformerDirective`](../custom-directives/argument-directives.md#argtransformerdirective) 。Lighthouse 提供了一些内置选项，但是也很容易构建你自己的。

下面是如何使用内置的 [`@trim`](../api-reference/directives.md#trim) 指令来移除给定输入字符串的空格：

```graphql
type Mutation {
    createPost(title: String @trim): Post
}
```

## 复杂的参数（Complex arguments）

当您需要查看多个输入字段以运行安全处理（Sanitization）时，您可以使用 [`FieldMiddlewareDirective`](../custom-directives/field-directives.md#fieldmiddleware) 在将给定的输入传递给最终的解析器之前对它们进行转换。
