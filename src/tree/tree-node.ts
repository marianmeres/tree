import type { Tree } from "./tree.ts";

/** Tree node data transfer object */
export interface TreeNodeDTO<T> {
	id: string;
	value: T;
	children: TreeNodeDTO<T>[];
}

/** The the node abstraction class */
export class TreeNode<T> {
	protected _id: string;
	protected _children: TreeNode<T>[] = [];
	protected _readonly: boolean = false;

	/** Returns random id (prefixed with "n" so it will be safe to use as html el id) */
	static createId(): string {
		return "n" + Math.random().toString(36).slice(2, 10);
	}

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

	/** Sets the "id" of the node */
	__setId(id: string): TreeNode<T> {
		this._id = id;
		return this;
	}

	/** Sets the parent of the node */
	__setParent(parent: TreeNode<T> | null): TreeNode<T> {
		this._parent = parent;
		return this;
	}

	/** Sets the tree reference of the node */
	__setTree(tree: Tree<T> | null): TreeNode<T> {
		this.tree = tree;
		return this;
	}

	/** Sets the readonly reference of the node */
	__setReadonly(flag: boolean = true): TreeNode<T> {
		this._readonly = flag;
		return this;
	}

	/** Will traverse downwards and set proper parent (used in node move/copy/append) */
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

	/** Gets the depth of the node */
	get depth(): number {
		return this.path.length;
	}

	/** Gets the readonly flag of the node */
	get readonly(): boolean {
		return this._readonly;
	}

	/** Gets the root node of the node */
	get root(): TreeNode<T> | null {
		let parent = this._parent;
		let _lastNotEmpty = parent;
		while (parent) {
			parent = parent.parent;
			if (parent) _lastNotEmpty = parent;
		}
		return _lastNotEmpty;
	}

	/** Returns array of nodes as a ancestors hierarchy path (self included) */
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

	/** Gets the node id */
	get id(): string {
		return this._id;
	}

	/** Gets the node parent */
	get parent(): TreeNode<T> | null {
		return this._parent;
	}

	/** Gets the node's array of child nodes */
	get children(): TreeNode<T>[] {
		return this._children;
	}

	/** Returns boolean whether the node is a leaf */
	get isLeaf(): boolean {
		return this._children.length === 0;
	}

	/** Returns boolean whether the node is a root node */
	get isRoot(): boolean {
		return this._parent === null;
	}

	/** Returns the node's array of sibling nodes*/
	get siblings(): TreeNode<T>[] {
		return this._parent?.children || [];
	}

	/** Returns the node's index in the array of sibling nodes */
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

	/** Returns the data representation of the node */
	toJSON(): TreeNodeDTO<T> {
		return { id: this._id, value: this.value, children: this._children };
	}

	/** Deep clones current node (with new id) */
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

	/** Appends node to the children array */
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

	/** Removes node by id */
	removeChild(id: string): TreeNode<T> {
		this._assertNotReadonly();
		const idx = this._children.findIndex((n) => n.id === id);
		if (idx < 0) throw new Error(`Node "${id}" not found`);

		this._children.splice(idx, 1);
		return this;
	}

	/** Replaces node (identified by id) with the one provided */
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

	/** Empties existing and adds provided children */
	resetChildren(valuesOrNodes: (T | TreeNode<T>)[] = []): TreeNode<T> {
		this._assertNotReadonly();
		this._children = [];
		(valuesOrNodes || []).forEach((v) => this.appendChild(v, false));
		this.__syncChildren();
		return this;
	}

	/** Returns previous sibling (relative from self) */
	previousSibling(): TreeNode<T> | null {
		if (this.siblings.length) {
			const selfIdx = this.siblings.findIndex((n) => n.id === this._id);
			return this.siblings[selfIdx - 1] || null;
		}
		return null;
	}

	/** Returns next sibling (relative from self) */
	nextSibling(): TreeNode<T> | null {
		if (this.siblings.length) {
			const selfIdx = this.siblings.findIndex((n) => n.id === this._id);
			return this.siblings[selfIdx + 1] || null;
		}
		return null;
	}

	/** Moves self to another sibling index */
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

	/** Returns boolean whether the provided id exists within children.
	 * Looks down to the maxDepth level (if non-zero, otherwise no limit). */
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

	/** Returns boolean whether the provided value exists within children.
	 * Looks down to the maxDepth level (if non-zero, otherwise no limit). */
	has(value: T, maxDepth = 0, compareFn?: (a: T, b: T) => boolean) {
		// strict compare by default
		compareFn ??= (a: T, b: T) => a === b;

		const _walk = (children: TreeNode<T>[], depth: number) => {
			if (maxDepth > 0 && ++depth > maxDepth) return false;
			for (const child of children) {
				// console.log(child.value, value);
				if (compareFn(child.value, value)) return true;
				if (_walk(child.children, depth)) return true;
			}
			return false;
		};

		return _walk(this._children, 0);
	}

	/** Returns string representation (for debugging purposes) */
	toString(): string {
		let s = this.value?.toString();
		if (s === "[object Object]") s = this.id;
		return "    ".repeat(this.depth) + s;
	}
}
