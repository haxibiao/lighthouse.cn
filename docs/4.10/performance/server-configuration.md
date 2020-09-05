# 服务器配置（Server configuration）

您可以为 Lighthouse 调优 PHP 服务器的配置。

## OPcache

Lighthouse 的模式操作的性质与 [PHP 的 OPcache](https://php.net/manual/de/book.opcache.php) 非常匹配。
如果您可以自由地将其安装到服务器上，那么这是获得良好性能提升的一种简单方法。

## Xdebug

启用 Xdebug 和拥有一个活动的调试会话会将执行速度降低一个数量级。
