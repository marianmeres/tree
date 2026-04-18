# Changelog

## 2.3.0 (pending)

Correctness audit: multiple latent bugs fixed, a few design flaws addressed, and
readonly mode hardened. All 26 existing tests still pass; 16 regression tests added
(42 total, all green).

### Fixed

- **`findLCA` ancestor-descendant case** — `findLCA(a, b)` where `b` was an ancestor
  of `a` previously returned the root instead of `b`. Now returns the correct
  ancestor node.
- **`TreeNode.root` for root/detached nodes** — previously returned `null` for any
  node without a parent. Now returns the node itself (the topmost ancestor).
- **Cross-tree adoption silently succeeded** — `treeA.root.appendChild(nodeFromTreeB)`
  previously corrupted state (node existed in both trees simultaneously). Now throws.
- **Duplicate / cycle-creating appends** — `parent.appendChild(existingChild)` could
  silently add a node twice; `child.appendChild(ancestor)` could create a cycle.
  Both now throw.
- **Stale `parent` / `tree` on removed nodes** — `removeChild` / `Tree.remove` left
  `parent` and `tree` pointing to stale references, so `.root`, `.path`, `.depth`,
  and `.siblings` could lie. Removed subtrees are now fully detached.
- **`deepClone` parent leak** — cloned node's `parent` pointed at the original's
  parent (so `clone.root` walked into the source tree). Clone is now fully
  detached (`parent: null`, `tree: null`).
- **`findAllBy` self-match ignored custom comparator** — the self-check used strict
  `===` while descendant checks used the supplied comparator. Now consistent.
- **`TreeNode.toJSON()` contract** — the returned DTO held live `TreeNode` references
  as `children`, so mutating the DTO mutated the tree. Now returns fully plain DTOs.
- **Readonly bypass: empty tree** — `new Tree(null, true).appendChild("x")` used to
  create the root silently. Now throws.
- **Readonly bypass: root removal** — `tree.remove(tree.root.id)` on a readonly tree
  used to succeed. Now throws.
- **Readonly bypass: direct `children` mutation** — `readonlyNode.children.push(...)`
  bypassed the readonly flag entirely. `children` arrays are now frozen; direct
  mutation throws `TypeError`.
- **`size(foreignNode)`** — used to return the foreign node's subtree size when it
  had children. Now returns `0` if `from` does not belong to this tree.
- **Traversal generators yielding `null`** — empty trees yielded a single `null`.
  Now yield nothing.

### Changed

- `TreeNode.createId()` uses `crypto.randomUUID()` when available (falls back to
  the previous `Math.random()`-based id when not).
- `TreeNode.appendChild` now runs in O(1) amortized for descendant-less children;
  bulk flat appends are now O(n) rather than O(n²). (5000 flat appends: ~120ms → ~3ms)

### Breaking / behavioral changes

| Area | Before | After |
|------|--------|-------|
| `TreeNode.root` | `TreeNode<T> \| null` | `TreeNode<T>` (non-nullable) |
| Traversal generators | `Generator<TreeNode<T> \| null>` | `Generator<TreeNode<T>>` |
| Empty-tree traversal | yielded one `null` | yields nothing |
| `TreeNode.toJSON().children` | array of live `TreeNode` | array of plain DTOs |
| `replaceChild()` return | `TreeNode<T> \| false` | `TreeNode<T>` (throws on failure) |
| `appendChild` with duplicate/cycle/cross-tree | silently corrupted state | throws |
| `removeChild` / `Tree.remove` effect on subtree | retained stale `parent`/`tree` | fully detached |
| `deepClone` result | `parent` set to original's parent | `parent: null`, `tree: null` |
| Readonly empty-tree `appendChild` | created root silently | throws |
| Readonly `tree.remove(root.id)` | cleared root silently | throws |
| Readonly `node.children.push(...)` | silently mutated | `TypeError` |
| `size(foreignNode)` | returned subtree size if it had children | `0` |
| `findLCA(ancestor, descendant)` | returned root | returns ancestor |
| `TreeNode.findAllBy` self-match | ignored comparator | uses comparator |

Callers most likely affected:

- Code that checked `node.root === null` to detect detached nodes — use
  `node.isRoot` or `node.parent === null` instead.
- Code collecting traversal output as `[...tree.preOrderTraversal()]` and expecting
  length `1` for an empty tree — it is now `0`.
- Code that tested `replaceChild(...) === false` — wrap in `try/catch`.
- Code that relied on mutating `readonlyNode.children` — this was always a bug;
  it now throws.

### Internal

- `__xyz` methods (`__setId`, `__setParent`, `__setTree`, `__setReadonly`,
  `__syncChildren`) are now explicitly marked `@internal`. Their signatures are
  unchanged but they are not part of the stable userland API.
- `__syncChildren` now walks only the subtree rooted at the calling node, not all
  existing siblings (perf fix).
