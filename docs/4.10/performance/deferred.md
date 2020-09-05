# 递延字段（Deferred Fields）

::: warning
目前 `@defer` 指令在 alpha 中需要 Apollo 客户端。
跟踪 PR 的状态：https://github.com/apollographql/apollo-client/pull/3686
:::

延迟字段允许您尽可能快地对抓取数据进行优先排序，以呈现最重要的内容，然后在后台加载页面的其余部分。

Lighthouse 通过 `DeferExtension` 扩展增加了对实验性的 `@defer` 指令的支持。
[点击这里了解更多信息](https://www.apollographql.com/docs/react/features/defer-support.html)。

## 设置（Setup）

将服务提供者（Service Provider）添加到 `config/app.php` 中

```php
'providers' => [
    \Nuwave\Lighthouse\Defer\DeferServiceProvider::class,
],
```

<br />

![defer_example](https://user-images.githubusercontent.com/1976169/48140644-71e25500-e266-11e8-924b-08ee2f7318d1.gif)
_(image from [https://blog.apollographql.com/introducing-defer-in-apollo-server-f6797c4e9d6e](https://blog.apollographql.com/introducing-defer-in-apollo-server-f6797c4e9d6e))_
