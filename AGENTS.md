# AGENTS.md

Machine-readable context for AI agents working with `@marianmeres/tree`.

## Package Identity

- **name**: @marianmeres/tree
- **version**: 2.2.4
- **license**: MIT
- **repository**: https://github.com/marianmeres/tree
- **runtime**: Deno-native, also published to npm
- **module_format**: ESM
- **dependencies**: none (zero runtime dependencies)

## Purpose

Generic tree data structure implementation with:
- Hierarchical node management (parent-child relationships)
- Multiple traversal strategies (pre-order, post-order, level-order)
- Node lookup by ID or value
- Subtree manipulation (move, copy, remove)
- Serialization/deserialization
- Readonly mode support

## File Structure

```
src/
  mod.ts              # Main entry point, exports Tree, TreeNode, TreeNodeDTO
  tree/
    tree.ts           # Tree class (container, traversals, tree-level operations)
    tree-node.ts      # TreeNode class (individual node, child management)
tests/
  tree.test.ts        # Comprehensive test suite (26 tests)
scripts/
  build-npm.ts        # NPM package build script
```

## Public API Summary

### Exports from `mod.ts`

```typescript
export { Tree } from "./tree/tree.ts";
export { TreeNode, type TreeNodeDTO } from "./tree/tree-node.ts";
```

### Tree<T> Class

**Constructor**: `new Tree<T>(root?: TreeNode<T> | null, readonly?: boolean)`

**Static Methods**:
- `Tree.factory<T>(dump: string | TreeNodeDTO<T>, readonly?: boolean): Tree<T>`

**Properties**:
- `root: TreeNode<T> | null`
- `readonly: boolean`

**Traversal** (Generator functions):
- `preOrderTraversal(node?): Generator<TreeNode<T> | null>`
- `postOrderTraversal(node?): Generator<TreeNode<T> | null>`
- `levelOrderTraversal(node?): Generator<TreeNode<T> | null>`

**Search**:
- `find(id: string): TreeNode<T> | null`
- `findAllBy(valueOrPropValue, propName?, maxDepth?, compareFn?): TreeNode<T>[]`
- `findLCA(node1Id: string, node2Id: string): TreeNode<T> | null`
- `contains(id: string, maxDepth?): boolean`
- `has(value: T, maxDepth?, compareFn?): boolean`

**Manipulation**:
- `appendChild(valueOrNode: T | TreeNode<T>): TreeNode<T>`
- `insert(parentNodeId: string, value: T): TreeNode<T>`
- `remove(id: string): Tree<T>`
- `move(srcNodeId: string, targetNodeId: string): TreeNode<T>`
- `copy(srcNodeId: string, targetNodeId: string): TreeNode<T>`

**Serialization**:
- `dump(): string`
- `restore(dump: string | TreeNodeDTO<T>): Tree<T>`
- `toJSON(): TreeNodeDTO<T> | undefined`

**Utility**:
- `size(from?: TreeNode<T>): number`
- `toString(): string`

### TreeNode<T> Class

**Constructor**: `new TreeNode<T>(value: T, parent?: TreeNode<T> | null, tree?: Tree<T> | null)`

**Static Methods**:
- `TreeNode.createId(): string`

**Properties**:
- `id: string` (auto-generated, 'n' prefix)
- `value: T`
- `parent: TreeNode<T> | null`
- `children: TreeNode<T>[]`
- `tree: Tree<T> | null`
- `readonly: boolean`
- `depth: number`
- `isLeaf: boolean`
- `isRoot: boolean`
- `siblings: TreeNode<T>[]`
- `siblingIndex: number`
- `root: TreeNode<T> | null`
- `path: TreeNode<T>[]`

**Child Management**:
- `appendChild(valueOrNode: T | TreeNode<T>): TreeNode<T>`
- `removeChild(id: string): TreeNode<T>`
- `replaceChild(id: string, valueOrNode: T | TreeNode<T>): TreeNode<T> | false`
- `resetChildren(valuesOrNodes?: (T | TreeNode<T>)[]): TreeNode<T>`

**Sibling Operations**:
- `previousSibling(): TreeNode<T> | null`
- `nextSibling(): TreeNode<T> | null`
- `moveSiblingIndex(toIndex: number): TreeNode<T>`

**Search**:
- `contains(id: string, maxDepth?): boolean`
- `has(value: T, maxDepth?, compareFn?): boolean`
- `matches(valueOrPropValue, propName?, compareFn?): TreeNode<T> | null`
- `findAllBy(valueOrPropValue, propName?, maxDepth?, compareFn?): TreeNode<T>[]`

**Utility**:
- `toJSON(): TreeNodeDTO<T>`
- `deepClone(): TreeNode<T>`
- `toString(): string`

### TreeNodeDTO<T> Interface

```typescript
interface TreeNodeDTO<T> {
  id: string;
  value: T;
  children: TreeNodeDTO<T>[];
}
```

## Key Behaviors

1. **Single Root**: Tree has exactly one root node (first `appendChild` creates it)
2. **Unique IDs**: All nodes have auto-generated unique IDs ('n' prefix)
3. **Readonly Mode**: When enabled, all mutations throw errors
4. **Recursive Reference Detection**: `move()` prevents moving node to its own descendant
5. **Serialization**: Full round-trip via `dump()`/`restore()` or `Tree.factory()`
6. **Generator Traversals**: Memory-efficient traversal using generators

## Common Patterns

### Create and populate tree
```typescript
const tree = new Tree<string>();
const root = tree.appendChild("root");
root.appendChild("child1");
root.appendChild("child2");
```

### Traverse all nodes
```typescript
for (const node of tree.preOrderTraversal()) {
  // node is TreeNode<T> | null
}
```

### Search by property
```typescript
// For object values like { name: string, role: string }
const admins = tree.findAllBy("admin", "role");
```

### Serialize and restore
```typescript
const json = tree.dump();
const restored = Tree.factory<string>(json);
// or: new Tree<string>().restore(json);
```

### Readonly tree
```typescript
const readonlyTree = Tree.factory<string>(json, true);
// All mutations will throw
```

## Development Commands

```bash
deno test              # Run tests
deno test --watch      # Watch mode
deno task npm:build    # Build npm package
deno task publish      # Publish to JSR and npm
```

## Test Coverage

26 tests covering:
- Node/tree sanity checks
- All traversal methods
- Serialization round-trips
- Node removal, insertion
- Contains/has lookups
- findAllBy with various parameters
- Move operations (including edge cases)
- Copy operations
- Sibling operations
- LCA finding
- Size calculation
- Readonly mode
