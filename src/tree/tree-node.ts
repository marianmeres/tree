export interface TreeNodeDTO<T> {
	key: string;
	value: T;
	children: TreeNodeDTO<T>[];
}

export class TreeNode<T> {
	protected _key: string;
	protected _children: TreeNode<T>[] = [];

	static createKey = () => 'n-' + Math.random().toString(36).slice(2, 10); // "n" as "node"

	constructor(
		public value: T,
		protected _parent: TreeNode<T> | null = null
	) {
		this._key = TreeNode.createKey();
	}

	// mainly for use in restore
	__setKey(key: string) {
		this._key = key;
		return this;
	}

	__setParent(parent: TreeNode<T> | null) {
		this._parent = parent;
		return this;
	}

	// will traverse downwards and set proper parent (used in node move/copy/append)
	__syncChildren() {
		const _walk = (children: TreeNode<T>[], parent: TreeNode<T> | null) => {
			for (let child of children) {
				child.__setParent(parent);
				_walk(child.children, child);
			}
		};
		return _walk(this._children, this);
	}

	get depth() {
		let parent = this._parent;
		let _depth = 0;
		while (parent) {
			_depth++;
			parent = parent.parent;
		}
		return _depth;
	}

	get root() {
		let parent = this._parent;
		while (parent) {
			parent = parent.parent;
		}
		return parent;
	}

	get key() {
		return this._key;
	}

	get parent() {
		return this._parent;
	}

	get children() {
		return this._children;
	}

	get isLeaf() {
		return this._children.length === 0;
	}

	get isRoot() {
		return this._parent === null;
	}

	deepClone() {
		// quick-n-dirty brute force
		const dto = JSON.parse(
			JSON.stringify(this.toJSON(), (k, v) => {
				// create new key
				if (k === 'key') return TreeNode.createKey();
				return v;
			})
		);

		const clone = new TreeNode(dto.value, this._parent);
		clone.__setKey(dto.key);

		const _walk = (children: TreeNodeDTO<T>['children'], parent: TreeNode<T>) => {
			for (let child of children) {
				const _node = parent.appendChild(child.value).__setKey(child.key);
				_walk(child.children, _node);
			}
		};
		_walk(dto.children, clone);

		return clone;
	}

	toJSON(): TreeNodeDTO<T> {
		return { key: this._key, value: this.value, children: this._children };
	}

	protected _assertSameTreeNode(node: TreeNode<T>) {
		if (node instanceof TreeNode && node.root !== this.root) {
			throw new Error(
				`Cannot proceed with a node from a different tree. (Use node's value instead.)`
			);
		}
	}

	protected _assertNotContains(node: TreeNode<T>) {
		if (node instanceof TreeNode && this.contains(node.key)) {
			throw new Error(`Cannot proceed, already contains. (Use node's value instead.)`);
		}
	}

	appendChild(valueOrNode: T | TreeNode<T>) {
		this._assertSameTreeNode(valueOrNode as any);
		this._assertNotContains(valueOrNode as any);

		const child =
			valueOrNode instanceof TreeNode ? valueOrNode : new TreeNode(valueOrNode, this);

		this._children.push(child);

		this.__syncChildren();

		return child;
	}

	removeChild(key) {
		const idx = this._children.findIndex((n) => n.key === key);
		if (idx > -1) {
			this._children.splice(idx, 1);
			return this;
		}
		return false;
	}

	replaceChild(key, valueOrNode: T | TreeNode<T>): TreeNode<T> | false {
		this._assertSameTreeNode(valueOrNode as any);
		const idx = this._children.findIndex((n) => n.key === key);
		if (idx > -1) {
			this._assertNotContains(valueOrNode as any);
			const child =
				valueOrNode instanceof TreeNode ? valueOrNode : new TreeNode(valueOrNode, this);
			this._children[idx] = child;
			this.__syncChildren();
			return this._children[idx];
		}
		return false;
	}

	resetChildren(values: (T | TreeNode<T>)[] = []) {
		this._children = [];
		(values || []).forEach((v) => this.appendChild(v));
		return this;
	}

	get siblings() {
		return this._parent?.children || [];
	}

	previousSibling() {
		if (this.siblings.length) {
			const selfIdx = this.siblings.findIndex((n) => n.key === this._key);
			return this.siblings[selfIdx - 1] || null;
		}
		return null;
	}

	nextSibling() {
		if (this.siblings.length) {
			const selfIdx = this.siblings.findIndex((n) => n.key === this._key);
			return this.siblings[selfIdx + 1] || null;
		}
		return null;
	}

	contains(key: string) {
		if (!key) return false;

		const _walk = (children: TreeNode<T>[]) => {
			for (let child of children) {
				if (child.key === key) return true;
				if (_walk(child.children)) return true;
			}
			return false;
		};

		return _walk(this._children);
	}

	toString() {
		return '    '.repeat(this.depth) + this.value?.toString(); // + ` (${this.key})`;
	}
}
