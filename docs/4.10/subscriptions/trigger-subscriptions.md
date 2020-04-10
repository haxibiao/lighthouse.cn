# 触发订阅（Trigger Subscriptions）

既然客户端可以订阅字段，那么当底层数据发生更改时，您就需要通知 Lighthouse。

## 广播指令 (Broadcast Directive)

[`@broadcast`](../api-reference/directives.md#broadcast) 指令将所有对 `Post` model 的更新广播 (broadcast) 到 `postUpdated` 订阅（subscription）。
```graphql
type Mutation {
    updatePost(input: UpdatePostInput!): Post
        @broadcast(subscription: "postUpdated")
}
```

您可以从多个字段（field）引用相同的订阅（subscription），也可以反过来从单个字段（field）触发多个订阅（subscription）。

## 从代码中取消订阅（Fire Subscriptions From Code）

`Subscription` 类提供了一种实用的 `broadcast` 方法，可用于从应用程序中的任何位置广播订阅（broadcast subscriptions）。

`broadcast` 方法有三个参数:

- `string $subscriptionField` 要触发的订阅字段（subscription field）的名称
- `mixed $root` 要传递的结果对象
- `bool $shouldQueue = null` 可选，覆盖默认配置 `lighthouse.subscriptions.queue_broadcasts`

以下示例显示了在更新 `Post` 模型（model）后如何触发订阅（subscription）。

```php
$post->title = $newTitle;
$post->save();

\Nuwave\Lighthouse\Execution\Utils\Subscription::broadcast('postUpdated', $post);
```
