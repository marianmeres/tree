/**
 * @module
 * A generic tree data structure library providing common traversal, lookup, and node
 * manipulation operations. Supports depth-first (pre-order, post-order) and breadth-first
 * (level-order) traversals, node search by ID or value, subtree move/copy, serialization,
 * and readonly mode.
 *
 * @example Basic usage
 * ```ts
 * import { Tree, TreeNode } from "@marianmeres/tree";
 *
 * const tree = new Tree<string>();
 * const root = tree.appendChild("root");
 * root.appendChild("child1");
 * root.appendChild("child2");
 *
 * for (const node of tree.preOrderTraversal()) {
 *   console.log(node?.value);
 * }
 * ```
 */
export { TreeNode, type TreeNodeDTO } from "./tree/tree-node.ts";
export { Tree } from "./tree/tree.ts";
