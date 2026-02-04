# @marianmeres/tree

[![NPM version](https://img.shields.io/npm/v/@marianmeres/tree)](https://www.npmjs.com/package/@marianmeres/tree)
[![JSR version](https://jsr.io/badges/@marianmeres/tree)](https://jsr.io/@marianmeres/tree)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Generic [tree](https://en.wikipedia.org/wiki/Tree_(data_structure)) data structure with
traversal, lookup, and node manipulation operations.

## Installation

```sh
deno add jsr:@marianmeres/tree
```

```sh
npm install @marianmeres/tree
```

## Usage

```typescript
import { Tree, TreeNode } from '@marianmeres/tree';

// Create a tree and add nodes
const tree = new Tree<string>();
const root = tree.appendChild('root');
const child1 = root.appendChild('child1');
const child2 = root.appendChild('child2');
child1.appendChild('grandchild1');
child1.appendChild('grandchild2');

// Tree structure visualization
console.log(tree.toString());
// root
//     child1
//         grandchild1
//         grandchild2
//     child2

// Traversal (pre-order, post-order, level-order available)
for (const node of tree.preOrderTraversal()) {
    console.log(node?.value);
}

// Search
const found = tree.find(child1.id);        // by ID
const matches = tree.findAllBy('child1');  // by value

// Manipulation
tree.insert(child2.id, 'newChild');  // insert under child2
tree.move(child1.id, child2.id);     // move child1 under child2
tree.remove(child2.id);              // remove subtree

// Serialization
const json = tree.dump();
const restored = Tree.factory<string>(json);

// Readonly mode (all mutations throw)
const readonlyTree = Tree.factory<string>(json, true);
```

## API

See [API.md](./API.md) for complete API documentation.

## License

[MIT](LICENSE)
