# CLAUDE.md

Quick context for Claude when working with this codebase.

## What is this?

`@marianmeres/tree` - A TypeScript generic tree data structure library.

- **Type**: Deno-first library, also published to npm
- **License**: MIT
- **Version**: 2.2.2
- **Dependencies**: None

## Key Files

- `src/mod.ts` - Main entry point (exports Tree, TreeNode, TreeNodeDTO)
- `src/tree/tree.ts` - Tree class (container, traversals, tree-level ops)
- `src/tree/tree-node.ts` - TreeNode class (individual node management)
- `tests/tree.test.ts` - Test suite (26 tests)
- `deno.json` - Config with tasks

## Quick Reference

```typescript
import { Tree, TreeNode } from "@marianmeres/tree";

// Create tree
const tree = new Tree<string>();
const root = tree.appendChild("root");
root.appendChild("child");

// Traverse
for (const node of tree.preOrderTraversal()) { ... }

// Find
tree.find(nodeId);           // by ID
tree.findAllBy(value);       // by value
tree.findAllBy(v, "prop");   // by property

// Manipulate
tree.insert(parentId, value);
tree.remove(nodeId);
tree.move(srcId, targetId);
tree.copy(srcId, targetId);

// Serialize
const json = tree.dump();
const restored = Tree.factory<T>(json);
```

## Commands

```bash
deno test           # Run tests
deno task publish   # Publish to JSR + npm
```

## Notes

- Single root (first appendChild creates it)
- All nodes have auto-generated IDs (8 chars, 'n' prefix)
- Readonly mode available via `Tree.factory(data, true)`
- Traversals are generators (memory efficient)
