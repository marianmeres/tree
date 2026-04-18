/**
 * @module
 * TreeNode class representing individual nodes in a tree structure.
 * Each node has a unique ID, a value of type T, parent/child references, and various
 * utility methods for navigation, lookup, and manipulation.
 */
import type { Tree } from "./tree.ts";

/**
 * Tree node data transfer object for serialization.
 * @template T The type of value stored in the node
 */
export interface TreeNodeDTO<T> {
	/** Unique identifier of the node */
	id: string;
	/** The value stored in the node */
	value: T;
	/** Array of child node DTOs */
	children: TreeNodeDTO<T>[];
}

/**
 * The tree node class representing a single node in the tree structure.
 * Each node has a unique id, a value, references to parent/children, and various utility methods.
 * @template T The type of value stored in the node
 */
export class TreeNode<T> {
	protected _id: string;
	protected _children: TreeNode<T>[] = [];
	protected _readonly: boolean = false;

	/**
	 * Generates a short random id prefixed with "n" (safe for HTML element ids).
	 * Uses `crypto.randomUUID()` when available, falls back to `Math.random()`.
	 * @returns A random id string
	 */
	static createId(): string {
		// crypto.randomUUID is available in Deno, modern Node, and modern browsers.
		const c = (globalThis as any).crypto;
		if (c && typeof c.randomUUID === "function") {
			return "n" + (c.randomUUID() as string).replace(/-/g, "");
		}
		return (
			"n" +
			Math.random().toString(36).slice(2) +
			Math.random().toString(36).slice(2)
		);
	}

	/**
	 * Creates a new TreeNode instance.
	 * @param value The value to store in this node
	 * @param _parent Optional parent node reference (null for root/detached nodes)
	 * @param tree Optional reference to the owning Tree instance
	 */
	constructor(
		public value: T,
		protected _parent: TreeNode<T> | null = null,
		// just a convenience reference
		public tree: Tree<T> | null = null
	) {
		this._id = TreeNode.createId();
	}

	// The "__XYZ" methods below are public for cross-class access between Tree and
	// TreeNode but are NOT part of the public userland API. They are marked @internal
	// and may change without notice.

	/**
	 * @internal Sets the id of the node.
	 */
	__setId(id: string): TreeNode<T> {
		this._id = id;
		return this;
	}

	/**
	 * @internal Sets the parent of the node.
	 */
	__setParent(parent: TreeNode<T> | null): TreeNode<T> {
		this._parent = parent;
		return this;
	}

	/**
	 * @internal Sets the tree reference of the node.
	 */
	__setTree(tree: Tree<T> | null): TreeNode<T> {
		this.tree = tree;
		return this;
	}

	/**
	 * @internal Sets the readonly flag of the node.
	 * When enabling readonly, also freezes the children array so direct mutation throws.
	 */
	__setReadonly(flag: boolean = true): TreeNode<T> {
		this._readonly = !!flag;
		if (this._readonly) {
			// Freeze children array so `node.children.push/splice/...` throws
			// instead of silently bypassing readonly.
			Object.freeze(this._children);
		}
		return this;
	}

	/**
	 * @internal Synchronizes descendants' parent/tree/readonly references recursively.
	 * Only walks the subtree rooted at `this` (does NOT touch siblings).
	 */
	__syncChildren(): void {
		const _walk = (children: TreeNode<T>[], parent: TreeNode<T>) => {
			for (const child of children) {
				child
					.__setParent(parent)
					.__setTree(parent.tree)
					.__setReadonly(parent.readonly);
				_walk(child.children, child);
			}
		};
		return _walk(this._children, this);
	}

	/**
	 * Gets the depth (level) of the node in the tree.
	 * Root node has depth 0, its children have depth 1, etc.
	 */
	get depth(): number {
		return this.path.length;
	}

	/**
	 * Gets the readonly flag of the node.
	 */
	get readonly(): boolean {
		return this._readonly;
	}

	/**
	 * Gets the topmost ancestor of this node.
	 * A node with no parent (root or detached node) returns itself.
	 */
	get root(): TreeNode<T> {
		let current: TreeNode<T> = this;
		while (current._parent) current = current._parent;
		return current;
	}

	/**
	 * Returns array of ancestor nodes from root to parent (self NOT included).
	 * The path is ordered top-down (root first, immediate parent last).
	 */
	get path(): TreeNode<T>[] {
		const path: TreeNode<T>[] = [];
		let parent = this._parent;
		while (parent) {
			path.unshift(parent);
			parent = parent.parent;
		}
		return path;
	}

	/**
	 * Gets the unique id of the node.
	 */
	get id(): string {
		return this._id;
	}

	/**
	 * Gets the parent node.
	 */
	get parent(): TreeNode<T> | null {
		return this._parent;
	}

	/**
	 * Gets the array of direct child nodes.
	 * Note: For readonly nodes, the returned array is frozen; direct mutation will throw.
	 */
	get children(): TreeNode<T>[] {
		return this._children;
	}

	/**
	 * Checks if the node is a leaf (has no children).
	 */
	get isLeaf(): boolean {
		return this._children.length === 0;
	}

	/**
	 * Checks if the node is the root node (has no parent).
	 */
	get isRoot(): boolean {
		return this._parent === null;
	}

	/**
	 * Gets the array of sibling nodes (nodes sharing the same parent, including self).
	 * Returns an empty array if this node has no parent.
	 */
	get siblings(): TreeNode<T>[] {
		return this._parent?.children || [];
	}

	/**
	 * Gets the index of this node within its siblings array.
	 * Returns -1 if this node has no parent.
	 */
	get siblingIndex(): number {
		if (this.siblings.length) {
			return this.siblings.findIndex((n) => n.id === this._id);
		}
		return -1;
	}

	protected _assertNotReadonly() {
		if (this._readonly) {
			throw new Error(`Cannot proceed because the node is marked as readonly`);
		}
	}

	/**
	 * Validates that `node` can be adopted as a direct child of `this`.
	 * Rejects: self-append, duplicates (already a descendant), cycles (ancestor),
	 * cross-tree moves, and nodes that are still attached to another parent.
	 */
	protected _assertAdoptable(node: TreeNode<T>) {
		if (!(node instanceof TreeNode)) return;

		if (node === this) {
			throw new Error(`Cannot append a node to itself`);
		}

		// Node is already somewhere in this subtree (would create a duplicate).
		if (this.contains(node.id)) {
			throw new Error(
				`Cannot append a node that is already a descendant of this node`
			);
		}

		// Node is an ancestor of this (would create a cycle).
		if (node.contains(this.id)) {
			throw new Error(
				`Cannot append an ancestor as a child (would create a cycle)`
			);
		}

		// Node is currently attached to a DIFFERENT parent. Detach it first
		// (e.g., via parent.removeChild / tree.remove / tree.move).
		if (node._parent !== null && node._parent !== this) {
			throw new Error(
				`Cannot append a node that already has a different parent. Detach it first.`
			);
		}

		// Node belongs to a different tree. The caller must detach it first.
		if (node.tree && this.tree && node.tree !== this.tree) {
			throw new Error(
				`Cannot append a node from a different tree. Detach it first.`
			);
		}
	}

	/**
	 * Returns the data representation of the node for serialization.
	 * Children are recursively converted to plain DTO objects (no TreeNode references).
	 */
	toJSON(): TreeNodeDTO<T> {
		return {
			id: this._id,
			value: this.value,
			children: this._children.map((c) => c.toJSON()),
		};
	}

	/**
	 * Creates a deep clone of this node and its entire subtree.
	 * All nodes in the clone receive new unique ids and the returned clone is
	 * fully detached (no parent, no tree reference).
	 */
	deepClone(): TreeNode<T> {
		// Serialize to DTO (with new ids) and reconstruct.
		const dto: TreeNodeDTO<T> = JSON.parse(
			JSON.stringify(this.toJSON(), (k, v) => {
				if (k === "id") return TreeNode.createId();
				return v;
			})
		);

		// Clone is detached: no parent, no tree.
		const clone = new TreeNode<T>(dto.value, null, null);
		clone.__setId(dto.id);

		const _walk = (
			children: TreeNodeDTO<T>["children"],
			parent: TreeNode<T>
		) => {
			for (const child of children) {
				const _node = parent
					.appendChild(child.value, false)
					.__setId(child.id);
				_walk(child.children, _node);
			}
		};
		_walk(dto.children, clone);

		return clone;
	}

	/**
	 * Appends a new child node to this node's children.
	 * @param valueOrNode Value or TreeNode instance to append
	 * @param _sync Whether to sync the new subtree's references (internal optimization flag)
	 * @returns The newly appended TreeNode
	 * @throws Error if node is readonly, or if the node cannot be safely adopted
	 *   (self-append, cycle, duplicate, different parent, cross-tree).
	 */
	appendChild(valueOrNode: T | TreeNode<T>, _sync = true): TreeNode<T> {
		this._assertNotReadonly();

		let child: TreeNode<T>;
		if (valueOrNode instanceof TreeNode) {
			this._assertAdoptable(valueOrNode);
			child = valueOrNode;
		} else {
			child = new TreeNode<T>(valueOrNode);
		}

		child
			.__setParent(this)
			.__setTree(this.tree)
			.__setReadonly(this._readonly);

		this._children.push(child);

		// Only the newly-added subtree needs sync (not existing siblings).
		// This keeps bulk appends O(n) instead of O(n^2).
		if (_sync) child.__syncChildren();

		return child;
	}

	/**
	 * Removes a child node by its id. The removed child becomes fully detached
	 * (its `parent`, `tree`, and `readonly` flags are cleared).
	 * @throws Error if node is readonly or child not found
	 */
	removeChild(id: string): TreeNode<T> {
		this._assertNotReadonly();
		const idx = this._children.findIndex((n) => n.id === id);
		if (idx < 0) throw new Error(`Node "${id}" not found`);

		const removed = this._children[idx];
		this._children.splice(idx, 1);

		// Detach removed subtree so stale references don't lie about location.
		removed.__setParent(null);
		// Clear tree backreference on the removed subtree.
		const _clearTree = (n: TreeNode<T>) => {
			n.__setTree(null);
			for (const c of n.children) _clearTree(c);
		};
		_clearTree(removed);

		return this;
	}

	/**
	 * Replaces a child node with a new node.
	 * @param id The id of the child node to replace
	 * @param valueOrNode Value or TreeNode instance to replace with
	 * @returns The newly inserted TreeNode
	 * @throws Error if node is readonly, child not found, or the replacement
	 *   cannot be safely adopted (cycle, duplicate, different parent, cross-tree).
	 */
	replaceChild(id: string, valueOrNode: T | TreeNode<T>): TreeNode<T> {
		this._assertNotReadonly();
		const idx = this._children.findIndex((n) => n.id === id);
		if (idx < 0) throw new Error(`Node "${id}" not found`);

		let child: TreeNode<T>;
		if (valueOrNode instanceof TreeNode) {
			this._assertAdoptable(valueOrNode);
			child = valueOrNode;
		} else {
			child = new TreeNode<T>(valueOrNode);
		}

		// Detach the old child first.
		const old = this._children[idx];
		old.__setParent(null);
		const _clearTree = (n: TreeNode<T>) => {
			n.__setTree(null);
			for (const c of n.children) _clearTree(c);
		};
		_clearTree(old);

		child
			.__setParent(this)
			.__setTree(this.tree)
			.__setReadonly(this._readonly);
		this._children[idx] = child;
		child.__syncChildren();
		return child;
	}

	/**
	 * Removes all existing children and replaces them with new ones.
	 * Previously attached children become detached.
	 * @throws Error if node is readonly
	 */
	resetChildren(valuesOrNodes: (T | TreeNode<T>)[] = []): TreeNode<T> {
		this._assertNotReadonly();

		// Detach existing children before dropping them.
		const _clearTree = (n: TreeNode<T>) => {
			n.__setTree(null);
			for (const c of n.children) _clearTree(c);
		};
		for (const old of this._children) {
			old.__setParent(null);
			_clearTree(old);
		}
		this._children = [];

		(valuesOrNodes || []).forEach((v) => this.appendChild(v, false));
		// Sync whole subtree once at the end.
		this.__syncChildren();
		return this;
	}

	/**
	 * Gets the previous sibling node (to the left in the siblings array).
	 * @returns The previous sibling or null if this is the first sibling (or has no parent)
	 */
	previousSibling(): TreeNode<T> | null {
		if (this.siblings.length) {
			const selfIdx = this.siblings.findIndex((n) => n.id === this._id);
			return this.siblings[selfIdx - 1] || null;
		}
		return null;
	}

	/**
	 * Gets the next sibling node (to the right in the siblings array).
	 * @returns The next sibling or null if this is the last sibling (or has no parent)
	 */
	nextSibling(): TreeNode<T> | null {
		if (this.siblings.length) {
			const selfIdx = this.siblings.findIndex((n) => n.id === this._id);
			return this.siblings[selfIdx + 1] || null;
		}
		return null;
	}

	/**
	 * Moves this node to a different position within its siblings array.
	 * Negative indices count from the end. Out-of-range values are clamped.
	 * @param toIndex Target final index position
	 * @throws Error if node is readonly
	 */
	moveSiblingIndex(toIndex: number): TreeNode<T> {
		this._assertNotReadonly();

		// nothing to move...
		if (this.siblings.length < 2) return this;

		const fromIndex = this.siblingIndex;

		// Normalize: negative counts from end, positive clamps to valid range.
		// Clamping is applied to the POST-removal length (siblings.length - 1)
		// because splice insertion target is relative to the shortened array.
		if (toIndex < 0) {
			toIndex = Math.max(0, this.siblings.length - 1 + toIndex);
		} else {
			toIndex = Math.min(toIndex, this.siblings.length - 1);
		}

		if (toIndex === fromIndex) return this;

		this.siblings.splice(toIndex, 0, this.siblings.splice(fromIndex, 1)[0]);
		return this;
	}

	/**
	 * Checks if a node with the given id exists within this node's descendants.
	 * Note: a node does NOT contain itself.
	 * @param maxDepth Maximum depth to search (0 = unlimited)
	 * @throws Error if id is empty
	 */
	contains(id: string, maxDepth = 0): boolean {
		if (!id) throw new Error(`Missing id`);

		const _walk = (children: TreeNode<T>[], depth: number): boolean => {
			if (maxDepth > 0 && ++depth > maxDepth) return false;
			for (const child of children) {
				if (child.id === id) return true;
				if (_walk(child.children, depth)) return true;
			}
			return false;
		};

		return _walk(this._children, 0);
	}

	/**
	 * Checks if a node with the given value exists within this node's descendants.
	 * @param maxDepth Maximum depth to search (0 = unlimited)
	 * @param valueCompareEqualFn Optional custom comparison function (default: strict `===`)
	 */
	has(
		value: T,
		maxDepth = 0,
		valueCompareEqualFn?: (a: T, b: T) => boolean
	): boolean {
		const cmp = valueCompareEqualFn ?? ((a: T, b: T) => a === b);

		const _walk = (children: TreeNode<T>[], depth: number): boolean => {
			if (maxDepth > 0 && ++depth > maxDepth) return false;
			for (const child of children) {
				if (cmp(child.value, value)) return true;
				if (_walk(child.children, depth)) return true;
			}
			return false;
		};

		return _walk(this._children, 0);
	}

	/**
	 * Checks if this node matches a value or property+value pair.
	 * @param propName Optional property name to match within node value
	 * @param valueCompareEqualFn Optional custom comparison function (default: strict `===`)
	 * @returns This node if matches, null otherwise
	 */
	matches(
		valueOrPropValue: any,
		propName: string | null = null,
		valueCompareEqualFn?: (a: T, b: T) => boolean
	): TreeNode<T> | null {
		const cmp = valueCompareEqualFn ?? ((a: T, b: T) => a === b);

		// search by prop + value (strict equality on the prop; comparator is for value-level matching)
		if (
			propName &&
			(this.value as any)?.[propName] !== undefined &&
			(this.value as any)[propName] === valueOrPropValue
		) {
			return this;
		}
		// search by value only
		if (!propName && cmp(this.value, valueOrPropValue)) {
			return this;
		}
		return null;
	}

	/**
	 * Searches all nodes (self + descendants) by value or property+value pair.
	 * @param maxDepth Maximum depth to search (0 = unlimited)
	 * @param valueCompareEqualFn Optional custom comparison function (default: strict `===`)
	 */
	findAllBy(
		valueOrPropValue: any,
		propName: string | null = null,
		maxDepth = 0,
		valueCompareEqualFn?: (a: T, b: T) => boolean
	): TreeNode<T>[] {
		const cmp = valueCompareEqualFn ?? ((a: T, b: T) => a === b);

		const _walk = (
			children: TreeNode<T>[],
			depth: number,
			results: TreeNode<T>[]
		) => {
			if (maxDepth > 0 && ++depth > maxDepth) return results;

			for (const node of children) {
				if (node.matches(valueOrPropValue, propName, cmp)) {
					results.push(node);
				}
				results = _walk(node.children, depth, results);
			}
			return results;
		};

		// compare self as well (pass the comparator through)
		const selfMatch = this.matches(valueOrPropValue, propName, cmp);
		const results: TreeNode<T>[] = selfMatch ? [selfMatch] : [];

		return _walk(this._children, 0, results);
	}

	/**
	 * Returns string representation of this node (for debugging purposes).
	 * Shows indentation based on depth and the node's value.
	 */
	toString(): string {
		let s = this.value?.toString();
		if (s === "[object Object]") s = this.id;
		return "    ".repeat(this.depth) + s;
	}
}
