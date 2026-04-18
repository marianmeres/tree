# @marianmeres/tree

[![NPM version](https://img.shields.io/npm/v/@marianmeres/tree)](https://www.npmjs.com/package/@marianmeres/tree)
[![JSR version](https://jsr.io/badges/@marianmeres/tree)](https://jsr.io/@marianmeres/tree)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Generic, strongly-typed [tree](https://en.wikipedia.org/wiki/Tree_(data_structure))
data structure for TypeScript/JavaScript. Ships with traversal helpers, value and
id-based lookups, subtree manipulation (move, copy, remove), serialization, and an
optional readonly mode. Zero runtime dependencies, works in Deno, Node, Bun, and
the browser.

## Features

- **Generic container** — store any value type `T` (primitives, objects, class
  instances, …).
- **Three traversal generators** — pre-order, post-order, and level-order. Memory
  efficient; iterate lazily or collect to an array.
- **Rich lookup** — find by id, find by value, find by property value (for object
  values), lowest common ancestor, `contains`, `has`, all with optional depth caps
  and custom equality comparators.
- **Safe mutation** — `appendChild`, `insert`, `removeChild`, `replaceChild`,
  `resetChildren`, `move`, `copy`. Structural invariants are enforced: cycles,
  duplicates, and cross-tree adoptions throw rather than silently corrupt state.
- **Sibling ops** — `previousSibling`, `nextSibling`, `moveSiblingIndex`
  (with negative-index support).
- **Serialization** — round-trip via `dump()` / `restore()` or the `Tree.factory()`
  static constructor. `toJSON()` returns plain DTOs; `JSON.stringify(tree)` works.
- **Readonly mode** — flip a flag to freeze the entire tree. Every mutation
  method throws, and the `children` arrays are frozen so direct array mutation
  is caught too.
- **Tiny** — single class per concern, zero dependencies.

## Installation

```sh
deno add jsr:@marianmeres/tree
```

```sh
npm install @marianmeres/tree
```

## Quick start

```typescript
import { Tree } from "@marianmeres/tree";

const tree = new Tree<string>();
const root = tree.appendChild("root");           // first append becomes the root
const child1 = root.appendChild("child1");
const child2 = root.appendChild("child2");
child1.appendChild("grandchild1");
child1.appendChild("grandchild2");

// Human-readable structure (useful for debugging)
console.log(tree.toString());
// root
//     child1
//         grandchild1
//         grandchild2
//     child2
```

## Usage

### Building a tree

You can build trees top-down by appending to the tree directly or by appending to
returned node references:

```typescript
import { Tree } from "@marianmeres/tree";

const tree = new Tree<string>();

// The first `tree.appendChild(...)` creates the root.
const root = tree.appendChild("root");

// Subsequent `tree.appendChild(...)` calls append to the root.
tree.appendChild("childA");
tree.appendChild("childB");

// Or call appendChild on a specific node for finer control.
const a = root.children[0];
a.appendChild("grandchild");

// Or insert by parent id (useful when you only have the id).
tree.insert(a.id, "another grandchild");
```

### Traversal

Three generators are available. They yield `TreeNode<T>` instances lazily:

```typescript
for (const node of tree.preOrderTraversal()) {
    console.log(node.value);
}

// Or collect to an array
const all = [...tree.levelOrderTraversal()];
```

An empty tree yields nothing.

### Search and lookup

```typescript
// By id
const node = tree.find("n3f8…");

// By value (strict ===)
const hits = tree.findAllBy("child1");

// By object property (when the tree stores objects)
type User = { id: string; role: "admin" | "user" };
const userTree = new Tree<User>();
// …populate…
const admins = userTree.findAllBy("admin", "role");

// With a custom comparator
const caseInsensitive = tree.findAllBy("CHILD1", null, 0, (a, b) =>
    a.toLowerCase() === b.toLowerCase()
);

// Existence checks
tree.contains(someId);         // by id
tree.has("child1");            // by value
tree.has("child1", 2);         // limited to depth 2

// Lowest common ancestor
const lca = tree.findLCA(n1.id, n2.id);
```

### Subtree manipulation

```typescript
tree.remove(nodeId);                  // removes node + its subtree
tree.move(srcId, targetId);           // move subtree under target
tree.copy(srcId, targetId);           // copy subtree under target (fresh ids)

// On a node directly:
node.replaceChild(childId, "newValue");
node.resetChildren(["a", "b", "c"]);  // wipe and replace all children
node.moveSiblingIndex(0);             // reorder among siblings
node.moveSiblingIndex(-1);            // move to last position
```

Moving a node to its own descendant throws — cycles are prevented.

### Node properties

Each `TreeNode<T>` exposes rich navigational state:

```typescript
node.id;             // auto-generated unique id (prefixed "n" for HTML-safe ids)
node.value;          // the stored T
node.parent;         // TreeNode<T> | null
node.children;       // TreeNode<T>[] (frozen when readonly)
node.root;           // topmost ancestor (returns self if root/detached)
node.path;           // ancestors from root down to parent (self excluded)
node.depth;          // 0 for root
node.isRoot;         // parent === null
node.isLeaf;         // no children
node.siblings;       // all children of parent (includes self)
node.siblingIndex;   // position among siblings (−1 if no parent)
node.previousSibling();
node.nextSibling();
```

### Serialization

```typescript
// dump/restore
const json = tree.dump();             // JSON string
const restored = Tree.factory<string>(json);

// Work with the plain DTO directly
const dto = tree.toJSON();            // TreeNodeDTO | undefined
const restored2 = new Tree<string>().restore(dto);

// JSON.stringify works directly on Tree and TreeNode
JSON.stringify(tree);
JSON.stringify(tree.root);
```

Serialization preserves node ids, so dumping and restoring produces an
identical structure.

### Readonly mode

When you want to hand a tree out as an immutable view (configuration, computed
navigation, etc.), construct it in readonly mode:

```typescript
// From a dump
const frozen = Tree.factory<string>(json, true);

// Or from a constructed tree
const frozen2 = new Tree<string>(rootNode, true);

frozen.appendChild("x");        // throws
frozen.remove(someId);          // throws
frozen.root.children.push(...); // throws (array is frozen)
```

Every mutation method on both `Tree` and `TreeNode` throws, and each node's
`children` array is `Object.freeze`-d so you cannot sneak past the flag by
manipulating the array directly.

### Working with object values

The tree is type-parametric, so it works equally well with object values:

```typescript
type Category = { id: number; name: string; parentId: number | null };

const catTree = new Tree<Category>();
catTree.appendChild({ id: 1, name: "Root", parentId: null });
// …populate from a flat list by looking up parents…

// Find all categories named "Shoes"
const shoes = catTree.findAllBy("Shoes", "name");

// Pretty-print
console.log(
    [...catTree.preOrderTraversal()]
        .map((n) => "  ".repeat(n.depth) + n.value.name)
        .join("\n")
);
```

## API

See [API.md](./API.md) for the complete API reference — every class, method,
property, and type with signatures, parameter tables, and examples.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md). The **2.3.0** release fixes several latent
bugs and hardens readonly mode; most existing code is unaffected but a handful of
behaviors changed — see the [breaking & behavioral changes](./API.md#breaking--behavioral-changes)
table before upgrading.

## License

[MIT](LICENSE)
