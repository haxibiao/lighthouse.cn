# 模式组（Schema Organisation）

随着您向模式（schema）中添加越来越多的类型，它可能会变得很大。
了解如何将模式（schema）拆分为多个文件并组织类型。

## 模式导入（Schema Imports）

假设您创建了这样的模式（schema）文件：

```
graphql/
|-- schema.graphql
|-- user.graphql
```

Lighthouse 从单个入口点读取模式（schema），在本例中为 `schema.graphql` 。
您可以从那里导入其他模式（schema）文件，以将您的模式（schema）分割为多个文件。

```graphql
type Query {
    user: User
}

#import user.graphql
```

导入总是在单独的一行上以 `#import` 开始，然后是导入文件的相对路径。
`user.graphql` 的内容被粘贴到最终的模式中。

```graphql
type Query {
    user: User
}

type User {
    name: String!
}
```

import 语句是递归执行的，因此即使是最复杂的模式（schema）也很容易组织。

您还可以使用通配符导入语法导入多个文件。
例如，如果你有这样的模式（schema）文件:

```
graphql/
  |-- schema.graphql
  |-- post/
    |-- post.graphql
    |-- category.graphql
```

您可以导入多个匹配某个模式（schema）的文件，而不是为每个文件命名。
它将使用 PHP 的 [glob 函数](http://php.net/manual/function.glob.php) 加载。

```graphql
#import post/*.graphql
```

## 类型扩展（Type Extensions）

假设您想在模式中添加一个新类型 `Post` 。
创建一个新的文件 `post.graphql` 与该类型的模式。

```graphql
type Post {
    title: String
    author: User @belongsTo
}
```

然后将导入添加到主模式文件中。

```graphql
#import post.graphql

type Query {
    me: User @auth
}
```

现在您需要添加一些查询来实际获取 Post 。您可以将它们添加到主文件中的主 `Query` 类型中，但这将分散定义，而且还可能随着时间的推移而变得非常大。

另一种方法是扩展 `Query` 类型，并将类型定义与 `post.graphql` 中的查询关联起来。

```graphql
type Post {
    title: String
    author: User @belongsTo
}

extend type Query {
    posts: [Post!]! @paginate
}
```

`extend type` 定义中的字段将与原始类型中的字段合并。

### Root 定义（Root Definitions）

根架构中必须有至少一个字段的有效 `Query` 类型定义。
这是因为 `extend type` 需要合并到原始类型中。

你可以在 Root 模式中提供一个空的 `Query` 类型(没有花括号):

```graphql
type Query

#import post.graphql
```

对于 mutation 也是一样：如果你想使用它们，你可以在 Root 模式中定义一个空的 `Mutation` 类型(没有花括号)：

```graphql
type Query

type Mutation

#import post.graphql
```

### 扩展其他类型（Extending other types）

除了对象类型，您还可以扩展 `input` 、 `interface` 和 `enum` 类型。
Lighthouse 会将字段(或值)与原始定义合并，并总是在最终的模式（schema）中生成单个类型。
