/**
 * @module
 * Tree class representing the top-level tree data structure container.
 * Provides traversal methods (pre-order, post-order, level-order), node lookup and search,
 * subtree manipulation (move, copy, remove), and serialization/deserialization support.
 */
import { TreeNode, type TreeNodeDTO } from "./tree-node.ts";

/**
 * The top Tree data structure class abstraction.
 * Represents a tree with a single root node and provides methods for traversal,
 * manipulation, and serialization.
 * @template T The type of value stored in each node
 */
export class Tree<T> {
	/**
	 * Creates a new Tree instance.
	 * @param _root Optional root node to initialize the tree with
	 * @param _readonly Whether to mark the tree as readonly (prevents all mutations)
	 */
	constructor(
		protected _root: TreeNode<T> | null = null,
		protected _readonly = false
	) {
		if (this._root) {
			this._root
				.__setTree(this)
				.__setReadonly(this._readonly)
				.__syncChildren();
			if (this._readonly) this._freezeAll();
		}
	}

	/**
	 * Returns boolean whether the tree is marked as readonly.
	 */
	get readonly(): boolean {
		return this._readonly;
	}

	/**
	 * Gets the root node of the tree.
	 * @returns The root node or null if tree is empty
	 */
	get root(): TreeNode<T> | null {
		return this._root;
	}

	/**
	 * @internal Sets the tree-level readonly flag and propagates to every node.
	 * Enabling readonly also freezes each node's children array.
	 */
	__setReadonly(flag: boolean = true): Tree<T> {
		this._readonly = !!flag;
		if (this._root) {
			this._root.__setReadonly(this._readonly).__syncChildren();
			if (this._readonly) this._freezeAll();
		}
		return this;
	}

	/**
	 * Freezes the children arrays of every node in the tree. Used when activating readonly.
	 */
	protected _freezeAll() {
		for (const node of this.preOrderTraversal()) {
			node.__setReadonly(true);
		}
	}

	protected _assertNotReadonly() {
		if (this._readonly) {
			throw new Error(`Cannot proceed because the tree is marked as readonly`);
		}
	}

	/**
	 * Creates new Tree from provided input (factory method).
	 * @param dump Serialized tree data (string or DTO object)
	 * @param _readonly Whether to mark the tree as readonly
	 * @returns New Tree instance
	 */
	static factory<T>(
		dump: string | TreeNodeDTO<T>,
		_readonly = false
	): Tree<T> {
		return new Tree<T>(null, _readonly).restore(dump);
	}

	/**
	 * Appends a new node to the tree.
	 * If the tree has no root, the new node becomes the root; otherwise, appends to root.
	 * @throws Error if the tree is readonly, or the node cannot be safely adopted
	 */
	appendChild(valueOrNode: T | TreeNode<T>): TreeNode<T> {
		this._assertNotReadonly();

		if (this._root) {
			return this._root
				.appendChild(valueOrNode)
				.__setReadonly(this._readonly);
		}

		// Creating the root.
		const root =
			valueOrNode instanceof TreeNode
				? valueOrNode
				: new TreeNode<T>(valueOrNode);

		// If caller supplied a TreeNode, validate it is adoptable as root:
		// it must not already be attached to a parent or another tree.
		if (valueOrNode instanceof TreeNode) {
			if (valueOrNode.parent !== null) {
				throw new Error(
					`Cannot set a node with an existing parent as tree root. Detach it first.`
				);
			}
			if (valueOrNode.tree && valueOrNode.tree !== this) {
				throw new Error(
					`Cannot set a node from a different tree as root. Detach it first.`
				);
			}
		}

		this._root = root;
		this._root
			.__setTree(this)
			.__setReadonly(this._readonly)
			.__syncChildren();
		return this._root;
	}

	/**
	 * Depth-first, pre-order traversal generator.
	 * @see https://en.wikipedia.org/wiki/Tree_traversal
	 * @param node Optional starting node (defaults to root). If the tree is empty, yields nothing.
	 */
	*preOrderTraversal(node?: TreeNode<T> | null): Generator<TreeNode<T>> {
		node ??= this._root;
		if (!node) return;
		yield node;
		for (const child of node.children) {
			yield* this.preOrderTraversal(child);
		}
	}

	/**
	 * Depth-first, post-order traversal generator.
	 * @see https://en.wikipedia.org/wiki/Tree_traversal
	 * @param node Optional starting node (defaults to root). If the tree is empty, yields nothing.
	 */
	*postOrderTraversal(node?: TreeNode<T> | null): Generator<TreeNode<T>> {
		node ??= this._root;
		if (!node) return;
		for (const child of node.children) {
			yield* this.postOrderTraversal(child);
		}
		yield node;
	}

	/**
	 * Breadth-first, level-order traversal generator.
	 * @param node Optional starting node (defaults to root). If the tree is empty, yields nothing.
	 */
	*levelOrderTraversal(node?: TreeNode<T> | null): Generator<TreeNode<T>> {
		node ??= this._root;
		if (!node) return;
		const queue: TreeNode<T>[] = [node];
		while (queue.length) {
			const current = queue.shift()!;
			yield current;
			for (const child of current.children) queue.push(child);
		}
	}

	/**
	 * Searches for a node by its unique id.
	 * @returns The matching TreeNode or null if not found
	 * @throws Error if id is empty
	 */
	find(id: string): TreeNode<T> | null {
		if (!id) throw new Error(`Missing id`);
		for (const node of this.preOrderTraversal()) {
			if (node.id === id) return node;
		}
		return null;
	}

	/**
	 * Searches all nodes (including root) by given value or property+value pair.
	 * @param propName Optional property name to search within node values (for object values)
	 * @param maxDepth Maximum depth to search (0 = unlimited)
	 * @param valueCompareEqualFn Optional custom comparison function
	 */
	findAllBy(
		valueOrPropValue: any,
		propName: string | null = null,
		maxDepth = 0,
		valueCompareEqualFn?: (a: T, b: T) => boolean
	): TreeNode<T>[] {
		return (
			this.root?.findAllBy(
				valueOrPropValue,
				propName,
				maxDepth,
				valueCompareEqualFn
			) ?? []
		);
	}

	/**
	 * Searches for the lowest common ancestor (LCA) of two nodes.
	 * Handles the ancestor-descendant case (returns the ancestor node).
	 * @returns The lowest common ancestor TreeNode, or null if tree is empty
	 * @throws Error if either id is missing or nodes are not found
	 */
	findLCA(node1Id: string, node2Id: string): TreeNode<T> | null {
		if (!node1Id || !node2Id) throw new Error(`Missing id`);

		const n1 = this.find(node1Id);
		const n2 = this.find(node2Id);

		if (!n1 || !n2) {
			throw new Error(`Node "${node1Id}" and/or "${node2Id}" not found`);
		}

		if (n1 === n2) return n1;

		// Include self in the ancestor sets so ancestor-descendant pairs are
		// resolved correctly (e.g. LCA(root.child, root) === root).
		const chain1 = [...n1.path, n1];
		const chain2 = [...n2.path, n2];

		const ids1 = new Set(chain1.map((n) => n.id));

		// Walk chain2 top-down; last match wins.
		let lca: TreeNode<T> | null = null;
		for (const n of chain2) {
			if (ids1.has(n.id)) lca = n;
			else break;
		}

		return lca;
	}

	/**
	 * Inserts a new node under the specified parent node.
	 * @throws Error if the tree is readonly or parent node is not found
	 */
	insert(parentNodeId: string, value: T): TreeNode<T> {
		this._assertNotReadonly();
		const node = this.find(parentNodeId);
		if (node) {
			return node.appendChild(value).__setReadonly(this._readonly);
		}
		throw new Error(`Node "${parentNodeId}" not found`);
	}

	/**
	 * Removes a node and its entire subtree by id.
	 * Removed subtree is fully detached (parent/tree references cleared).
	 * @throws Error if the tree is readonly, id is empty, or node is not found
	 */
	remove(id: string): Tree<T> {
		this._assertNotReadonly();
		if (!id) throw new Error(`Missing id`);

		if (this._root?.id === id) {
			const old = this._root;
			this._root = null;
			old.__setTree(null);
			// Clear tree backrefs in former subtree.
			const _clearTree = (n: TreeNode<T>) => {
				n.__setTree(null);
				for (const c of n.children) _clearTree(c);
			};
			_clearTree(old);
			return this;
		}

		for (const node of this.preOrderTraversal()) {
			if (node.id === id) {
				// node.parent must exist because node !== root is guaranteed above.
				node.parent!.removeChild(id);
				return this;
			}
		}

		throw new Error(`Node "${id}" not found`);
	}

	protected _moveOrCopy(
		srcNodeId: string,
		targetNodeId: string,
		isMove: boolean
	): TreeNode<T> {
		this._assertNotReadonly();

		const src = this.find(srcNodeId);
		if (!src) throw new Error(`Source node "${srcNodeId}" not found`);

		// recursive reference is not allowed for move
		if (isMove && src.contains(targetNodeId)) {
			throw new Error(
				`Recursive reference detected (node cannot be moved to its own descendant)`
			);
		}

		const target = this.find(targetNodeId);
		if (!target) throw new Error(`Target node "${targetNodeId}" not found`);

		// moving to self makes no sense
		if (isMove && target === src) throw new Error(`Cannot move to self`);

		// moving to same parent is a noop (node is already a child of target)
		if (isMove && target === src.parent) return src;

		if (isMove) {
			// Detach src from current parent first, then append to target.
			// (remove() clears src.parent/tree so appendChild validation passes.)
			this.remove(src.id);
			return target.appendChild(src).__setReadonly(this._readonly);
		}
		return target.appendChild(src.deepClone()).__setReadonly(this._readonly);
	}

	/**
	 * Moves a node (with its subtree) to become a child of the target node.
	 * @returns The moved TreeNode in its new location
	 * @throws Error if the tree is readonly, nodes not found, recursive reference, or moving to self
	 */
	move(srcNodeId: string, targetNodeId: string): TreeNode<T> {
		return this._moveOrCopy(srcNodeId, targetNodeId, true);
	}

	/**
	 * Copies a node (with its subtree) to become a child of the target node.
	 * All copied nodes receive fresh unique ids.
	 * @returns The newly copied TreeNode
	 * @throws Error if the tree is readonly or nodes are not found
	 */
	copy(srcNodeId: string, targetNodeId: string): TreeNode<T> {
		return this._moveOrCopy(srcNodeId, targetNodeId, false);
	}

	/**
	 * Returns the internal data structure representation.
	 * @returns TreeNodeDTO object or undefined if tree is empty
	 */
	toJSON(): TreeNodeDTO<T> | undefined {
		return this._root?.toJSON();
	}

	/**
	 * Serializes the tree to a JSON string.
	 */
	dump(): string {
		return JSON.stringify(this);
	}

	/**
	 * Restores tree state from serialized data, replacing any existing content.
	 * @param dump Serialized tree data (JSON string or DTO object)
	 * @returns This tree instance for chaining
	 */
	restore(dump: string | TreeNodeDTO<T>): Tree<T> {
		const parsed: TreeNodeDTO<T> =
			typeof dump === "string" ? JSON.parse(dump) : (dump as TreeNodeDTO<T>);

		// Detach any existing root so we leave clean state.
		if (this._root) {
			const old = this._root;
			this._root = null;
			old.__setTree(null);
			const _clearTree = (n: TreeNode<T>) => {
				n.__setTree(null);
				for (const c of n.children) _clearTree(c);
			};
			_clearTree(old);
		}

		const _walk = (
			children: TreeNodeDTO<T>["children"],
			parent: TreeNode<T>
		) => {
			for (const child of children) {
				const node = parent
					.appendChild(child.value, false)
					.__setTree(this)
					.__setId(child.id);
				_walk(child.children, node);
			}
		};

		const root = new TreeNode(parsed.value).__setTree(this).__setId(parsed.id);
		_walk(parsed.children, root);
		this._root = root;

		// Apply readonly at the very end so the build-up above isn't blocked.
		if (this._readonly) this._freezeAll();

		return this;
	}

	/**
	 * Returns the total number of nodes in the tree or subtree.
	 * If `from` does not belong to this tree (its root ancestor isn't this tree's root),
	 * returns 0.
	 * @param from Optional starting node (defaults to root)
	 */
	size(from?: TreeNode<T> | null): number {
		from ??= this._root;
		if (!from) return 0;

		// Guard: `from` must belong to this tree (its topmost ancestor is this tree's root).
		if (from.root !== this._root) return 0;

		let n = 0;
		for (const _ of this.preOrderTraversal(from)) n++;
		return n;
	}

	/**
	 * Checks if a node with the given id exists in the tree.
	 * @param maxDepth Maximum depth to search (0 = unlimited)
	 */
	contains(id: string, maxDepth = 0): boolean {
		return !!this._root?.contains(id, maxDepth);
	}

	/**
	 * Checks if a node with the given value exists in the tree (excluding the root value).
	 * @param maxDepth Maximum depth to search (0 = unlimited)
	 * @param compareFn Optional custom comparison function (default: strict `===`)
	 */
	has(value: T, maxDepth = 0, compareFn?: (a: T, b: T) => boolean): boolean {
		return !!this._root?.has(value, maxDepth, compareFn);
	}

	/**
	 * Returns string representation of the tree (for debugging purposes).
	 */
	toString(): string {
		return [...this.preOrderTraversal()].map((n) => n.toString()).join("\n");
	}
}
