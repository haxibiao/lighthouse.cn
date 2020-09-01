module.exports = [
    {
        title: '开始 (Getting Started)',
        children: [
            'getting-started/installation',
            'getting-started/configuration',
            'getting-started/migrating-to-lighthouse'
        ]
    },
    {
        title: '基础 (The Basic)',
        children: [
            'the-basics/schema',
            'the-basics/types',
            'the-basics/fields',
            'the-basics/directives',
        ]
    },
    {
        title: 'Eloquent',
        children: [
            ['eloquent/getting-started', '入门（Getting Started）'],
            'eloquent/relationships',
            'eloquent/polymorphic-relationships',
            'eloquent/soft-deleting',
            'eloquent/nested-mutations',
            'eloquent/complex-where-conditions',
        ]
    },
    {
        title: "测试 (Testing)",
        children: [
            'testing/phpunit',
            'testing/extensions',
        ],
    },
    {
        title: '订阅 (Subscriptions)',
        children: [
            ['subscriptions/getting-started', '入门（Getting Started）'],
            'subscriptions/defining-fields',
            'subscriptions/trigger-subscriptions',
            'subscriptions/filtering-subscriptions',
            'subscriptions/client-implementations',
        ]
    },
    {
        title: '深入 (Digging Deeper)',
        children: [
            'digging-deeper/schema-organisation',
            'digging-deeper/relay',
            'digging-deeper/error-handling',
            'digging-deeper/adding-types-programmatically',
            'digging-deeper/file-uploads',
            'digging-deeper/extending-lighthouse'
        ]
    },
    {
        title: '自定义 Directive (Custom Directives)',
        children: [
            ['custom-directives/getting-started', '入门（Getting Started）'],
            'custom-directives/type-directives',
            'custom-directives/field-directives',
            'custom-directives/argument-directives',
        ]
    },
    {
        title: '安全 (Security)',
        children: [
            'security/authentication',
            'security/authorization',
            'security/validation',
            'security/sanitization',
            ['security/resource-exhaustion', 'Resource Exhaustion'],
        ]
    },
    {
        title: '性能 (Performance)',
        children: [
            'performance/schema-caching',
            ['performance/n-plus-one', 'The N+1 Query Problem'],
            'performance/deferred',
            'performance/tracing',
            'performance/server-configuration',
        ]
    },
    {
        title: '概念 (Concepts)',
        children: [
            'concepts/arg-resolvers',
        ]
    },
    {
        title: 'API 参考 (API Reference)',
        children: [
            'api-reference/directives',
            'api-reference/resolvers',
            'api-reference/scalars',
            'api-reference/events',
            'api-reference/commands',
        ]
    },
];
