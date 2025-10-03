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

	/** Searches nodes by given key */
	find(key: string): TreeNode<T> | null {
		if (!key) new Error(`Missing key.`);
		for (const node of this.preOrderTraversal()) {
			if (node?.key === key) return node;
		}
		return null;
	}

	/** Searches nodes by given value or prop+value pair  */
	findBy(
		valueOrPropValue: any,
		propName: string | null = null
	): TreeNode<T> | null {
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
			else if (!propName && node?.value === valueOrPropValue) {
				return node;
			}
		}
		return null;
	}

	/** Searches for lowest common ancestor of the two nodes */
	findLCA(node1Key: string, node2Key: string): TreeNode<T> | null {
		// some empty arg? -> no lca
		if (!node1Key || !node1Key) new Error(`Missing key/s.`);

		// find starting bottom nodes
		const n1 = this.find(node1Key);
		const n2 = this.find(node2Key);

		// some not found? -> no lca
		if (!n1 || !n2)
			throw new Error(`Node "${node1Key}" and/or "${node2Key}" not found.`);

		// same nodes? -> lca
		if (n1 === n2) return n1;

		// create a lookup map of hierarchy nodes from one path
		const map1: Record<string, TreeNode<T>> = n1.path.reduce(
			(m, n) => ({ ...m, [n.key]: n }),
			{}
		);

		// now traverse the other (path is sorted top-down) and return the lowest match
		let lca = this._root;
		for (const n of n2.path) {
			if (!map1[n.key]) return lca;
			lca = map1[n.key];
		}

		//
		return lca;
	}

	/** Inserts new node under given node key */
	insert(parentNodeKey: string, value: T): TreeNode<T> {
		const node = this.find(parentNodeKey);
		if (node) {
			return node.appendChild(value).__setReadonly(this._readonly);
		}
		throw new Error(`Node "${parentNodeKey}" not found.`);
	}

	/** Removes node by key */
	remove(key: string): Tree<T> {
		if (!key) new Error(`Missing key.`);

		if (this._root?.key === key) {
			this._root = null;
			return this;
		}

		for (const node of this.preOrderTraversal()) {
			if (node?.key === key && node?.parent?.removeChild(key)) {
				return this;
			}
		}

		throw new Error(`Node "${key}" not found.`);
	}

	protected _moveOrCopy(
		srcNodeKey: string,
		targetNodeKey: string,
		isMove: boolean
	): TreeNode<T> {
		const src = this.find(srcNodeKey);
		if (!src) throw new Error(`Source node "${srcNodeKey}" not found.`);

		// recursive reference is not allowed
		if (isMove && src.contains(targetNodeKey)) {
			throw new Error(
				`Recursive reference detected. Node cannot be moved to its own descendant.`
			);
		}

		const target = this.find(targetNodeKey);
		if (!target) throw new Error(`Target node "${targetNodeKey}" not found.`); // not found

		// moving to self makes no sense
		if (isMove && target === src) throw new Error(`Cannot move to self.`);

		// also moving to same parent makes no sense, as it is already there
		// if (isMove && target === src.parent) throw new Error(`Cannot move to same parent.`);
		// not throwing, just return noop src
		if (isMove && target === src.parent) return src;

		//
		if (isMove) {
			this.remove(src.key); // must come first
			return target.appendChild(src).__setReadonly(this._readonly);
		} else {
			return target.appendChild(src.deepClone()).__setReadonly(this._readonly);
		}
	}

	/** Moves node */
	move(srcNodeKey: string, targetNodeKey: string): TreeNode<T> {
		return this._moveOrCopy(srcNodeKey, targetNodeKey, true);
	}

	/** Copies node */
	copy(srcNodeKey: string, targetNodeKey: string): TreeNode<T> {
		return this._moveOrCopy(srcNodeKey, targetNodeKey, false);
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
					.__setKey(child.key);
				_walk(child.children, node);
			}
		};

		const root = new TreeNode(parsed.value)
			.__setTree(this)
			.__setKey(parsed.key);
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
			!this.contains(from?.key as string)
		) {
			return 0;
		}

		return len;
	}

	/** Returns boolean wheather the key exists in the tree */
	contains(key: string): boolean {
		return !!this._root?.contains(key);
	}

	/** Returns textual representation of the tree (for debugging purposes) */
	toString(): string {
		return [...this.preOrderTraversal()].map((n) => n?.toString()).join("\n");
	}
}
