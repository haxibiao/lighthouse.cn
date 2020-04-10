# 筛选订阅（Filtering Subscriptions）

有时您需要根据客户端提供的参数过滤掉（filter）特定事件（events）。
要处理此问题，可以从 `filter` 函数返回 true/false ，以指示客户端是否应接收订阅（subscription）。
例如，使用以下示例：

```graphql
subscription onPostUpdated($post_id: ID!) {
    postUpdated(post_id: $post_id) {
        id
        title
        content
    }
}
```

为了确保只有订阅（subscribed）了某个 `post_id` 的客户端才能收到更新，我们可以创建一个 `filter`：

```php
namespace App\GraphQL\Subscriptions;

use Nuwave\Lighthouse\Schema\Subscriptions\Subscriber;
use Nuwave\Lighthouse\Schema\Types\GraphQLSubscription;

class PostUpdatedSubscription extends GraphQLSubscription
{
    /**
     * Filter which subscribers should receive the subscription.
     *
     * @param  \Nuwave\Lighthouse\Subscriptions\Subscriber  $subscriber
     * @param  mixed  $root
     * @return bool
     */
    public function filter(Subscriber $subscriber, $root): bool
    {
        // Clients arguments when subscribing
        $args = $subscriber->args;

        // Ensure that the Post ($root) id matches
        // the requested `post_id`
        return $root->id == $args['post_id'];
    }
}
```
