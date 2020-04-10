# 定义字段（Fields）

在模式（schema）的 Root `Subscription` 类型上将您的订阅（subscriptions）定义为字段（field）。

```graphql
type Subscription {
    postUpdated(author: ID): Post
}
```

定义这样一个字段最快的方法就是使用命令 `artisan` 来生成。

    php artisan lighthouse:subscription PostUpdated

Lighthouse 将默认查找在订阅（subscription）名称路径 `App\GraphQL\Subscriptions\` 中定义的字段（field）的大写名称的类。
例如，`postUpdated` 字段（field）就应该在 `App\GraphQL\Subscriptions\PostUpdated` 有一个对应的类。

所有订阅字段类（subscription field class）都**必须**实现抽象类（abstract class）`Nuwave\Lighthouse\Schema\Types\GraphQLSubscription` 并实现
`authorize` 和 `filter` 两个方法。

```php
<?php

namespace App\GraphQL\Subscriptions;

use App\User;
use App\Post;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Subscriptions\Subscriber;
use Nuwave\Lighthouse\Schema\Types\GraphQLSubscription;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

class PostUpdated extends GraphQLSubscription
{
    /**
     * Check if subscriber is allowed to listen to the subscription.
     *
     * @param  \Nuwave\Lighthouse\Subscriptions\Subscriber  $subscriber
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    public function authorize(Subscriber $subscriber, Request $request): bool
    {
        $user = $subscriber->context->user;
        $author = User::find($subscriber->args['author']);

        return $user->can('viewPosts', $author);
    }

    /**
     * Filter which subscribers should receive the subscription.
     *
     * @param  \Nuwave\Lighthouse\Subscriptions\Subscriber  $subscriber
     * @param  mixed  $root
     * @return bool
     */
    public function filter(Subscriber $subscriber, $root): bool
    {
        $user = $subscriber->context->user;

        // Don't broadcast the subscription to the same
        // person who updated the post.
        return $root->updated_by !== $user->id;
    }

    /**
     * Encode topic name.
     *
     * @param  \Nuwave\Lighthouse\Subscriptions\Subscriber  $subscriber
     * @param  string  $fieldName
     * @return string
     */
    public function encodeTopic(Subscriber $subscriber, string $fieldName): string
    {
        // Optionally create a unique topic name based on the
        // `author` argument.
        $args = $subscriber->args;

        return Str::snake($fieldName).':'.$args['author'];
    }

    /**
     * Decode topic name.
     *
     * @param  string  $fieldName
     * @param  \App\Post  $root
     * @return string
     */
    public function decodeTopic(string $fieldName, $root): string
    {
        // Decode the topic name if the `encodeTopic` has been overwritten.
        $author_id = $root->author_id;

        return Str::snake($fieldName).':'.$author_id;
    }

    /**
     * Resolve the subscription.
     *
     * @param  \App\Post  $root
     * @param  mixed[]  $args
     * @param  \Nuwave\Lighthouse\Support\Contracts\GraphQLContext  $context
     * @param  \GraphQL\Type\Definition\ResolveInfo  $resolveInfo
     * @return mixed
     */
    public function resolve($root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo): Post
    {
        // Optionally manipulate the `$root` item before it gets broadcasted to
        // subscribed client(s).
        $root->load(['author', 'author.achievements']);

        return $root;
    }
}
```

如果默认的名称空间（default namespaces）不适合您的应用程序结构，或者您希望自定义实现类的位置，您可以使用 [`@subscription`](../api-reference/directives.md#subscription) 指令来指向一个不同的类。
