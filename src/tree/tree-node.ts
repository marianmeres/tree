import { Tree } from './tree.js';

export interface TreeNodeDTO<T> {
	key: string;
	value: T;
	children: TreeNodeDTO<T>[];
}

export class TreeNode<T> {
	protected _key: string;
	protected _children: TreeNode<T>[] = [];
	protected _readonly: boolean = false;

	// prefixing with "n" (as "node") so it will be safe to use as html el id (cannot start with digit)
	static createKey = () => 'n' + Math.random().toString(36).slice(2, 10);

	constructor(
		public value: T,
		protected _parent: TreeNode<T> | null = null,
		// just a convenience reference
		public tree: Tree<T> | null = null
	) {
		this._key = TreeNode.createKey();
	}

	// the "__XYZ" methods below are public, but not meant as a true userland api (mostly used
	// internally)... this is a consciously pragmatic decision (yet somewhat ugly from the
	// OO design point of view)

	// mainly for use in restore
	__setKey(key: string) {
		this._key = key;
		return this;
	}

	__setParent(parent: TreeNode<T> | null) {
		this._parent = parent;
		return this;
	}

	__setTree(tree: Tree<T> | null) {
		this.tree = tree;
		return this;
	}

	__setReadonly(flag: boolean = true) {
		this._readonly = flag;
		return this;
	}

	// will traverse downwards and set proper parent (used in node move/copy/append)
	__syncChildren() {
		const _walk = (children: TreeNode<T>[], parent: TreeNode<T> | null) => {
			for (let child of children) {
				child
					.__setParent(parent)
					.__setTree(parent?.tree || null)
					.__setReadonly(parent?.readonly);
				_walk(child.children, child);
			}
		};
		return _walk(this._children, this);
	}

	get depth() {
		return this.path.length;
	}

	get readonly() {
		return this._readonly;
	}

	get root() {
		let parent = this._parent;
		let _lastNotEmpty = parent;
		while (parent) {
			parent = parent.parent;
			if (parent) _lastNotEmpty = parent;
		}
		return _lastNotEmpty;
	}

	// returns array of nodes as a hierarchy path
	get path() {
		let parent = this._parent;
		let path: TreeNode<T>[] = [];
		if (parent) path.push(parent);
		while (parent) {
			parent = parent.parent;
			if (parent) path.unshift(parent);
		}
		return path;
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

	get siblings() {
		return this._parent?.children || [];
	}

	get siblingIndex() {
		if (this.siblings.length) {
			return this.siblings.findIndex((n) => n.key === this._key);
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
		if (node instanceof TreeNode && this.contains(node.key)) {
			throw new Error(`Cannot proceed, already contains.`);
		}
	}

	protected _assertIsNotSiblingOf(node: TreeNode<T>) {
		if (node instanceof TreeNode && this.siblings.some((s) => s.key === node.key)) {
			throw new Error(`Cannot proceed (is sibling of).`);
		}
	}

	toJSON(): TreeNodeDTO<T> {
		return { key: this._key, value: this.value, children: this._children };
	}

	deepClone(): TreeNode<T> {
		// quick-n-dirty
		const dto: TreeNodeDTO<T> = JSON.parse(
			JSON.stringify(this.toJSON(), (k, v) => {
				// create new key
				if (k === 'key') return TreeNode.createKey();
				return v;
			})
		);

		const clone = new TreeNode<T>(dto.value, this._parent);
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

	appendChild(valueOrNode: T | TreeNode<T>, _sync = true) {
		this._assertNotReadonly();
		this._assertSameTopRootNode(valueOrNode as any);
		this._assertIsNotSiblingOf(valueOrNode as any);

		const child =
			valueOrNode instanceof TreeNode ? valueOrNode : new TreeNode(valueOrNode, this);
		child.__setParent(this);
		this._children.push(child);

		// allow to skip sync via flag (optimizing for bulk and/or restore operations)
		_sync && this.__syncChildren();

		return child;
	}

	removeChild(key: string) {
		this._assertNotReadonly();
		const idx = this._children.findIndex((n) => n.key === key);
		if (idx < 0) throw new Error(`Node "${key}" not found.`);

		this._children.splice(idx, 1);
		return this;
	}

	replaceChild(key: string, valueOrNode: T | TreeNode<T>): TreeNode<T> | false {
		this._assertNotReadonly();
		this._assertSameTopRootNode(valueOrNode as any);

		const idx = this._children.findIndex((n) => n.key === key);
		if (idx < 0) throw new Error(`Node "${key}" not found.`);

		this._assertNotContains(valueOrNode as any);
		const child =
			valueOrNode instanceof TreeNode ? valueOrNode : new TreeNode(valueOrNode, this);
		child.__setParent(this);
		this._children[idx] = child;
		this.__syncChildren();
		return this._children[idx];
	}

	resetChildren(valuesOrNodes: (T | TreeNode<T>)[] = []) {
		this._assertNotReadonly();
		this._children = [];
		(valuesOrNodes || []).forEach((v) => this.appendChild(v, false));
		this.__syncChildren();
		return this;
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

	moveSiblingIndex(toIndex: number) {
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

	contains(key: string) {
		if (!key) throw new Error(`Missing key`);

		// self does not contain self, so must not return true
		// if (this._key === key) return true;

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
		let s = this.value?.toString();
		if (s === '[object Object]') s = this.key;
		return '    '.repeat(this.depth) + s;
	}
}
