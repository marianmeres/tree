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
	 * Generates a random 8-character id prefixed with "n" (safe for HTML element ids).
	 * @returns A random id string
	 */
	static createId(): string {
		return (
			"n" +
			Math.random().toString(36).slice(2) +
			Math.random().toString(36).slice(2)
		);
	}

	/**
	 * Creates a new TreeNode instance.
	 * @param value The value to store in this node
	 * @param _parent Optional parent node reference (null for root nodes)
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

	// the "__XYZ" methods below are public, but not meant as a true userland api (mostly used
	// internally)... this is a consciously pragmatic decision (yet somewhat ugly from the
	// OO design point of view)

	/**
	 * Sets the id of the node (internal use only).
	 * @param id The new id
	 * @returns This node instance for chaining
	 */
	__setId(id: string): TreeNode<T> {
		this._id = id;
		return this;
	}

	/**
	 * Sets the parent of the node (internal use only).
	 * @param parent The new parent node or null
	 * @returns This node instance for chaining
	 */
	__setParent(parent: TreeNode<T> | null): TreeNode<T> {
		this._parent = parent;
		return this;
	}

	/**
	 * Sets the tree reference of the node (internal use only).
	 * @param tree The tree instance or null
	 * @returns This node instance for chaining
	 */
	__setTree(tree: Tree<T> | null): TreeNode<T> {
		this.tree = tree;
		return this;
	}

	/**
	 * Sets the readonly flag of the node (internal use only).
	 * @param flag Whether to mark as readonly
	 * @returns This node instance for chaining
	 */
	__setReadonly(flag: boolean = true): TreeNode<T> {
		this._readonly = flag;
		return this;
	}

	/**
	 * Synchronizes children references (parent, tree, readonly) recursively (internal use only).
	 * Used during node move/copy/append operations.
	 */
	__syncChildren(): void {
		const _walk = (children: TreeNode<T>[], parent: TreeNode<T> | null) => {
			for (const child of children) {
				child
					.__setParent(parent)
					.__setTree(parent?.tree || null)
					.__setReadonly(parent?.readonly);
				_walk(child.children, child);
			}
		};
		return _walk(this._children, this);
	}

	/**
	 * Gets the depth (level) of the node in the tree.
	 * Root node has depth 0, its children have depth 1, etc.
	 * @returns The depth level
	 */
	get depth(): number {
		return this.path.length;
	}

	/**
	 * Gets the readonly flag of the node.
	 * @returns True if readonly, false otherwise
	 */
	get readonly(): boolean {
		return this._readonly;
	}

	/**
	 * Gets the root node of the tree this node belongs to.
	 * @returns The root node or null if this is a standalone node
	 */
	get root(): TreeNode<T> | null {
		let parent = this._parent;
		let _lastNotEmpty = parent;
		while (parent) {
			parent = parent.parent;
			if (parent) _lastNotEmpty = parent;
		}
		return _lastNotEmpty;
	}

	/**
	 * Returns array of ancestor nodes from root to parent (self NOT included).
	 * The path is ordered top-down (root first, immediate parent last).
	 * @returns Array of ancestor TreeNode instances
	 */
	get path(): TreeNode<T>[] {
		let parent = this._parent;
		const path: TreeNode<T>[] = [];
		if (parent) path.push(parent);
		while (parent) {
			parent = parent.parent;
			if (parent) path.unshift(parent);
		}
		return path;
	}

	/**
	 * Gets the unique id of the node.
	 * @returns The node id
	 */
	get id(): string {
		return this._id;
	}

	/**
	 * Gets the parent node.
	 * @returns The parent node or null if this is root
	 */
	get parent(): TreeNode<T> | null {
		return this._parent;
	}

	/**
	 * Gets the array of direct child nodes.
	 * @returns Array of child TreeNode instances
	 */
	get children(): TreeNode<T>[] {
		return this._children;
	}

	/**
	 * Checks if the node is a leaf (has no children).
	 * @returns True if leaf node, false otherwise
	 */
	get isLeaf(): boolean {
		return this._children.length === 0;
	}

	/**
	 * Checks if the node is the root node (has no parent).
	 * @returns True if root node, false otherwise
	 */
	get isRoot(): boolean {
		return this._parent === null;
	}

	/**
	 * Gets the array of sibling nodes (nodes sharing the same parent).
	 * @returns Array of sibling TreeNode instances (includes self)
	 */
	get siblings(): TreeNode<T>[] {
		return this._parent?.children || [];
	}

	/**
	 * Gets the index of this node within its siblings array.
	 * @returns The sibling index, or -1 if no siblings
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

	protected _assertSameTopRootNode(node: TreeNode<T>) {
		// intentionally not comparing node.tree vs this.tree as it might not be available yet
		if (!this.isRoot && node instanceof TreeNode && node.root !== this.root) {
			throw new Error(
				`Cannot proceed with a node from a different tree. (Use node's value instead.)`
			);
		}
	}

	protected _assertNotContains(node: TreeNode<T>) {
		if (node instanceof TreeNode && this.contains(node.id)) {
			throw new Error(`Cannot proceed, already contains`);
		}
	}

	protected _assertIsNotSiblingOf(node: TreeNode<T>) {
		if (
			node instanceof TreeNode &&
			this.siblings.some((s) => s.id === node.id)
		) {
			throw new Error(`Cannot proceed (is sibling of)`);
		}
	}

	/**
	 * Returns the data representation of the node for serialization.
	 * @returns TreeNodeDTO object
	 */
	toJSON(): TreeNodeDTO<T> {
		return { id: this._id, value: this.value, children: this._children };
	}

	/**
	 * Creates a deep clone of this node and its entire subtree.
	 * All nodes in the clone will have new unique ids.
	 * @returns A new TreeNode instance that is a deep copy
	 */
	deepClone(): TreeNode<T> {
		// quick-n-dirty
		const dto: TreeNodeDTO<T> = JSON.parse(
			JSON.stringify(this.toJSON(), (k, v) => {
				// create new id
				if (k === "id") return TreeNode.createId();
				return v;
			})
		);

		const clone = new TreeNode<T>(dto.value, this._parent);
		clone.__setId(dto.id);

		const _walk = (
			children: TreeNodeDTO<T>["children"],
			parent: TreeNode<T>
		) => {
			for (const child of children) {
				const _node = parent.appendChild(child.value).__setId(child.id);
				_walk(child.children, _node);
			}
		};
		_walk(dto.children, clone);

		return clone;
	}

	/**
	 * Appends a new child node to this node's children.
	 * @param valueOrNode Value or TreeNode instance to append
	 * @param _sync Whether to sync children references (internal parameter)
	 * @returns The newly appended TreeNode
	 * @throws Error if node is readonly or other validation fails
	 */
	appendChild(valueOrNode: T | TreeNode<T>, _sync = true): TreeNode<T> {
		this._assertNotReadonly();
		this._assertSameTopRootNode(valueOrNode as any);
		this._assertIsNotSiblingOf(valueOrNode as any);

		const child =
			valueOrNode instanceof TreeNode
				? valueOrNode
				: new TreeNode(valueOrNode, this);
		child.__setParent(this);
		this._children.push(child);

		// allow to skip sync via flag (optimizing for bulk and/or restore operations)
		_sync && this.__syncChildren();

		return child;
	}

	/**
	 * Removes a child node by its id.
	 * @param id The id of the child node to remove
	 * @returns This node instance for chaining
	 * @throws Error if node is readonly or child not found
	 */
	removeChild(id: string): TreeNode<T> {
		this._assertNotReadonly();
		const idx = this._children.findIndex((n) => n.id === id);
		if (idx < 0) throw new Error(`Node "${id}" not found`);

		this._children.splice(idx, 1);
		return this;
	}

	/**
	 * Replaces a child node with a new node.
	 * @param id The id of the child node to replace
	 * @param valueOrNode Value or TreeNode instance to replace with
	 * @returns The newly replaced TreeNode, or false on failure
	 * @throws Error if node is readonly, child not found, or validation fails
	 */
	replaceChild(id: string, valueOrNode: T | TreeNode<T>): TreeNode<T> | false {
		this._assertNotReadonly();
		this._assertSameTopRootNode(valueOrNode as any);

		const idx = this._children.findIndex((n) => n.id === id);
		if (idx < 0) throw new Error(`Node "${id}" not found`);

		this._assertNotContains(valueOrNode as any);
		const child =
			valueOrNode instanceof TreeNode
				? valueOrNode
				: new TreeNode(valueOrNode, this);
		child.__setParent(this);
		this._children[idx] = child;
		this.__syncChildren();
		return this._children[idx];
	}

	/**
	 * Removes all existing children and replaces them with new ones.
	 * @param valuesOrNodes Array of values or TreeNode instances
	 * @returns This node instance for chaining
	 * @throws Error if node is readonly
	 */
	resetChildren(valuesOrNodes: (T | TreeNode<T>)[] = []): TreeNode<T> {
		this._assertNotReadonly();
		this._children = [];
		(valuesOrNodes || []).forEach((v) => this.appendChild(v, false));
		this.__syncChildren();
		return this;
	}

	/**
	 * Gets the previous sibling node (to the left in the siblings array).
	 * @returns The previous sibling or null if this is the first sibling
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
	 * @returns The next sibling or null if this is the last sibling
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
	 * @param toIndex Target index position (supports negative indices from end)
	 * @returns This node instance for chaining
	 * @throws Error if node is readonly
	 */
	moveSiblingIndex(toIndex: number): TreeNode<T> {
		this._assertNotReadonly();
		const fromIndex = this.siblingIndex;

		// nothing to move...
		if (this.siblings.length < 2) return this;

		// if greater than length normalize to last
		toIndex = Math.min(toIndex, this.siblings.length - 1);

		// if negative, move that many from end
		if (toIndex < 0) {
			toIndex = Math.max(0, this.siblings.length - 1 + toIndex);
		}

		this.siblings.splice(toIndex, 0, this.siblings.splice(fromIndex, 1)[0]);

		// this is not needed as splice is in-place on reference
		// this._parent?.resetChildren(siblings);

		return this;
	}

	/**
	 * Checks if a node with the given id exists within this node's descendants.
	 * @param id The node id to search for
	 * @param maxDepth Maximum depth to search (0 = unlimited)
	 * @returns True if found, false otherwise
	 * @throws Error if id is empty
	 */
	contains(id: string, maxDepth = 0): boolean {
		if (!id) throw new Error(`Missing id`);

		// self does not contain self, so must not return true
		// if (this.id === id) return true;

		const _walk = (children: TreeNode<T>[], depth: number) => {
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
	 * @param value The value to search for
	 * @param maxDepth Maximum depth to search (0 = unlimited)
	 * @param valueCompareEqualFn Optional custom comparison function
	 * @returns True if found, false otherwise
	 */
	has(
		value: T,
		maxDepth = 0,
		valueCompareEqualFn?: (a: T, b: T) => boolean
	): boolean {
		// strict compare by default
		valueCompareEqualFn ??= (a: T, b: T) => a === b;

		const _walk = (children: TreeNode<T>[], depth: number) => {
			if (maxDepth > 0 && ++depth > maxDepth) return false;
			for (const child of children) {
				// console.log(child.value, value);
				if (valueCompareEqualFn(child.value, value)) return true;
				if (_walk(child.children, depth)) return true;
			}
			return false;
		};

		return _walk(this._children, 0);
	}

	/**
	 * Checks if this node matches a value or property+value pair.
	 * @param valueOrPropValue The value to match, or property value if propName is specified
	 * @param propName Optional property name to match within node value
	 * @param valueCompareEqualFn Optional custom comparison function
	 * @returns This node if matches, null otherwise
	 */
	matches(
		valueOrPropValue: any,
		propName: string | null = null,
		valueCompareEqualFn?: (a: T, b: T) => boolean
	): TreeNode<T> | null {
		// strict compare by default
		valueCompareEqualFn ??= (a: T, b: T) => a === b;
		// search by prop + value
		if (
			propName &&
			(this.value as any)[propName] !== undefined &&
			(this.value as any)[propName] === valueOrPropValue
		) {
			return this;
		}
		// search by value only
		else if (!propName && valueCompareEqualFn(this?.value, valueOrPropValue)) {
			return this;
		}
		return null;
	}

	/**
	 * Searches all nodes (self + descendants) by value or property+value pair.
	 * @param valueOrPropValue The value to search for, or property value if propName is specified
	 * @param propName Optional property name to search within node values
	 * @param maxDepth Maximum depth to search (0 = unlimited)
	 * @param valueCompareEqualFn Optional custom comparison function
	 * @returns Array of matching TreeNode instances
	 */
	findAllBy(
		valueOrPropValue: any,
		propName: string | null = null,
		maxDepth = 0,
		valueCompareEqualFn?: (a: T, b: T) => boolean
	): TreeNode<T>[] {
		// strict compare by default
		valueCompareEqualFn ??= (a: T, b: T) => a === b;

		const _walk = (
			children: TreeNode<T>[],
			depth: number,
			results: TreeNode<T>[]
		) => {
			if (maxDepth > 0 && ++depth > maxDepth) return results;

			for (const node of children) {
				if (node.matches(valueOrPropValue, propName, valueCompareEqualFn)) {
					results.push(node);
				}
				results = _walk(node.children, depth, results);
			}
			return results;
		};

		// compare self as well
		const results = [this.matches(valueOrPropValue, propName)].filter(
			Boolean
		) as TreeNode<T>[];

		return _walk(this._children, 0, results);
	}

	/**
	 * Returns string representation of this node (for debugging purposes).
	 * Shows indentation based on depth and the node's value.
	 * @returns String representation
	 */
	toString(): string {
		let s = this.value?.toString();
		if (s === "[object Object]") s = this.id;
		return "    ".repeat(this.depth) + s;
	}
}
