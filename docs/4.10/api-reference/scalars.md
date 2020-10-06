# Scalars

您可以通过在模式中定义它们来使用 Lighthouse 的内置 scalars ，并使用 [`@scalar`](directives.md#scalar) 将它们指向 FQCN 。

```graphql
"A datetime string with format `Y-m-d H:i:s`, e.g. `2018-01-01 13:00:00`."
scalar DateTime @scalar(class: "Nuwave\\Lighthouse\\Schema\\Types\\Scalars\\DateTime")

type Query {
  "Get the local server time."
  now: DateTime!
}
```

## Date

```graphql
"A date string with format `Y-m-d`, e.g. `2011-05-23`."
scalar Date @scalar(class: "Nuwave\\Lighthouse\\Schema\\Types\\Scalars\\Date")
```

内部表示为 `Carbon\Carbon` 的实例。

## DateTime

```graphql
"A datetime string with format `Y-m-d H:i:s`, e.g. `2018-01-01 13:00:00`."
scalar DateTime @scalar(class: "Nuwave\\Lighthouse\\Schema\\Types\\Scalars\\DateTime")
```

内部表示为 `Carbon\Carbon` 的实例。

## Upload

```graphql
"Can be used as an argument to upload files using https://github.com/jaydenseric/graphql-multipart-request-spec" 
scalar Upload @scalar(class: "Nuwave\\Lighthouse\\Schema\\Types\\Scalars\\Upload")
```

此 Scalar 只能用作参数，不能用作返回类型。
有关更多信息，请参阅 [文件上传指南](../digging-deeper/file-uploads.md)。

多部分表单请求由 Lighthouse 处理，解析器将在参数 `array $variables` 中传递 [`\Illuminate\Http\UploadedFile`](https://laravel.com/api/5.8/Illuminate/Http/UploadedFile.html) 的实例。
