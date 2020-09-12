# Eloquent 关系（Eloquent Relationships）

就像在 Laravel 中一样，您可以在您的模式中定义有 [Eloquent 关系](https://laravel.com/docs/eloquent-relationships)。

假设您定义了以下模型：

```php
<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

只需向类型中添加字段，它们的名称就像关系一样：

```graphql
type Post {
    author: User
    comments: [Comment!]
}
```

因为可以像访问模型上的常规属性一样访问 Laravel 关系，所以默认的字段解析器工作得很好。

## 避免 N+1 性能问题

当将 Eloquent 关系作为属性访问时，关系数据是 “延迟加载的”。
这意味着在您第一次访问该属性之前，关系数据不会实际加载。

这导致了 GraphQL 查询嵌套特性带来的一个常见的性能缺陷：所谓的 N+1 查询问题。
[学习更多的知识](../performance/n-plus-one.md)。

当您使用 Lighthouse 的内置关系指令装饰关系字段时，查询将通过一种称为*批量加载*的技术自动组合。
这意味着无需做太多工作就可以获得更少的数据库请求和更好的性能。

> 批处理加载可能不会为所有用例提供理想的性能。
> 可以通过将配置选项 `batchload_relations` 设置为 `false` 来关闭它。

## 一对一

使用 [@hasOne](../api-reference/directives.md#hasone) 指令定义模式中两种类型之间的 [一对一关系](https://laravel.com/docs/eloquent-relationships#one-to-one)。

```graphql
type User {
    phone: Phone @hasOne
}
```

反向可以通过 [@belongsTo](../api-reference/directives.md#belongsto) 指令定义。

```graphql
type Phone {
    user: User @belongsTo
}
```

## 一对多

使用 [@hasMany](../api-reference/directives.md#hasmany) 指令定义[一对多关系](https://laravel.com/docs/eloquent-relationships#one-to-many)。

```graphql
type Post {
    comments: [Comment!]! @hasMany
}
```

同样，反向是用 [@belongsTo](../api-reference/directives.md#belongsto) 指令定义的。

```graphql
type Comment {
    post: Post! @belongsTo
}
```

## 多对多

虽然在 Laravel 中设置 [多对多关系](https://laravel.com/docs/eloquent-relationships#many-to-many) 要做一些工作，但在 Lighthouse 中定义它们却轻而易举。使用 [@belongsToMany](../api-reference/directives.md#belongstomany) 指令来定义它。

```graphql
type User {
    roles: [Role!]! @belongsToMany
}
```

设置相反的关系也是一样的。

```graphql
type Role {
    users: [User!]! @belongsToMany
}
```

## 重命名关系

当您定义一个关系时，Lighthouse 假设字段和关系方法具有相同的名称。
如果需要以不同的方式命名字段，则必须指定方法的名称。

```
type Post {
  author: User! @belongsTo(relation: "user")
}
```

这将适用于以下模型：

```php
<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```
