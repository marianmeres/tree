import { TreeNode, type TreeNodeDTO } from "./tree-node.ts";

/** The top Tree data structure class abstraction */
export class Tree<T> {
	constructor(
		protected _root: TreeNode<T> | null = null,
		protected _readonly = false
	) {
		if (this._root) {
			this._root.__setTree(this).__setReadonly(this._readonly).__syncChildren();
		}
	}

	/** Returns boolean whether the tree is marked as readonly */
	get readonly(): boolean {
		return this._readonly;
	}

	/** Sets internal readonly flag */
	__setReadonly(flag: boolean = true): Tree<T> {
		this._readonly = !!flag;
		if (this._root) this._root.__setReadonly(this._readonly).__syncChildren();
		return this;
	}

	/** Creates new Tree from provided input */
	static factory<T>(dump: string | TreeNodeDTO<T>, _readonly = false): Tree<T> {
		return new Tree<T>(null, _readonly).restore(dump);
	}

	/** Appends new node to the tree */
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

	/** Gets the root node */
	get root(): TreeNode<T> | null {
		return this._root;
	}

	/** Depth-first, pre-order... https://en.wikipedia.org/wiki/Tree_traversal */
	*preOrderTraversal(node?: TreeNode<T> | null): Generator<TreeNode<T> | null> {
		node ??= this._root;
		yield node;
		if (node?.children.length) {
			for (const child of node.children) {
				yield* this.preOrderTraversal(child);
			}
		}
	}

	/** Depth-first, post-order... https://en.wikipedia.org/wiki/Tree_traversal */
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

	/** Breadth-first, level-order traversal */
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

	/** Searches nodes by given id */
	find(id: string): TreeNode<T> | null {
		if (!id) new Error(`Missing id`);
		for (const node of this.preOrderTraversal()) {
			if (node?.id === id) return node;
		}
		return null;
	}

	/** Searches nodes by given value or prop+value pair  */
	findBy(
		valueOrPropValue: any,
		propName: string | null = null,
		valueCompareEqualFn?: (a: T, b: T) => boolean
	): TreeNode<T> | null {
		// strict compare by default
		valueCompareEqualFn ??= (a: T, b: T) => a === b;

		for (const node of this.preOrderTraversal()) {
			if (!node) return null;
			// search by prop + value
			else if (
				propName &&
				(node as any)?.value[propName] !== undefined &&
				(node as any)?.value[propName] === valueOrPropValue
			) {
				return node;
			}
			// search by value only
			else if (
				!propName &&
				valueCompareEqualFn(node?.value, valueOrPropValue)
			) {
				return node;
			}
		}
		return null;
	}

	/** Searches for lowest common ancestor of the two nodes */
	findLCA(node1Id: string, node2Id: string): TreeNode<T> | null {
		// some empty arg? -> no lca
		if (!node1Id || !node1Id) new Error(`Missing id`);

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

	/** Inserts new node under given node id */
	insert(parentNodeId: string, value: T): TreeNode<T> {
		const node = this.find(parentNodeId);
		if (node) {
			return node.appendChild(value).__setReadonly(this._readonly);
		}
		throw new Error(`Node "${parentNodeId}" not found`);
	}

	/** Removes node by id */
	remove(id: string): Tree<T> {
		if (!id) new Error(`Missing id`);

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

	/** Moves node */
	move(srcNodeId: string, targetNodeId: string): TreeNode<T> {
		return this._moveOrCopy(srcNodeId, targetNodeId, true);
	}

	/** Copies node */
	copy(srcNodeId: string, targetNodeId: string): TreeNode<T> {
		return this._moveOrCopy(srcNodeId, targetNodeId, false);
	}

	/** Returns internal data structure */
	toJSON(): TreeNodeDTO<T> | undefined {
		return this._root?.toJSON();
	}

	/** Returns internal data structure as string */
	dump(): string {
		return JSON.stringify(this);
	}

	/** Restores internal state from given input */
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

	/** Returns total number of nodes in the tree */
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

	/** Returns boolean wheather the id exists in the tree */
	contains(id: string, maxDepth = 0): boolean {
		return !!this._root?.contains(id, maxDepth);
	}

	has(value: T, maxDepth = 0, compareFn?: (a: T, b: T) => boolean): boolean {
		return !!this._root?.has(value, maxDepth, compareFn);
	}

	/** Returns textual representation of the tree (for debugging purposes) */
	toString(): string {
		return [...this.preOrderTraversal()].map((n) => n?.toString()).join("\n");
	}
}
