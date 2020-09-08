# 防止资源耗尽（Preventing Resource Exhaustion）

GraphQL 为客户端提供了强大的功能。但随着 🕷 伟大的力量会带来巨大的责任。

由于客户端有可能生成非常复杂的查询，我们的服务器必须准备好正确处理它们。
这些查询可能是来自恶意客户机的滥用查询，也可能只是合法客户机使用的非常大的查询。
在这两种情况下，客户端可能会关闭 GraphQL 服务器。

*本介绍摘自 HowToGraphQL ，我们建议阅读它们关于安全性的完整章节 https://www.howtographql.com/advanced/4-security/*

您可以通过 `config/lighthouse.php` 使用内置的安全选项。
了解 [webonyx/graphql-php 提供的安全选项](http://webonyx.github.io/graphql-php/security/)

如果您实现了一些额外的安全特性，我们欢迎您的贡献!
