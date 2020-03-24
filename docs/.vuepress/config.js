const versioning = require("./lib/versioning.js");

module.exports = {
    title: "Lighthouse 中文网",
    description:
        "适用于 Laravel 的 GraphQL 服务器支持，PHP 实现 GraphQL 服务，Lighthouse 中文网，提供 Lighthouse-php 中文文档",
    locales: {
        "/": {
            lang: "zh-CN"
        }
    },
    head: [
        [
            "meta",
            {
                name: "title",
                content:
                    "Lighthouse 中文网，提供 Lighthouse-php 中文文档"
            }
        ],
        [
            "meta",
            {
                name: "keywords",
                content:
                    "Laravel,Laravel Lighthouse,GraphQL,Lighthouse,Lighthouse-php,Lighthouse php,Lighthouse 中文,Laravel 中文,Laravel 文档,Lighthouse-php 文档"
            }
        ],
        [
            "link",
            {
                rel: "icon",
                href: "/favicon.png"
            }
        ],
        [
            "link",
            {
                rel: "stylesheet",
                type: "text/css",
                href:
                    "https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,800,800i,900,900i"
            }
        ],
        [
            "link",
            {
                rel: "stylesheet",
                type: "text/css",
                href:
                    "https://fonts.googleapis.com/css?family=Miriam+Libre:400,700"
            }
        ],
        [
            "script",
            {
                async: "",
                src:
                    "https://www.googletagmanager.com/gtag/js?id=UA-140886138-4"
            }
        ],
        [
            "script",
            {},
            `window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'UA-140886138-4');`
        ]
    ],
    theme: "default-prefers-color-scheme",
    themeConfig: {
        defaultTheme: "light",
        logo: "/logo.svg",
        editLinks: true, //  "Edit this page" at the bottom of each page
        lastUpdated: "Last Updated", //  "Last Updated" at the bottom of each page
        repo: "nuwave/lighthouse", //  Github repo
        docsDir: "docs/", //  Github repo docs folder
        versions: {
            latest: versioning.versions.latest,
            selected: versioning.versions.latest,
            all: versioning.versions.all
        },
        nav: [
            {
                text: "文档",
                items: versioning.linksFor("getting-started/installation.md") // TODO create custom component
            },
            {
                text: "入门",
                link: "/tutorial/"
            },
            {
                text: "资源",
                link: "/resources/"
            },
            {
                text: "用户",
                link: "/users/"
            },
            {
                text: "更新日志",
                link:
                    "https://github.com/nuwave/lighthouse/blob/master/CHANGELOG.md"
            },
            {
                text: "升级指南",
                link:
                    "https://github.com/nuwave/lighthouse/blob/master/UPGRADE.md"
            }
        ],
        sidebar: versioning.sidebars
    },
    plugins: [
        ["@vuepress/back-to-top", true],
        ["@vuepress/medium-zoom", true],
        [
            "@vuepress/search",
            {
                searchMaxSuggestions: 10,
                // Only search the latest version, e.g. 4.3, otherwise many duplicates will show up
                test: `/${versioning.versions.latest.replace(".", "\\.")}/`
            }
        ]
    ]
};
