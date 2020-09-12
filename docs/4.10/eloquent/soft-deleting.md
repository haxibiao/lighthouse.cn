# 软删除（Soft Deleting）

Lighthouse 为使用 [软删除](https://laravel.com/docs/eloquent#soft-deleting) 的模型提供了方便的助手。

## 过滤器软删除模型（Filter Soft Deleted Models）

如果你的模型使用了 `Illuminate\Database\Eloquent\SoftDeletes` 特性，你可以在一个字段中添加 [`@softDeletes`](../api-reference/directives.md#softdeletes) 指令，这样就可以只查询 `onlyTrashed` 、 `withTrashed` 或 `withoutTrashed` 元素。

```graphql
type Query {
  flights: [Flight!]! @all @softDeletes
}
```

Lighthouse 会自动在字段定义中添加一个 `trashed` 的参数，并包括 `Trashed` 的枚举。

```graphql
type Query {
  flights(trashed: Trashed @trashed): [Flight!]! @all
}

"""
Used for filtering 
"""
enum Trashed {
    ONLY @enum(value: "only")
    WITH @enum(value: "with")
    WITHOUT @enum(value: "without")
}
```
您可以包括软删除模型在您的结果与查询如下：

```graphql
{
  flights(trashed: WITH) {
    id
  }
}
```

## 恢复软删除模型（Restoring Soft Deleted Models）

如果您的模型使用了 `Illuminate\Database\Eloquent\SoftDeletes` ，您可以使用 [`@restore`](../api-reference/directives.md#restore) 指令恢复您的模型。

```graphql
type Mutation {
  restoreFlight(id: ID!): Flight @restore
}
```

只需调用具有要恢复的 flight ID 的字段。

```graphql
mutation {
  restoreFlight(id: 1) {
    id
  }
}
```
此 mutation 将返回已恢复的对象。

## 永久删除模型（Permanently Deleting Models）

要真正从数据库中删除模型，可以使用 [@forceDelete](../api-reference/directives.md#forcedelete) 指令。
您的模型必须使用 `Illuminate\Database\Eloquent\SoftDeletes` 特性。

```graphql
type Mutation {
  forceDeleteFlight(id: ID!): Flight @forceDelete
}
```

只需使用您想永久删除的 `Flight` 的 ID 调用它。

```graphql
mutation {
  forceDeleteFlight(id: 5){
    id
  }
}
```

此 mutation 将返回已删除的对象，这将是您最后一次机会查看此数据的机会。

```json
{
  "data": {
    "forceDeleteFlight": {
      "id": 5
    }
  }
}
```
