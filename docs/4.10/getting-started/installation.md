# 安装

本节包含的内容将教您如何安装 Lighthouse 到您的项目中去。

## 通过 composer 安装

```bash
composer require nuwave/lighthouse
```

## 发布默认的模式

Lighthouse 包含一个默认的模式，可以让您马上开始工作。使用下面的 artisan 命令发布它：

```bash
php artisan vendor:publish --provider="Nuwave\Lighthouse\LighthouseServiceProvider" --tag=schema
```

## 开发环境配置

Lighthouse 封装了大量的底层操作。为了改善您的编辑体验，可以使用 artisan 命令生成定义文件：

```bash
php artisan lighthouse:ide-helper
```

[获取 artisan 更多的帮助](../api-reference/commands.md#ide-helper)。

我们推荐使用下面的插件 👇：

| IDE      | Plugin                                               |
| -------- | ---------------------------------------------------- |
| PhpStorm | https://plugins.jetbrains.com/plugin/8097-js-graphql |

## 安装 GraphQL 测试工具

为了充分的体现 GraphQL 它的惊人之处， 我们推荐安装 [GraphQL Playground](https://github.com/mll-lab/laravel-graphql-playground)

```bash
composer require mll-lab/laravel-graphql-playground
```

安装 GraphQL Playground 之后，您可以将任何的 GraphQL 语句与 Lighthouse 结合使用。默认情况下，您只要在地址栏输入 `/graphql` 就可以看到它了。
