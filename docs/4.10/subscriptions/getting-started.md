# Subscriptions：入门指南

订阅使 GraphQL 客户端可以观察特定事件（specific events），并在事件（events）发生时从服务器接收更新。

::: tip 注意
应该将大部分功劳归功于 [Ruby implementation](https://github.com/rmosolgo/graphql-ruby/blob/master/guides/subscriptions/overview.md) ，因为它们为有关后端该如何实现提供了很好的概述。
:::

## 设置（Setup）

安装 [Pusher PHP Library](https://github.com/pusher/pusher-http-php) 用来与 Pusher HTTP API 进行交互。

    composer require pusher/pusher-php-server

将服务提供者（service provider）添加到您的 `config/app.php`

```php
'providers' => [
    \Nuwave\Lighthouse\Subscriptions\SubscriptionServiceProvider::class,
],
```

### Pusher Webhook（钩子）

订阅（Subscriptions）不会自行结束。
除非订阅（Subscriptions）被删除，否则客户端断开连接后，它也会继续广播事件。


使用 `Presence` 钩子（Webhook）可以解决上面这个问题。
当 Pusher 通讯（Pusher channel）被放弃也就是取消订阅（unsubscribed）时，它将触发 webhook，这将通知 Lighthouse 删除订阅。

Webhook URL 通常是：

```
/graphql/subscriptions/webhook
```

您可以在 Pusher Dashboard 中添加 Webhook 选择类型 `Presence`.
