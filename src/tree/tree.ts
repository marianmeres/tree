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
			this._root.__setTree(this).__setReadonly(this._readonly).__syncChildren();
		}
	}

	/**
	 * Returns boolean whether the tree is marked as readonly.
	 * @returns True if the tree is readonly, false otherwise
	 */
	get readonly(): boolean {
		return this._readonly;
	}

	/**
	 * Sets internal readonly flag (internal use only).
	 * @param flag Whether to mark the tree as readonly
	 * @returns This tree instance for chaining
	 */
	__setReadonly(flag: boolean = true): Tree<T> {
		this._readonly = !!flag;
		if (this._root) this._root.__setReadonly(this._readonly).__syncChildren();
		return this;
	}

	/**
	 * Creates new Tree from provided input (factory method).
	 * @param dump Serialized tree data (string or DTO object)
	 * @param _readonly Whether to mark the tree as readonly
	 * @returns New Tree instance
	 */
	static factory<T>(dump: string | TreeNodeDTO<T>, _readonly = false): Tree<T> {
		return new Tree<T>(null, _readonly).restore(dump);
	}

	/**
	 * Appends new node to the tree.
	 * If tree has no root, the new node becomes the root.
	 * Otherwise, appends to the existing root.
	 * @param valueOrNode Value or TreeNode instance to append
	 * @returns The newly appended TreeNode
	 */
	appendChild(valueOrNode: T | TreeNode<T>): TreeNode<T> {
		if (this._root) {
			return this._root.appendChild(valueOrNode).__setReadonly(this._readonly);
		} else {
			this._root =
				valueOrNode instanceof TreeNode
					? valueOrNode
					: new TreeNode(valueOrNode);
			this._root.__setTree(this).__syncChildren();
			return this._root;
		}
	}

	/**
	 * Gets the root node of the tree.
	 * @returns The root node or null if tree is empty
	 */
	get root(): TreeNode<T> | null {
		return this._root;
	}

	/**
	 * Depth-first, pre-order traversal generator.
	 * @see https://en.wikipedia.org/wiki/Tree_traversal
	 * @param node Optional starting node (defaults to root)
	 * @yields TreeNode instances in pre-order sequence
	 */
	*preOrderTraversal(node?: TreeNode<T> | null): Generator<TreeNode<T> | null> {
		node ??= this._root;
		yield node;
		if (node?.children.length) {
			for (const child of node.children) {
				yield* this.preOrderTraversal(child);
			}
		}
	}

	/**
	 * Depth-first, post-order traversal generator.
	 * @see https://en.wikipedia.org/wiki/Tree_traversal
	 * @param node Optional starting node (defaults to root)
	 * @yields TreeNode instances in post-order sequence
	 */
	*postOrderTraversal(
		node?: TreeNode<T> | null
	): Generator<TreeNode<T> | null> {
		node ??= this._root;
		if (node?.children.length) {
			for (const child of node.children) {
				yield* this.postOrderTraversal(child);
			}
		}
		yield node;
	}

	/**
	 * Breadth-first, level-order traversal generator.
	 * @param node Optional starting node (defaults to root)
	 * @yields TreeNode instances in level-order sequence
	 */
	*levelOrderTraversal(
		node?: TreeNode<T> | null
	): Generator<TreeNode<T> | null> {
		node ??= this._root;
		if (!node) return;
		const queue: (TreeNode<T> | null)[] = [node];
		while (queue.length) {
			const current = queue.shift();
			if (current) {
				yield current;
				for (const child of current.children) {
					queue.push(child);
				}
			}
		}
	}

	/**
	 * Searches for a node by its unique id.
	 * @param id The node id to search for
	 * @returns The matching TreeNode or null if not found
	 * @throws Error if id is empty
	 */
	find(id: string): TreeNode<T> | null {
		if (!id) throw new Error(`Missing id`);
		for (const node of this.preOrderTraversal()) {
			if (node?.id === id) return node;
		}
		return null;
	}

	/**
	 * Searches all nodes (including root) by given value or property+value pair.
	 * @param valueOrPropValue The value to search for, or property value if propName is specified
	 * @param propName Optional property name to search within node values (for object values)
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
	 * @param node1Id The id of the first node
	 * @param node2Id The id of the second node
	 * @returns The lowest common ancestor TreeNode, or null if not found
	 * @throws Error if either id is missing or nodes are not found
	 */
	findLCA(node1Id: string, node2Id: string): TreeNode<T> | null {
		// some empty arg? -> no lca
		if (!node1Id || !node2Id) throw new Error(`Missing id`);

		// find starting bottom nodes
		const n1 = this.find(node1Id);
		const n2 = this.find(node2Id);

		// some not found? -> no lca
		if (!n1 || !n2)
			throw new Error(`Node "${node1Id}" and/or "${node2Id}" not found`);

		// same nodes? -> lca
		if (n1 === n2) return n1;

		// create a lookup map of hierarchy nodes from one path
		const map1: Record<string, TreeNode<T>> = n1.path.reduce(
			(m, n) => ({ ...m, [n.id]: n }),
			{}
		);

		// now traverse the other (path is sorted top-down) and return the lowest match
		let lca = this._root;
		for (const n of n2.path) {
			if (!map1[n.id]) return lca;
			lca = map1[n.id];
		}

		//
		return lca;
	}

	/**
	 * Inserts new node under the specified parent node.
	 * @param parentNodeId The id of the parent node
	 * @param value The value for the new node
	 * @returns The newly created TreeNode
	 * @throws Error if parent node is not found
	 */
	insert(parentNodeId: string, value: T): TreeNode<T> {
		const node = this.find(parentNodeId);
		if (node) {
			return node.appendChild(value).__setReadonly(this._readonly);
		}
		throw new Error(`Node "${parentNodeId}" not found`);
	}

	/**
	 * Removes a node and its entire subtree by id.
	 * @param id The id of the node to remove
	 * @returns This tree instance for chaining
	 * @throws Error if id is empty or node is not found
	 */
	remove(id: string): Tree<T> {
		if (!id) throw new Error(`Missing id`);

		if (this._root?.id === id) {
			this._root = null;
			return this;
		}

		for (const node of this.preOrderTraversal()) {
			if (node?.id === id && node?.parent?.removeChild(id)) {
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
		const src = this.find(srcNodeId);
		if (!src) throw new Error(`Source node "${srcNodeId}" not found`);

		// recursive reference is not allowed
		if (isMove && src.contains(targetNodeId)) {
			throw new Error(
				`Recursive reference detected (node cannot be moved to its own descendant)`
			);
		}

		const target = this.find(targetNodeId);
		if (!target) throw new Error(`Target node "${targetNodeId}" not found`); // not found

		// moving to self makes no sense
		if (isMove && target === src) throw new Error(`Cannot move to self`);

		// also moving to same parent makes no sense, as it is already there
		// if (isMove && target === src.parent) throw new Error(`Cannot move to same parent.`);
		// not throwing, just return noop src
		if (isMove && target === src.parent) return src;

		//
		if (isMove) {
			this.remove(src.id); // must come first
			return target.appendChild(src).__setReadonly(this._readonly);
		} else {
			return target.appendChild(src.deepClone()).__setReadonly(this._readonly);
		}
	}

	/**
	 * Moves a node (with its subtree) to become a child of the target node.
	 * @param srcNodeId The id of the node to move
	 * @param targetNodeId The id of the destination parent node
	 * @returns The moved TreeNode in its new location
	 * @throws Error if nodes not found, recursive reference detected, or moving to self
	 */
	move(srcNodeId: string, targetNodeId: string): TreeNode<T> {
		return this._moveOrCopy(srcNodeId, targetNodeId, true);
	}

	/**
	 * Copies a node (with its subtree) to become a child of the target node.
	 * @param srcNodeId The id of the node to copy
	 * @param targetNodeId The id of the destination parent node
	 * @returns The newly copied TreeNode
	 * @throws Error if nodes are not found
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
	 * @returns JSON string representation of the tree
	 */
	dump(): string {
		return JSON.stringify(this);
	}

	/**
	 * Restores tree state from serialized data.
	 * @param dump Serialized tree data (JSON string or DTO object)
	 * @returns This tree instance for chaining
	 */
	restore(dump: string | TreeNodeDTO<T>): Tree<T> {
		let parsed: TreeNodeDTO<T> = dump as any;
		if (typeof dump === "string") parsed = JSON.parse(dump);

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

		// walk again - cannot do that above, as it would disable adding children
		if (this._readonly) {
			[...this.postOrderTraversal()].map((n) =>
				n?.__setReadonly(this._readonly)
			);
		}

		this._root = root;
		return this;
	}

	/**
	 * Returns the total number of nodes in the tree or subtree.
	 * @param from Optional starting node (defaults to root for entire tree)
	 * @returns Number of nodes
	 */
	size(from?: TreeNode<T> | null): number {
		from ??= this._root;
		if (!from) return 0;
		const len = [...this.preOrderTraversal(from)].length;

		// special case length === 1 suspicion
		if (
			from !== this._root &&
			len === 1 &&
			!this.contains(from?.id as string)
		) {
			return 0;
		}

		return len;
	}

	/**
	 * Checks if a node with the given id exists in the tree.
	 * @param id The node id to check
	 * @param maxDepth Maximum depth to search (0 = unlimited)
	 * @returns True if node exists, false otherwise
	 */
	contains(id: string, maxDepth = 0): boolean {
		return !!this._root?.contains(id, maxDepth);
	}

	/**
	 * Checks if a node with the given value exists in the tree.
	 * @param value The value to search for
	 * @param maxDepth Maximum depth to search (0 = unlimited)
	 * @param compareFn Optional custom comparison function
	 * @returns True if value exists, false otherwise
	 */
	has(value: T, maxDepth = 0, compareFn?: (a: T, b: T) => boolean): boolean {
		return !!this._root?.has(value, maxDepth, compareFn);
	}

	/**
	 * Returns string representation of the tree (for debugging purposes).
	 * @returns Multi-line string showing tree structure with indentation
	 */
	toString(): string {
		return [...this.preOrderTraversal()].map((n) => n?.toString()).join("\n");
	}
}
