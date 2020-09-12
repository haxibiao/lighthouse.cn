# 嵌套 Mutation（Nested Mutations）

Lighthouse 允许您在一次 mutation 中创建、更新或删除模型及其关联关系。这是由 [嵌套的参数解析器机制](../concepts/arg-resolvers.md) 启用的。

## 返回类型要求（Return Types Required）

你必须在你的关系方法上定义返回类型，这样 Lighthouse 可以才检测的到它们。

```php
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model 
{
    // WORKS
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // DOES NOT WORK
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}
```

## 部分失败（Partial Failure）

默认情况下，所有 mutations 都包装在一个数据库事务中。
如果任何嵌套操作失败，则整个 mutations 将中止并且不向数据库写入任何更改。

您可以在 [配置](../getting-started/configuration.md) 中更改此设置。

## 属于（Belongs To）

我们将从定义一个 mutation 来创建一个 post 开始。

```graphql
type Mutation {
  createPost(input: CreatePostInput! @spread): Post @create
}
```

该 mutation 接受单个参数 `input` ，其中包含关于要创建的 Post 的数据。

```graphql
input CreatePostInput {
  title: String!
  author: CreateUserBelongsTo
}
```
第一个参数 `title` 是 `Post` 本身的一个值，对应于数据库中的一列。

第二个参数 `author` 的命名与 `Post` 模型上定义的关系方法相同。嵌套的 `BelongsTo` 关系公开了以下操作：

- 将其 `connect` 到现有的模型
- `create` 一个新的相关模型并附加它
- `update` 现有模型并附加它
- `upsert` 一个新的或现有的模型并附加它
- `disconnect` 相关的模型
- `delete` 相关的模型和关联

在更新的上下文中， `disconnect` 和 `delete` 都没有太大意义。
您可以通过在 `input` 中定义您需要的内容来控制哪些操作是可能的。
我们选择在相关的 `User` 模型上公开以下操作：

```graphql
input CreateUserBelongsTo {
  connect: ID
  create: CreateUserInput
  update: UpdateUserInput
  upsert: UpsertUserInput
}
```

最后，您需要定义允许您创建新 `User` 的输入。

```graphql
input CreateUserInput {
  name: String!
}
```

要创建新模型并将其连接到现有模型，只需传递您想关联的模型的 ID 。

```graphql
mutation {
  createPost(input: {
    title: "My new Post"
    author: {
      connect: 123
    }
  }){
    id
    author {
      name
    }
  }
}
```

Lighthouse 将创建一个新 `Post` ，并将一个 `User` 与之关联。

```json
{
  "data": {
    "createPost": {
      "id": 456,
      "author": {
        "name": "Herbert"
      }
    }
  }
}
```

如果相关的模型还不存在，您也可以创建一个新的。

```graphql
mutation {
  createPost(input: {
    title: "My new Post"
    author: {
      create: {
        name: "Gina"
      }  
    }
  }){
    id
    author {
      id
    }
  }
}
```

```json
{
  "data": {
    "createPost": {
      "id": 456,
      "author": {
        "id": 55
      }
    }
  }
}
```

在发布更新时，您还可以允许用户删除关联。 `disconnect` 和 `delete` 都删除了与 author 的关联，但是 `delete` 也删除了 author 模型本身。

```graphql
type Mutation {
  updatePost(input: UpdatePostInput! @spread): Post @update
}

input UpdatePostInput {
  id: ID!
  title: String
  author: UpdateUserBelongsTo
}

input UpdateUserBelongsTo {
  connect: ID
  create: CreateUserInput
  update: UpdateUserInput
  upsert: UpdateUserInput
  disconnect: Boolean
  delete: Boolean
}
```

您必须传递一个真实值来 `disconnect` 和 `delete` ，以便它们真正运行。
之所以选择这个结构，是因为它与更新 `BelongsToMany` 关系一致，并且允许查询字符串基本上是静态的，使用一个可变值来控制它的行为。

```graphql
mutation UpdatePost($disconnectAuthor: Boolean){
  updatePost(input: {
    id: 1
    title: "An updated title"
    author: {
      disconnect: $disconnectAuthor
    }
  }){
    title
    author {
      name
    }
  }
}
```

只有当变量 `$disconnectAuthor` 的值为 `true` 时， `author` 关系才会断开连接，如果传递了 `false` 或 `null` ，则不会改变。

```json
{
  "data": {
    "updatePost": {
      "id": 1,
      "title": "An updated title",
      "author": null
    }
  }
}
```

在发出 `upsert` 时，可以公开与 `update` 相同的嵌套操作。在创建新模型的情况下，它们将被简单地忽略。

```graphql
mutation UpdatePost($disconnectAuthor: Boolean){
  upsertPost(input: {
    id: 1
    title: "An updated or created title"
    author: {
      disconnect: $disconnectAuthor
    }
  }){
    id
    title
    author {
      name
    }
  }
}
```

```json
{
  "data": {
    "upsertPost": {
      "id": 1,
      "title": "An updated or created title",
      "author": null
    }
  }
}
```

## 更多（Has Many）

 `BelongsTo` 关系的对应物是 `HasMany` 。
 我们将从定义一个 mutation 来创建一个 `User` 开始。

```graphql
type Mutation {
  createUser(input: CreateUserInput! @spread): User @create
}
```

这个 mutation 接受一个参数 `input` ，该参数输入包含 `User` 本身及其关联的 `Post` 模型的值。

```graphql
input CreateUserInput {
  name: String!
  posts: CreatePostsHasMany
}
```

现在，我们可以公开一个操作，该操作允许我们在创建 `User` 时直接创建新 post 。

```graphql
input CreatePostsHasMany {
  create: [CreatePostInput!]!
}

input CreatePostInput {
  title: String!
}
```

我们现在可以在一个请求中创建一个 `User` 和一些 post 。

```graphql
mutation {
  createUser(input: {
    name: "Phil"
    posts: {
      create: [
        {
          title: "Phils first post"
        },
        {
          title: "Awesome second post"
        }
      ]  
    }
  }){
    id
    posts {
      id
    }
  }
}
```

```json
{
  "data": {
    "createUser": {
      "id": 23,
      "posts": [
        {
          "id": 434
        },
        {
          "id": 435
        }
      ]
    }
  }
}
```
当更新 `User` 时，进一步的嵌套操作成为可能。
希望通过模式定义公开哪些内容，这取决于您自己。

下面的示例几乎涵盖了所有可能的操作：

```graphql
type Mutation {
  updateUser(input: UpdateUserInput! @spread): User @update
}

input UpdateUserInput {
  id: ID!
  name: String
  posts: UpdatePostsHasMany
}

input UpdatePostsHasMany {
  create: [CreatePostInput!]
  update: [UpdatePostInput!]
  upsert: [UpsertPostInput!]
  delete: [ID!]
}

input CreatePostInput {
  title: String!
}

input UpdatePostInput {
  id: ID!
  title: String
}

input UpsertPostInput {
  id: ID!
  title: String
}
```

```graphql
mutation {
  updateUser(input: {
    id: 3,
    name: "Phillip"
    posts: {
      create: [
        {
          title: "A new post"
        }
      ],
      update: [
        {
          id: 45,
          title: "This post is updated"
        }
      ],
      delete: [
        8,
      ]
    }
  }){
    id
    posts {
      id
    }
  }
}
```

`upsert` 的行为介于更新和创建之间，它将生成所需的操作，而不管模型是否存在。

## 属于更多（Belongs To Many）

属于许多关系，也允许您创建新的相关模型如附加现有的。

```graphql
type Mutation {
  createPost(input: CreatePostInput! @spread): Post @create
}

input CreatePostInput {
  title: String!
  authors: CreateAuthorBelongsToMany
}

input CreateAuthorBelongsToMany {
  create: [CreateAuthorInput!]
  upsert: [UpsertAuthorInput!]
  connect: [ID!]
  sync: [ID!]
}

input CreateAuthorInput {
  name: String!
}

input UpsertAuthorInput {
  id: ID!
  name: String!
}
```

只需传递您想要关联的模型的 ID 或它们的完整信息
来创建一个新的关系。

```graphql
mutation {
  createPost(input: {
    title: "My new Post"
    authors: {
      create: [
        {
          name: "Herbert"
        }
      ]
      upsert: [
        {
          id: 2000
          name: "Newton"
        }
      ]
      connect: [
        123
      ]
    }
  }){
    id
    authors {
      name
    }
  }
}
```

Lighthouse 将检测关系并附加、更新或创建它。

```json
{
  "data": {
    "createPost": {
      "id": 456,
      "authors": [
        {
          "id": 165,
          "name": "Herbert"
        },
        {
          "id": 2000,
          "name": "Newton"
        },
        {
          "id": 123,
          "name": "Franz"
        }
      ]
    }
  }
}
```
也可以使用 `sync` 操作来确保关联中只包含给定的 id 。

```graphql
mutation {
  createPost(input: {
    title: "My new Post"
    authors: {
      sync: [
        123
      ]
    }
  }){
    id
    authors {
      name
    }
  }
}
```

对 `BelongsToMany` 关系的更新可能会暴露额外的嵌套操作：

```graphql
input UpdateAuthorBelongsToMany {
  create: [CreateAuthorInput!]
  connect: [ID!]
  update: [UpdateAuthorInput!]
  upsert: [UpsertAuthorInput!]
  sync: [ID!]
  syncWithoutDetaching: [ID!]
  delete: [ID!]
  disconnect: [ID!]
}
```

### 存储主数据（Storing Pivot Data）

多对多关系通常在数据 pivot 表中存储一些额外的数据。
假设我们想要跟踪 user 看过的 movies 。除了连接这两个实体，我们想存储他们有多喜欢它：

```graphql
type User {
    id: ID!
    seenMovies: [Movie!] @belongsToMany
}

type Movie {
    id: ID!
    pivot: UserMoviePivot
}

type UserMoviePivot {
    "How well did the user like the movie?"
    rating: String
}
```

Laravel 的 `sync()` 、 `syncWithoutDetach()` 或 `connect()` 方法允许传递一个数组，其中键是相关模型的 id，值是枢轴数据。

Lighthouse 通过对多对多关系的嵌套操作来公开此功能。
您可以定义一个也包含 pivot 数据的 `input` 类型，而不只是传递一个 id 列表。它必须包含一个名为 `id` 的字段来包含相关模型的 ID ，所有其他字段将被插入到 pivot 表中。

```graphql
type Mutation {
    updateUser(input: UpdateUserInput! @spread): User @update
}

input UpdateUserInput {
    id: ID!
    seenMovies: UpdateUserSeenMovies
}

input UpdateUserSeenMovies {
    connect: [ConnectUserSeenMovie!]
}

input ConnectUserSeenMovie {
    id: ID!
    rating: String
}
```

现在，在将 user 连接到 movies 时，可以传递 pivot 数据：

```graphql
mutation {
  updateUser(input: {
    id: 1
    seenMovies: {
      connect: [
        {
          id: 6
          rating: "A perfect 5/7"
        }
        {
          id: 23
        }
      ]
    },
  }) {
    id
    seenMovies {
      id
      pivot {
        rating
      }
    }
  }
}
```

您将得到以下返回的数据：

```json
{
  "data": {
    "updateUser": {
      "id": 1,
      "seenMovies": [
        {
          "id": 6,
          "pivot": {
            "rating": "A perfect 5/7"
          }
        },
        {
          "id": 20,
          "pivot": {
            "rating": null
          }
        }
      ]
    }
  }
}
```

也可以使用 `sync` 和 `syncWithoutDetach` 操作。

## 改变（Morph To）

__GraphQL 规范不支持输入联合类型，目前我们将此实现限制为 `connect` 、 `disconnect` 和 `delete`操作。更多讨论请参见：https://github.com/nuwave/lighthouse/issues/900 。__

```graphql
type Task {
  id: ID
  name: String
}

type Image {
  id: ID
  url: String
  imageable: Task
}

type Mutation {
  createImage(input: CreateImageInput! @spread): Image @create
  updateImage(input: UpdateImageInput! @spread): Image @update
  upsertImage(input: UpsertImageInput! @spread): Image @upsert
}

input CreateImageInput {
  url: String
  imageable: CreateImageableMorphTo
}

input UpdateImageInput {
  id: ID!
  url: String
  imageable: UpdateImageableMorphTo
}

input UpsertImageInput {
  id: ID!
  url: String
  imageable: UpsertImageableMorphTo
}

input CreateImageableMorphTo {
  connect: ConnectImageableInput
}

input UpdateImageableMorphTo {
  connect: ConnectImageableInput
  disconnect: Boolean
  delete: Boolean
}

input UpsertImageableMorphTo {
  connect: ConnectImageableInput
  disconnect: Boolean
  delete: Boolean
}

input ConnectImageableInput {
  type: String!
  id: ID!
}
```
您可以使用 `connect` 来关联现有的模型。

```graphql
mutation {
  createImage(input: {
    url: "https://cats.example/cute"
    imageable: {
      connect: {
        type: "App\\Models\\Task"
        id: 1
      }
    }
  }) {
    id
    url
    imageable {
      id
      name
    }
  }
}
```

`disconnect` 操作允许您分离当前关联的模型。

```graphql
mutation {
  updateImage(input: {
    id: 1
    url: "https://dogs.example/supercute"
    imageable: {
      disconnect: true
    }
  }) {
    url
    imageable {
      id
      name
    }
  }
}
```

`delete` 操作分离并删除当前关联的模型。

```graphql
mutation {
  upsertImage(input: {
    id: 1
    url: "https://bizniz.example/serious"
    imageable: {
      delete: true
    }
  }) {
    url
    imageable {
      id
      name
    }
  }
}
```

## 改变更多

对许多关系的变形也允许你创建新的相关模型如附加现有的。

```graphql
type Mutation {
  createTask(input: CreateTaskInput! @spread): Task @create
}

input CreateTaskInput {
  name: String!
  tags: CreateTagMorphToMany
}

input CreateTagMorphToMany {
  create: [CreateTagInput!]
  upsert: [UpsertTagInput!]
  sync: [ID!]
  connect: [ID!]
}

input CreateTagInput {
  name: String!
}

input UpsertTagInput {
  id: ID!
  name: String!
}


type Task {
  id: ID!
  name: String!
  tags: [Tag!]!
}

type Tag {
  id: ID!
  name: String!
}
```

在本例中，id 为 `1` 的标记已经存在于数据库中。查询使用 `MorphToMany` 关系将此标记连接到任务。
 
```graphql
mutation {
  createTask(input: {
    name: "Loundry"
    tags: {
      connect: [1]
    }
  }) {
    tags {
      id
      name
    }
  }
}
```

您可以在创建过程中使用 `connect` 或 `sync` 。

当你想在创建任务的同时创建一个新的标签时，你需要使用 `create` 操作来提供一个数组的 `CreateTagInput` ，或者使用 `upsert` 操作来提供一个数组的`UpsertTagInput` ：

```graphql
mutation {
  createTask(input: {
    name: "Loundry"
      tags: {
        create: [
          {
            name: "home"
          }
        ]
      }
  }) {
    tags {
      id
      name
    }
  }
}
```
