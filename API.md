# API Reference

Complete API documentation for `@marianmeres/tree`.

> **Changed in 2.3.0** — This release fixes several latent bugs. Most changes are
> purely corrective, but a few have behavioral implications. See
> [Breaking & Behavioral Changes](#breaking--behavioral-changes) at the bottom.

## Table of Contents

- [Tree Class](#tree-class)
  - [Constructor](#tree-constructor)
  - [Properties](#tree-properties)
  - [Static Methods](#tree-static-methods)
  - [Traversal Methods](#traversal-methods)
  - [Search Methods](#search-methods)
  - [Manipulation Methods](#manipulation-methods)
  - [Serialization Methods](#serialization-methods)
  - [Utility Methods](#tree-utility-methods)
- [TreeNode Class](#treenode-class)
  - [Constructor](#treenode-constructor)
  - [Properties](#treenode-properties)
  - [Static Methods](#treenode-static-methods)
  - [Child Management](#child-management)
  - [Sibling Operations](#sibling-operations)
  - [Search Methods](#treenode-search-methods)
  - [Utility Methods](#treenode-utility-methods)
- [TreeNodeDTO Interface](#treenodedto-interface)

---

## Tree Class

The main tree container class. Represents a tree with a single root node and provides
methods for traversal, manipulation, and serialization.

```typescript
import { Tree } from "@marianmeres/tree";
```

### Tree Constructor

```typescript
new Tree<T>(root?: TreeNode<T> | null, readonly?: boolean)
```

| Parameter  | Type                    | Default | Description                                    |
| ---------- | ----------------------- | ------- | ---------------------------------------------- |
| `root`     | `TreeNode<T> \| null`   | `null`  | Optional root node to initialize the tree with |
| `readonly` | `boolean`               | `false` | Whether to mark the tree as readonly           |

**Example:**
```typescript
const tree = new Tree<string>();
const treeWithRoot = new Tree<number>(new TreeNode(42));
const readonlyTree = new Tree<string>(root, true);
```

### Tree Properties

#### `root`
```typescript
get root(): TreeNode<T> | null
```
Returns the root node of the tree, or `null` if the tree is empty.

#### `readonly`
```typescript
get readonly(): boolean
```
Returns `true` if the tree is marked as readonly (all mutations are prevented).

### Tree Static Methods

#### `Tree.factory()`
```typescript
static factory<T>(dump: string | TreeNodeDTO<T>, readonly?: boolean): Tree<T>
```
Factory method to create a new tree from serialized data.

| Parameter  | Type                          | Default | Description                           |
| ---------- | ----------------------------- | ------- | ------------------------------------- |
| `dump`     | `string \| TreeNodeDTO<T>`    | -       | Serialized tree data (JSON or DTO)    |
| `readonly` | `boolean`                     | `false` | Whether to mark the tree as readonly  |

**Example:**
```typescript
const serialized = existingTree.dump();
const restored = Tree.factory<string>(serialized);
```

### Traversal Methods

All traversal methods are generator functions that yield nodes in a specific order.

#### `preOrderTraversal()`
```typescript
*preOrderTraversal(node?: TreeNode<T> | null): Generator<TreeNode<T>>
```
Depth-first, pre-order traversal (visits node, then children left-to-right).
Yields nothing if the tree is empty (or `node` is null).

**Example:**
```typescript
for (const node of tree.preOrderTraversal()) {
  console.log(node.value);
}
// Or collect to array:
const nodes = [...tree.preOrderTraversal()];
```

#### `postOrderTraversal()`
```typescript
*postOrderTraversal(node?: TreeNode<T> | null): Generator<TreeNode<T>>
```
Depth-first, post-order traversal (visits children left-to-right, then node).
Yields nothing if the tree is empty.

#### `levelOrderTraversal()`
```typescript
*levelOrderTraversal(node?: TreeNode<T> | null): Generator<TreeNode<T>>
```
Breadth-first, level-order traversal (visits nodes level by level, left-to-right).
Yields nothing if the tree is empty.

### Search Methods

#### `find()`
```typescript
find(id: string): TreeNode<T> | null
```
Searches for a node by its unique ID.

| Parameter | Type     | Description              |
| --------- | -------- | ------------------------ |
| `id`      | `string` | The node ID to find      |

**Returns:** The matching node or `null` if not found.

**Throws:** Error if `id` is empty.

#### `findAllBy()`
```typescript
findAllBy(
  valueOrPropValue: any,
  propName?: string | null,
  maxDepth?: number,
  valueCompareEqualFn?: (a: T, b: T) => boolean
): TreeNode<T>[]
```
Searches all nodes by value or property+value pair.

| Parameter            | Type                          | Default     | Description                                    |
| -------------------- | ----------------------------- | ----------- | ---------------------------------------------- |
| `valueOrPropValue`   | `any`                         | -           | Value to search for (or property value)        |
| `propName`           | `string \| null`              | `null`      | Property name to search within object values   |
| `maxDepth`           | `number`                      | `0`         | Maximum depth to search (0 = unlimited)        |
| `valueCompareEqualFn`| `(a: T, b: T) => boolean`     | strict `===`| Custom comparison function                     |

**Example:**
```typescript
// Find by value
const matches = tree.findAllBy("searchValue");

// Find by property (if values are objects)
const users = tree.findAllBy("admin", "role");

// With custom comparator
const similar = tree.findAllBy(target, null, 0, (a, b) => a.id === b.id);
```

#### `findLCA()`
```typescript
findLCA(node1Id: string, node2Id: string): TreeNode<T> | null
```
Finds the lowest common ancestor (LCA) of two nodes.

| Parameter  | Type     | Description                |
| ---------- | -------- | -------------------------- |
| `node1Id`  | `string` | ID of the first node       |
| `node2Id`  | `string` | ID of the second node      |

**Returns:** The LCA node or `null` if the tree is empty.

**Throws:** Error if either ID is empty or nodes are not found.

**Example:**
```typescript
const ancestor = tree.findLCA(nodeA.id, nodeB.id);
```

**Notes:**
- Handles the ancestor-descendant case correctly: if `nodeB` is an ancestor of `nodeA`, returns `nodeB`.
- Returns the same node if both ids refer to the same node.

#### `contains()`
```typescript
contains(id: string, maxDepth?: number): boolean
```
Checks if a node with the given ID exists in the tree.

| Parameter  | Type     | Default | Description                         |
| ---------- | -------- | ------- | ----------------------------------- |
| `id`       | `string` | -       | Node ID to check                    |
| `maxDepth` | `number` | `0`     | Maximum depth to search (0 = all)   |

#### `has()`
```typescript
has(value: T, maxDepth?: number, compareFn?: (a: T, b: T) => boolean): boolean
```
Checks if a node with the given value exists in the tree.

| Parameter   | Type                       | Default      | Description                        |
| ----------- | -------------------------- | ------------ | ---------------------------------- |
| `value`     | `T`                        | -            | Value to search for                |
| `maxDepth`  | `number`                   | `0`          | Maximum depth to search (0 = all)  |
| `compareFn` | `(a: T, b: T) => boolean`  | strict `===` | Custom comparison function         |

### Manipulation Methods

#### `appendChild()`
```typescript
appendChild(valueOrNode: T | TreeNode<T>): TreeNode<T>
```
Appends a new node to the tree. If the tree has no root, the new node becomes the root.
Otherwise, appends to the existing root.

| Parameter      | Type                   | Description                        |
| -------------- | ---------------------- | ---------------------------------- |
| `valueOrNode`  | `T \| TreeNode<T>`     | Value or TreeNode instance to add  |

**Returns:** The newly appended TreeNode.

**Throws:** Error if the tree is readonly, or if a passed `TreeNode` instance cannot
be safely adopted as the new root (e.g., it already has a parent or belongs to a
different tree).

**Example:**
```typescript
const root = tree.appendChild("root");
const child = tree.appendChild("child");
```

#### `insert()`
```typescript
insert(parentNodeId: string, value: T): TreeNode<T>
```
Inserts a new node under the specified parent node.

| Parameter      | Type     | Description                         |
| -------------- | -------- | ----------------------------------- |
| `parentNodeId` | `string` | ID of the parent node               |
| `value`        | `T`      | Value for the new node              |

**Returns:** The newly created TreeNode.

**Throws:** Error if parent node is not found.

#### `remove()`
```typescript
remove(id: string): Tree<T>
```
Removes a node and its entire subtree by ID.

| Parameter | Type     | Description              |
| --------- | -------- | ------------------------ |
| `id`      | `string` | ID of the node to remove |

**Returns:** This tree instance for chaining.

**Throws:** Error if the tree is readonly, ID is empty, or node is not found.

**Notes:** The removed subtree is fully detached — `parent` and `tree` references on
all removed nodes are cleared, so stale navigation (`.root`, `.path`, `.depth`) cannot
return misleading values.

#### `move()`
```typescript
move(srcNodeId: string, targetNodeId: string): TreeNode<T>
```
Moves a node (with its subtree) to become a child of the target node.

| Parameter      | Type     | Description                          |
| -------------- | -------- | ------------------------------------ |
| `srcNodeId`    | `string` | ID of the node to move               |
| `targetNodeId` | `string` | ID of the destination parent node    |

**Returns:** The moved TreeNode in its new location.

**Throws:** Error if nodes not found, recursive reference detected, or moving to self.

**Note:** Moving to the same parent is a no-op and returns the source node unchanged.

#### `copy()`
```typescript
copy(srcNodeId: string, targetNodeId: string): TreeNode<T>
```
Copies a node (with its subtree) to become a child of the target node.
All nodes in the copy will have new unique IDs.

| Parameter      | Type     | Description                          |
| -------------- | -------- | ------------------------------------ |
| `srcNodeId`    | `string` | ID of the node to copy               |
| `targetNodeId` | `string` | ID of the destination parent node    |

**Returns:** The newly copied TreeNode.

**Throws:** Error if nodes are not found.

### Serialization Methods

#### `dump()`
```typescript
dump(): string
```
Serializes the tree to a JSON string.

**Returns:** JSON string representation of the tree.

#### `restore()`
```typescript
restore(dump: string | TreeNodeDTO<T>): Tree<T>
```
Restores tree state from serialized data.

| Parameter | Type                        | Description                            |
| --------- | --------------------------- | -------------------------------------- |
| `dump`    | `string \| TreeNodeDTO<T>`  | Serialized tree data (JSON or DTO)     |

**Returns:** This tree instance for chaining.

#### `toJSON()`
```typescript
toJSON(): TreeNodeDTO<T> | undefined
```
Returns the internal data structure representation for JSON serialization.

**Returns:** TreeNodeDTO object or `undefined` if tree is empty.

### Tree Utility Methods

#### `size()`
```typescript
size(from?: TreeNode<T> | null): number
```
Returns the total number of nodes in the tree or subtree. Returns `0` if `from`
is provided but does not belong to this tree.

| Parameter | Type                    | Default  | Description                              |
| --------- | ----------------------- | -------- | ---------------------------------------- |
| `from`    | `TreeNode<T> \| null`   | root     | Starting node (for subtree size)         |

**Example:**
```typescript
const totalNodes = tree.size();
const subtreeNodes = tree.size(someNode);
```

#### `toString()`
```typescript
toString(): string
```
Returns a human-readable string representation of the tree with indentation.

**Example output:**
```
root
    child1
        grandchild1
    child2
```

---

## TreeNode Class

Represents a single node in the tree structure. Each node has a unique ID, a value,
parent/child references, and various utility methods.

```typescript
import { TreeNode } from "@marianmeres/tree";
```

### TreeNode Constructor

```typescript
new TreeNode<T>(value: T, parent?: TreeNode<T> | null, tree?: Tree<T> | null)
```

| Parameter | Type                  | Default | Description                               |
| --------- | --------------------- | ------- | ----------------------------------------- |
| `value`   | `T`                   | -       | The value to store in this node           |
| `parent`  | `TreeNode<T> \| null` | `null`  | Optional parent node reference            |
| `tree`    | `Tree<T> \| null`     | `null`  | Optional reference to the owning Tree     |

**Example:**
```typescript
const node = new TreeNode<string>("value");
```

### TreeNode Properties

| Property       | Type                  | Description                                           |
| -------------- | --------------------- | ----------------------------------------------------- |
| `id`           | `string`              | Unique identifier (auto-generated)                    |
| `value`        | `T`                   | The stored value                                      |
| `parent`       | `TreeNode<T> \| null` | Parent node reference (`null` if root or detached)    |
| `children`     | `TreeNode<T>[]`       | Array of direct child nodes (frozen when readonly)    |
| `tree`         | `Tree<T> \| null`     | Reference to the owning Tree instance                 |
| `readonly`     | `boolean`             | Whether the node is readonly                          |
| `depth`        | `number`              | Node depth (root = 0)                                 |
| `isLeaf`       | `boolean`             | `true` if the node has no children                    |
| `isRoot`       | `boolean`             | `true` if the node has no parent                      |
| `siblings`     | `TreeNode<T>[]`       | Array of sibling nodes (includes self, `[]` if no parent) |
| `siblingIndex` | `number`              | Index within siblings array (-1 if no parent)         |
| `root`         | `TreeNode<T>`         | Topmost ancestor (returns self if root or detached)   |
| `path`         | `TreeNode<T>[]`       | Ancestors from root to parent (top-down, self excluded) |

### TreeNode Static Methods

#### `TreeNode.createId()`
```typescript
static createId(): string
```
Generates a random ID prefixed with "n" (safe for HTML element IDs).

**Returns:** A random ID string (e.g., `"nk7x2m4p9qw1j3f5t8v6a"`).

### Child Management

#### `appendChild()`
```typescript
appendChild(valueOrNode: T | TreeNode<T>, _sync?: boolean): TreeNode<T>
```
Appends a new child node.

| Parameter      | Type                | Default | Description                        |
| -------------- | ------------------- | ------- | ---------------------------------- |
| `valueOrNode`  | `T \| TreeNode<T>`  | -       | Value or TreeNode to append        |
| `_sync`        | `boolean`           | `true`  | Whether to sync references (internal) |

**Returns:** The newly appended TreeNode.

**Throws:** Error if node is readonly, or if the argument is a `TreeNode` instance that
cannot be safely adopted — specifically:
- self-append
- already a descendant (duplicate)
- is an ancestor of this node (would create a cycle)
- already has a different parent (detach via `parent.removeChild` or `tree.remove`/`tree.move` first)
- belongs to a different tree

#### `removeChild()`
```typescript
removeChild(id: string): TreeNode<T>
```
Removes a child node by its ID.

| Parameter | Type     | Description              |
| --------- | -------- | ------------------------ |
| `id`      | `string` | ID of the child to remove |

**Returns:** This node instance for chaining.

**Throws:** Error if node is readonly or child not found.

**Notes:** The removed child (and its entire subtree) is fully detached — `parent`
and `tree` references are cleared.

#### `replaceChild()`
```typescript
replaceChild(id: string, valueOrNode: T | TreeNode<T>): TreeNode<T>
```
Replaces a child node with a new node. The old child becomes fully detached.

| Parameter      | Type                | Description                      |
| -------------- | ------------------- | -------------------------------- |
| `id`           | `string`            | ID of the child to replace       |
| `valueOrNode`  | `T \| TreeNode<T>`  | Value or TreeNode to replace with |

**Returns:** The new TreeNode (same adoptability rules as `appendChild`).

**Throws:** Error if node is readonly, child not found, or the replacement cannot
be safely adopted (see `appendChild`).

#### `resetChildren()`
```typescript
resetChildren(valuesOrNodes?: (T | TreeNode<T>)[]): TreeNode<T>
```
Removes all existing children and replaces them with new ones.

| Parameter       | Type                    | Default | Description                    |
| --------------- | ----------------------- | ------- | ------------------------------ |
| `valuesOrNodes` | `(T \| TreeNode<T>)[]`  | `[]`    | Array of values or TreeNodes   |

**Returns:** This node instance for chaining.

### Sibling Operations

#### `previousSibling()`
```typescript
previousSibling(): TreeNode<T> | null
```
Gets the previous sibling node.

**Returns:** The previous sibling or `null` if this is the first sibling.

#### `nextSibling()`
```typescript
nextSibling(): TreeNode<T> | null
```
Gets the next sibling node.

**Returns:** The next sibling or `null` if this is the last sibling.

#### `moveSiblingIndex()`
```typescript
moveSiblingIndex(toIndex: number): TreeNode<T>
```
Moves this node to a different position within its siblings array.

| Parameter | Type     | Description                                        |
| --------- | -------- | -------------------------------------------------- |
| `toIndex` | `number` | Target index (supports negative indices from end)  |

**Returns:** This node instance for chaining.

**Example:**
```typescript
node.moveSiblingIndex(0);  // Move to first position
node.moveSiblingIndex(-1); // Move to last position
```

### TreeNode Search Methods

#### `contains()`
```typescript
contains(id: string, maxDepth?: number): boolean
```
Checks if a node with the given ID exists within this node's descendants.

| Parameter  | Type     | Default | Description                         |
| ---------- | -------- | ------- | ----------------------------------- |
| `id`       | `string` | -       | Node ID to search for               |
| `maxDepth` | `number` | `0`     | Maximum depth to search (0 = all)   |

**Note:** A node does not contain itself (returns `false` for own ID).

#### `has()`
```typescript
has(value: T, maxDepth?: number, valueCompareEqualFn?: (a: T, b: T) => boolean): boolean
```
Checks if a node with the given value exists within this node's descendants.

#### `matches()`
```typescript
matches(
  valueOrPropValue: any,
  propName?: string | null,
  valueCompareEqualFn?: (a: T, b: T) => boolean
): TreeNode<T> | null
```
Checks if this node matches a value or property+value pair.

**Returns:** This node if it matches, `null` otherwise.

#### `findAllBy()`
```typescript
findAllBy(
  valueOrPropValue: any,
  propName?: string | null,
  maxDepth?: number,
  valueCompareEqualFn?: (a: T, b: T) => boolean
): TreeNode<T>[]
```
Searches all nodes (self + descendants) by value or property+value pair.

### TreeNode Utility Methods

#### `toJSON()`
```typescript
toJSON(): TreeNodeDTO<T>
```
Returns the plain data representation of the node for serialization. Children are
recursively converted to DTOs — the returned object contains no live `TreeNode`
references, so mutating it will not affect the underlying tree.

**Returns:** TreeNodeDTO object with `id`, `value`, and `children`.

#### `deepClone()`
```typescript
deepClone(): TreeNode<T>
```
Creates a deep clone of this node and its entire subtree.
All nodes in the clone will have new unique IDs.

**Returns:** A new, fully detached TreeNode instance (`parent` is `null`, `tree` is `null`).

#### `toString()`
```typescript
toString(): string
```
Returns a string representation of this node with indentation based on depth.

---

## TreeNodeDTO Interface

Data transfer object for node serialization.

```typescript
interface TreeNodeDTO<T> {
  /** Unique identifier of the node */
  id: string;
  /** The value stored in the node */
  value: T;
  /** Array of child node DTOs */
  children: TreeNodeDTO<T>[];
}
```

Used by `dump()`/`restore()` for serialization and `Tree.factory()` for tree creation.

---

## Readonly Mode Semantics

Construct a tree in readonly mode with either the constructor flag or the factory:

```typescript
const t = new Tree<string>(rootNode, true);
const t2 = Tree.factory<string>(dump, true);
```

When readonly is active:
- All mutation methods throw (`appendChild`, `insert`, `remove`, `move`, `copy`,
  `TreeNode.appendChild`/`removeChild`/`replaceChild`/`resetChildren`/`moveSiblingIndex`).
- **Including on empty trees** — `new Tree(null, true).appendChild("x")` throws.
- **Including the root** — `tree.remove(tree.root.id)` throws.
- Each node's `children` array is frozen, so direct mutation like
  `node.children.push(...)` or `node.children.splice(...)` throws a `TypeError`.

---

## Breaking & Behavioral Changes

### 2.3.0

| Area | Before | After |
|------|--------|-------|
| `TreeNode.root` | `TreeNode<T> \| null` — returned `null` for root/detached | `TreeNode<T>` — returns `this` for root/detached |
| Traversal generators | `Generator<TreeNode<T> \| null>` — yielded a single `null` for empty trees | `Generator<TreeNode<T>>` — yields nothing for empty trees |
| `TreeNode.toJSON()` | `children` array held live `TreeNode` references | `children` array is a plain DTO array (recursive) |
| `replaceChild()` | `TreeNode<T> \| false` | `TreeNode<T>` (throws on failure instead of returning `false`) |
| `TreeNode.appendChild()` | Could silently duplicate an already-attached child, cross-tree node, or create cycles | Throws with a descriptive message (see method docs) |
| `TreeNode.removeChild()` / `Tree.remove()` | Removed nodes kept stale `parent` and `tree` refs | Removed subtree is fully detached (`parent`/`tree` cleared) |
| `deepClone()` | Clone's `parent` pointed at the original's parent | Clone is fully detached (`parent = null`, `tree = null`) |
| Readonly + empty tree | `appendChild` silently created the root | Throws |
| Readonly + root remove | `tree.remove(root.id)` silently cleared the root | Throws |
| Readonly + `node.children.push(...)` | Silently mutated the tree | `TypeError` (array is frozen) |
| `size(foreignNode)` | Returned subtree size if foreign node had children | Returns `0` |
| `findLCA(ancestor, descendant)` | Returned root instead of the true LCA | Returns the ancestor node |
| `TreeNode.findAllBy()` self-match | Ignored the custom comparator for the self check | Applies the comparator to the self check too |
| `TreeNode.createId()` | `Math.random()`-based | `crypto.randomUUID()` when available, same fallback otherwise |

Most callers will be unaffected. The ones most likely to need code changes:
- Code that relied on `node.root === null` to detect detached nodes — use `node.isRoot` or `node.parent === null` instead.
- Code that collected traversal output as `[...tree.preOrderTraversal()]` and expected `.length === 1` for empty trees — it is now `0`.
- Code that pattern-matched on `replaceChild(...) === false` — wrap in `try/catch` instead.
- Code that read `node.children` from a readonly tree and mutated it — this was always a bug; it now throws.
