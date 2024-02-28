import { TreeNode, TreeNodeDTO } from './tree-node.js';

// initial inspiration https://www.30secondsofcode.org/js/s/data-structures-tree/

export class Tree<T> {
	constructor(protected _root: TreeNode<T> | null = null) {
		if (this._root) this._root.__setTree(this);
	}

	static factory<T>(dump: string | TreeNodeDTO<T>) {
		return new Tree().restore(dump);
	}

	appendChild(valueOrNode: T | TreeNode<T>): TreeNode<T> {
		if (this._root) {
			return this._root.appendChild(valueOrNode);
		} else {
			this._root =
				valueOrNode instanceof TreeNode ? valueOrNode : new TreeNode(valueOrNode);
			this._root.__setTree(this);
			this._root.__syncChildren();
			return this._root;
		}
	}

	get root() {
		return this._root;
	}

	// https://en.wikipedia.org/wiki/Tree_traversal
	// Depth-first, pre-order
	*preOrderTraversal(node?: TreeNode<T> | null) {
		node ??= this._root;
		yield node;
		if (node?.children.length) {
			for (let child of node.children) {
				yield* this.preOrderTraversal(child);
			}
		}
	}

	// https://en.wikipedia.org/wiki/Tree_traversal
	// Depth-first, post-order
	*postOrderTraversal(node?: TreeNode<T> | null) {
		node ??= this._root;
		if (node?.children.length) {
			for (let child of node.children) {
				yield* this.postOrderTraversal(child);
			}
		}
		yield node;
	}

	find(key: string): TreeNode<T> | null {
		for (let node of this.preOrderTraversal()) {
			if (node.key === key) return node;
		}
		return null;
	}

	findBy(valueOrPropValue: any, propName: string | null = null) {
		for (let node of this.preOrderTraversal()) {
			// search by prop + value
			if (
				propName &&
				node.value[propName] !== undefined &&
				node.value[propName] === valueOrPropValue
			) {
				return node;
			}
			// search by value only
			else if (!propName && node.value === valueOrPropValue) {
				return node;
			}
		}
		return null;
	}

	// lowest common ancestor
	findLCA(node1Key: string, node2Key: string): TreeNode<T> | null {
		// some empty arg? -> no lca
		if (!node1Key || !node1Key) return null;

		// find starting bottom nodes
		const n1 = this.find(node1Key);
		const n2 = this.find(node2Key);

		// some not found? -> no lca
		if (!n1 || !n2) return null;

		// same nodes? -> lca
		if (n1 === n2) return n1;

		// create a lookup map of hierarchy nodes from one path
		const map1 = n1.path.reduce((m, n) => ({ ...m, [n.key]: n }), {});

		// now traverse the other (path is sorted top-down) and return the lowest match
		let lca = this._root;
		for (let n of n2.path) {
			if (!map1[n.key]) return lca;
			lca = map1[n.key];
		}

		//
		return lca;
	}

	insert(parentNodeKey: string, value: T) {
		const node = this.find(parentNodeKey);
		if (node) {
			return node.appendChild(value);
		}
		return false;
	}

	remove(key: string) {
		if (!key) return false;

		if (this._root?.key === key) {
			this._root = null;
			return this;
		}

		for (let node of this.preOrderTraversal()) {
			if (node.removeChild(key)) {
				return this;
			}
		}

		return false;
	}

	protected _moveOrCopy(srcNodeKey: string, targetNodeKey: string, isMove: boolean) {
		const src = this.find(srcNodeKey);
		if (!src) return false;

		// cyclic reference is not allowed
		if (src.contains(targetNodeKey)) {
			throw new Error(`Cyclic reference detected.`);
		}

		const target = this.find(targetNodeKey);
		if (!target) return false;
		if (target.contains(src.key)) return false; // already there

		//
		if (isMove) {
			target.appendChild(src);
			this.remove(src.key);
		} else {
			target.appendChild(src.deepClone());
		}

		return this;
	}

	move(srcNodeKey: string, targetNodeKey: string) {
		return this._moveOrCopy(srcNodeKey, targetNodeKey, true);
	}

	copy(srcNodeKey: string, targetNodeKey: string) {
		return this._moveOrCopy(srcNodeKey, targetNodeKey, false);
	}

	toJSON() {
		return this._root?.toJSON();
	}

	dump() {
		return JSON.stringify(this);
	}

	restore(dump: string | TreeNodeDTO<T>) {
		let parsed: TreeNodeDTO<T> = dump as any;
		if (typeof dump === 'string') parsed = JSON.parse(dump);

		const _walk = (children: TreeNodeDTO<T>['children'], parent: TreeNode<T>) => {
			for (let child of children) {
				const node = parent.appendChild(child.value, false).__setKey(child.key);
				_walk(child.children, node);
			}
		};

		const root = new TreeNode(parsed.value).__setKey(parsed.key);
		_walk(parsed.children, root);

		this._root = root;
		return this;
	}

	size(from?: TreeNode<T> | null) {
		from ??= this._root;
		if (!from) return 0;
		if (from !== this._root && !this.contains(from?.key as string)) return 0;
		return [...this.preOrderTraversal(from)].length;
	}

	contains(key: string) {
		return !!this._root?.contains(key);
	}

	toString() {
		return [...this.preOrderTraversal()].map((n) => n?.toString()).join('\n');
	}
}
