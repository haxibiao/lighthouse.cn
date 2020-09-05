# 参数解析器（Arg Resolvers）

要理解参数解析器（Arg Resolvers）背后的概念，您应该 [熟悉字段解析器（field resolvers）是如何组成的](https://graphql.org/learn/execution/)。

## 动机（Motivation）

参数解析器是对 GraphQL 字段执行思想的扩展，应用于输入参数。
由于 GraphQL 查询可用于从客户端获取复杂且深度嵌套的数据，因此很自然地可以假设，也可以将这种复杂数据作为输入参数传递给 query 。

GraphQL 的执行引擎允许您编写小而集中的字段解析器函数，这些函数只关心返回它直接负责的数据。这使得代码更简单，避免了重复。

但是，单个字段解析器仍然必须处理传递给它的所有输入参数。在单个函数中处理复杂的输入数据是困难的，因为它们是动态的。客户机提供的输入可以嵌套到任意深度，并且有许多不同的变体。

下面的示例显示了一个实际由多个不同操作组成的 mutation 示例。

```graphql
type Mutation {
  createTask(input: CreateTaskInput): Task!
}

input CreateTaskInput {
  name: String!
  notes: [CreateNoteInput!]
}

input CreateNoteInput {
  content: String!
  link: String
}
```

在单个请求中，我们可以传递与任务相关的所有数据，包括 notes 等相关实体。

```graphql
mutation CreateTaskWithNotes {
  createTask(
    id: 45
    name: "Do something"
    notes: [
      {
        content: "Foo bar",
        link: "http://foo.bar"
      },
      {
        content: "Awesome note"
      }
    ]
  ) {
    id
  }
}
```

我们可以通过编写一个 resolver 函数一次性处理所有输入来解决这个问题。

```php
function createTaskWithNotes($root, array $args): \App\Models\Task {
    // Pull and remove notes from the args array
    $notes = \Illuminate\Support\Arr::pull($args, 'notes');

    // Create the new task with the remaining args
    $task = \App\Models\Task::create($args);

    // If the client actually passed notes, create and attach them
    if($notes) {
        foreach($notes as $note) {
            $task->notes()->create($note);
        }
    }

    return $task;
}
```

在这个人为的例子中，函数仍然非常简单。
但是，已经违反了分离关注点：一个单独的函数负责创建任务和 notes。

我们可能希望将来扩展架构以支持更多操作，例如更新任务以及创建，更新或删除 notes 或其他更深层嵌套的关系。
这样的更改将迫使我们复制代码并增加单个函数的复杂性。

## 解决方案（Solution）

理想情况下，我们希望编写小而集中的函数，每个函数只处理给定输入参数的一部分。
执行引擎应该遍历给定的输入，并负责调用带有各自参数的适当函数。

```php
function createTask($root, array $args): \App\Models\Task {
    return \App\Models\Task::create($args);
}

function createTaskNotes(\App\Models\Task $root, array $args): void {
    foreach($args as $note) {
        $root->notes()->create($note);
    }
}
```

Lighthouse 允许将解析器函数附加到参数上。
复杂的输入被自动分割成更小的部分，并传递给负责的功能。

由于 Lighthouse 使用 SDL 作为主要构建块，所以参数解析器被实现为指令。
下面是我们如何定义允许发送嵌套 mutation 的模式，如上面的示例所示。

```diff
type Mutation {
- createTask(input: CreateTaskInput): Task!
+ createTask(input: CreateTaskInput): Task! @create
}

input CreateTaskInput {
  name: String!
- notes: [CreateNoteInput!]
+ notes: [CreateNoteInput!] @create
}

input CreateNoteInput {
  content: String!
  link: String
}
```

根据使用的上下文， `@create` 指令的行为会有所不同。

在 `createTask` 字段中，它将创建一个具有给定 `name` 的 `Task` 模型，将其保存到数据库中，并将该实例返回给 Lighthouse 。

一个适当的字段解析器的简化的，通用的实现看起来像这样：

```php
<?php

namespace Nuwave\Lighthouse\Schema\Directives;

use Illuminate\Database\Eloquent\Model;
use Nuwave\Lighthouse\Execution\Arguments\ResolveNested;
use Nuwave\Lighthouse\Schema\Values\FieldValue;
use Nuwave\Lighthouse\Support\Contracts\FieldResolver;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

class CreateDirective extends BaseDirective implements FieldResolver
{
    public function resolveField(FieldValue $fieldValue)
    {
        return $fieldValue->setResolver(
            function ($root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo): Model {
                // Wrap the operation and let Lighthouse take care of splitting the input
                $nestedSave = new ResolveNested(function($model, $args) {
                    $model->fill($args->toArray());
                    $model->save();
                });

                $modelClass = $this->getModelClass();
                /** @var \Illuminate\Database\Eloquent\Model $model */
                $model = new $modelClass;

                return $nestedSave($model, $resolveInfo->argumentSet);
            }
        );
    }
}
```

嵌套在 `notes` 中的参数将作为嵌套参数解析器处理。对于每个 `CreateNoteInput` ，解析器将与前面创建的 `Task` 一起调用，并创建并附加一个相关的 `Note` 模型。

我们可以扩展之前的 `@create` 实现，允许它作为一个 `ArgResolver` 使用：

```php
<?php

namespace Nuwave\Lighthouse\Schema\Directives;

use Illuminate\Database\Eloquent\Model;
use Nuwave\Lighthouse\Execution\Arguments\ResolveNested;
use Nuwave\Lighthouse\Schema\Values\FieldValue;
use Nuwave\Lighthouse\Support\Contracts\ArgResolver;
use Nuwave\Lighthouse\Support\Contracts\FieldResolver;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

class CreateDirective extends BaseDirective implements FieldResolver, ArgResolver
{
    public function resolveField(FieldValue $fieldValue) { ... }

    /**
     * @param  \Illuminate\Database\Eloquent\Model  $parent
     * @param  \Nuwave\Lighthouse\Execution\Arguments\ArgumentSet[]  $argsList
     * @return \Illuminate\Database\Eloquent\Model[]
     */
    public function __invoke($parent, $argsList)
    {
        $relationName = $this->getRelationName();

        /** @var \Illuminate\Database\Eloquent\Relations\Relation $relation */
        $relation = $parent->{$relationName}();
        $related = $relation->make();

        return array_map(
            function ($args) use ($related) {
                $related->fill($args->toArray());
                $related->save();
            },
            $argsList
        );
    }
}
```

您可以通过实现 [`ArgResolver`](../custom-directives/argument-directives.md#argresolver) 来定义自己的嵌套参数解析器指令。
